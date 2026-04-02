import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { requireAuth, hasRole } from '../middleware/auth.js';
import { applyActiveShop } from '../middleware/applyActiveShop.js';
import { sendPushToUsers } from '../push.js';
import { canTransition } from '../utils/transitions.js';

const router = Router();

router.use(requireAuth, applyActiveShop);

/** Upsert an array of bike labels and return their ids in a single query. */
async function resolveBikeIds(client, labels) {
  const unique = [...new Set(labels.map(l => l.trim().toUpperCase()))];
  if (!unique.length) return [];
  const { rows } = await client.query(
    `insert into bikes (label)
     select unnest($1::text[])
     on conflict (label) do update set updated_at = now()
     returning id`,
    [unique]
  );
  return rows.map(r => r.id);
}

async function attachBikes(client, requestId, bikeIds) {
  await client.query('delete from request_bikes where request_id = $1', [requestId]);
  if (!bikeIds.length) return;
  await client.query(
    `insert into request_bikes (request_id, bike_id, position)
     select $1, unnest($2::uuid[]), generate_subscripts($2::uuid[], 1)
     on conflict do nothing`,
    [requestId, bikeIds]
  );
}

async function auditLog(client, requestId, action, payload, userId) {
  await client.query(
    'insert into request_audit_log (request_id, action, payload, user_id) values ($1, $2, $3, $4)',
    [requestId, action, payload ? JSON.stringify(payload) : null, userId]
  );
}

// ── Schemas ────────────────────────────────────────────────────────────────

const createSchema = z.object({
  from_shop_id: z.string().uuid(),
  to_shop_id:   z.string().uuid(),
  reason:       z.enum(['rental','repair','return']),
  date_rental:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bikes:        z.array(z.string().min(1)).min(1),
  note:         z.string().max(1000).optional(),
});

const patchSchema = z.object({
  from_shop_id: z.string().uuid().optional(),
  to_shop_id:   z.string().uuid().optional(),
  reason:       z.enum(['rental','repair','return']).optional(),
  date_rental:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  bikes:        z.array(z.string().min(1)).min(1).optional(),
  note:         z.string().max(1000).nullable().optional(),
  brm_blocked:  z.boolean().optional(),
  version:      z.number().int(),
});

const statusSchema = z.object({
  to: z.enum(['in_progress','done','cancelled']),
});

// ── Scope helper ──────────────────────────────────────────────────────────

function shopScope(user) {
  if (hasRole(user, 'admin', 'organiser')) return null;   // no restriction
  return user.shop_id;
}

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/requests — cleaner cannot see deliveries
router.get('/', async (req, res, next) => {
  try {
    if (hasRole(req.user, 'cleaner') && !hasRole(req.user, 'admin', 'organiser', 'driver', 'mechanic', 'general')) {
      return res.json({ data: [], total: 0, hasMore: false });
    }

    const status    = req.query.status ?? 'active';
    const shopParam = req.query.shop   ?? null;
    const scope     = shopScope(req.user);
    const limit     = Math.min(Math.max(parseInt(req.query.limit  ?? '20', 10), 1), 100);
    const offset    = Math.max(parseInt(req.query.offset ?? '0', 10), 0);

    let statusFilter;
    if (status === 'active') statusFilter = ["'open'", "'in_progress'"];
    else if (status === 'all') statusFilter = null;
    else statusFilter = [`'${status}'`];

    const conditions = [];
    const params = [];

    if (statusFilter) {
      conditions.push(`r.status in (${statusFilter.join(',')})`);
    }

    if (scope) {
      params.push(scope);
      conditions.push(`(r.from_shop_id = $${params.length} or r.to_shop_id = $${params.length})`);
    } else if (shopParam) {
      params.push(shopParam);
      const idx = params.length;
      conditions.push(`(fs.name ilike $${idx} or ts.name ilike $${idx} or r.from_shop_id::text = $${idx} or r.to_shop_id::text = $${idx})`);
    }

    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';

    const countSql = `
      select count(distinct r.id)
        from requests r
        join shops fs on fs.id = r.from_shop_id
        join shops ts on ts.id = r.to_shop_id
       ${where}
    `;
    const { rows: countRows } = await pool.query(countSql, params);
    const total = parseInt(countRows[0].count, 10);

    const pageParams = [...params, limit, offset];
    const sql = `
      select r.*,
             fs.name as from_shop_name,
             ts.name as to_shop_name,
             json_agg(json_build_object('id', b.id, 'label', b.label) order by rb.position) filter (where b.id is not null) as bikes
        from requests r
        join shops fs on fs.id = r.from_shop_id
        join shops ts on ts.id = r.to_shop_id
        left join request_bikes rb on rb.request_id = r.id
        left join bikes b on b.id = rb.bike_id
       ${where}
       group by r.id, fs.name, ts.name
       order by r.date_rental asc, r.status asc, r.created_at desc
       limit $${pageParams.length - 1} offset $${pageParams.length}
    `;

    const { rows } = await pool.query(sql, pageParams);
    res.json({ data: rows, total, hasMore: offset + limit < total });
  } catch (err) {
    next(err);
  }
});

// POST /api/requests — all roles except cleaner
router.post('/', async (req, res, next) => {
  if (hasRole(req.user, 'cleaner') && !hasRole(req.user, 'admin', 'organiser', 'driver', 'mechanic', 'general')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const client = await pool.connect();
  try {
    const data = createSchema.parse(req.body);
    if (data.from_shop_id === data.to_shop_id) {
      return res.status(400).json({ error: 'from_shop_id and to_shop_id must differ' });
    }

    await client.query('begin');

    const bikeIds = await resolveBikeIds(client, data.bikes);

    const { rows } = await client.query(
      `insert into requests (from_shop_id, to_shop_id, reason, date_rental, note, created_by_user_id)
       values ($1, $2, $3, $4, $5, $6)
       returning *`,
      [data.from_shop_id, data.to_shop_id, data.reason, data.date_rental, data.note ?? null, req.user.id]
    );
    const request = rows[0];

    await attachBikes(client, request.id, bikeIds);
    await auditLog(client, request.id, 'created', null, req.user.id);

    // Notify all drivers and admins about the new delivery
    const { rows: shopRows } = await client.query(
      'select fs.name as from_name, ts.name as to_name from shops fs, shops ts where fs.id = $1 and ts.id = $2',
      [data.from_shop_id, data.to_shop_id]
    );
    const { from_name, to_name } = shopRows[0];
    const reasonLabel = { rental: 'Rental', repair: 'Repair', return: 'Return' }[data.reason] ?? data.reason;
    const bikeCount   = bikeIds.length;

    const { rows: driverRows } = await client.query(
      `select id from users where roles && array['driver','admin']::text[] and is_active = true`
    );
    const notifyIds = driverRows.map(r => r.id).filter(id => id !== req.user.id);

    if (notifyIds.length) {
      await sendPushToUsers(client, notifyIds, {
        title: `🚲 New delivery: ${from_name} → ${to_name}`,
        body:  `${reasonLabel} · ${bikeCount} bike${bikeCount !== 1 ? 's' : ''}`,
      });
    }

    await client.query('commit');
    res.status(201).json(request);
  } catch (err) {
    await client.query('rollback');
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  } finally {
    client.release();
  }
});

// GET /api/requests/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select r.*,
              fs.name as from_shop_name,
              ts.name as to_shop_name,
              json_agg(json_build_object('id', b.id, 'label', b.label) order by rb.position) filter (where b.id is not null) as bikes
         from requests r
         join shops fs on fs.id = r.from_shop_id
         join shops ts on ts.id = r.to_shop_id
         left join request_bikes rb on rb.request_id = r.id
         left join bikes b on b.id = rb.bike_id
        where r.id = $1
        group by r.id, fs.name, ts.name`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/requests/:id
router.patch('/:id', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const data = patchSchema.parse(req.body);

    await client.query('begin');

    const { rows } = await client.query(
      'select * from requests where id = $1 for update',
      [req.params.id]
    );
    const existing = rows[0];
    if (!existing) { await client.query('rollback'); return res.status(404).json({ error: 'Not found' }); }
    if (existing.version !== data.version) {
      await client.query('rollback');
      return res.status(409).json({ error: 'Conflict: version mismatch. Reload and retry.' });
    }

    const fields = [];
    const params = [req.params.id];

    const add = (col, val) => { params.push(val); fields.push(`${col} = $${params.length}`); };

    if (data.from_shop_id)       add('from_shop_id', data.from_shop_id);
    if (data.to_shop_id)         add('to_shop_id',   data.to_shop_id);
    if (data.reason)             add('reason',        data.reason);
    if (data.date_rental)        add('date_rental',   data.date_rental);
    if (data.note !== undefined) add('note',          data.note ?? null);
    if (data.brm_blocked !== undefined) add('brm_blocked', data.brm_blocked);

    add('updated_by_user_id', req.user.id);
    add('version', existing.version + 1);
    add('updated_at', new Date());

    const { rows: updated } = await client.query(
      `update requests set ${fields.join(', ')} where id = $1 returning *`,
      params
    );

    if (data.bikes) {
      const bikeIds = await resolveBikeIds(client, data.bikes);
      await attachBikes(client, req.params.id, bikeIds);
    }

    await auditLog(client, req.params.id, 'updated', data, req.user.id);
    await client.query('commit');
    res.json(updated[0]);
  } catch (err) {
    await client.query('rollback');
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  } finally {
    client.release();
  }
});

// POST /api/requests/:id/status
router.post('/:id/status', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { to } = statusSchema.parse(req.body);

    await client.query('begin');

    const { rows } = await client.query(
      'select * from requests where id = $1 for update',
      [req.params.id]
    );
    const request = rows[0];
    if (!request) { await client.query('rollback'); return res.status(404).json({ error: 'Not found' }); }

    if (!canTransition(request.status, to, req.user.roles)) {
      await client.query('rollback');
      return res.status(403).json({ error: `Transition ${request.status} → ${to} not allowed for your role` });
    }

    const { rows: updated } = await client.query(
      `update requests
          set status = $2, updated_by_user_id = $3, version = version + 1, updated_at = now()
        where id = $1
        returning *`,
      [req.params.id, to, req.user.id]
    );

    await auditLog(client, req.params.id, `status:${request.status}→${to}`, { from: request.status, to }, req.user.id);

    // Fetch bike labels + shop names once for transitions that need them (avoids duplicate queries)
    let bikeRows = [], shopRows = [];
    if (to === 'in_progress' || to === 'done') {
      ({ rows: bikeRows } = await client.query(
        'select b.label from bikes b join request_bikes rb on rb.bike_id = b.id where rb.request_id = $1 order by rb.position',
        [req.params.id]
      ));
      ({ rows: shopRows } = await client.query(
        'select fs.name as from_name, ts.name as to_name from shops fs, shops ts where fs.id = $1 and ts.id = $2',
        [request.from_shop_id, request.to_shop_id]
      ));
    }
    const { from_name, to_name } = shopRows[0] ?? {};
    const bikeLabels   = bikeRows.map(b => b.label).join(', ');
    const bikeLabelArr = bikeRows.map(b => b.label);

    if (to === 'in_progress') {
      await sendPushToUsers(client, [req.user.id], {
        title: `🔒 Block bikes in BRM`,
        body:  `${from_name} → ${to_name} · ${bikeLabels}`,
      });
    }

    if (to === 'done') {
      await client.query(
        `update bikes b
            set current_shop_id = r.to_shop_id, updated_at = now()
           from request_bikes rb
           join requests r on r.id = rb.request_id
          where rb.bike_id = b.id and rb.request_id = $1`,
        [req.params.id]
      );

      {
        const reasonLabel = { rental: 'Rental', repair: 'Repair', return: 'Return' }[request.reason] ?? request.reason;

        if (request.reason === 'repair') {
          // Auto-create repair request
          await client.query(
            `insert into repair_requests
               (shop_id, bike_labels, arrival_date, problem_description, created_from_request_id, created_by_user_id)
             values ($1, $2, $3, $4, $5, $6)`,
            [
              request.to_shop_id,
              bikeLabelArr,
              new Date().toISOString().slice(0, 10),
              request.note ?? null,
              request.id,
              req.user.id,
            ]
          );

          // One-time task: change bike status to repair in system
          await client.query(
            `insert into tasks (shop_id, title, description, recurrence_unit, recurrence_interval, is_one_time, created_by_user_id)
             values ($1, $2, $3, 'day', 1, true, $4)`,
            [
              request.to_shop_id,
              `Change bike in system to "repair": ${bikeLabels}`,
              `Repair delivery from ${from_name} has arrived at ${to_name}. Change the above bike(s) to "repair" status in the reservation system.`,
              req.user.id,
            ]
          );
        } else {
          // Generic location-update task for non-repair deliveries
          await client.query(
            `insert into tasks (shop_id, title, description, recurrence_unit, recurrence_interval, is_one_time, created_by_user_id)
             values ($1, $2, $3, 'day', 1, true, $4)`,
            [
              request.to_shop_id,
              `Update bikes in system: ${bikeLabels}`,
              `${reasonLabel} from ${from_name} to ${to_name} has been completed. Please update the above bikes in the reservation system to reflect their new location at ${to_name}.`,
              req.user.id,
            ]
          );
        }
      }

      // Notify admin + organiser at the destination shop
      const { rows: doneNotifyRows } = await client.query(
        `select id from users where is_active = true
           and (roles @> array['admin']::text[]
                or (roles && array['organiser']::text[] and shop_id = $1))`,
        [request.to_shop_id]
      );
      const doneNotifyIds = doneNotifyRows.map(r => r.id).filter(id => id !== req.user.id);
      if (doneNotifyIds.length) {
        const doneReasonLabel = { rental: 'Rental', repair: 'Repair', return: 'Return' }[request.reason] ?? request.reason;
        await sendPushToUsers(client, doneNotifyIds, {
          title: `✅ Delivery done: ${from_name} → ${to_name}`,
          body:  `${doneReasonLabel} · ${bikeLabels}`,
        });
      }
    }

    await client.query('commit');
    res.json(updated[0]);
  } catch (err) {
    await client.query('rollback');
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  } finally {
    client.release();
  }
});

// DELETE /api/requests/:id
router.delete('/:id', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query('select id, status from requests where id = $1', [req.params.id]);
    if (!rows[0]) { await client.query('rollback'); return res.status(404).json({ error: 'Not found' }); }

    if (hasRole(req.user, 'admin')) {
      await client.query('delete from requests where id = $1', [req.params.id]);
      await client.query('commit');
      return res.status(204).end();
    }

    await client.query(
      `update requests set status = 'cancelled', updated_by_user_id = $2, version = version + 1, updated_at = now() where id = $1`,
      [req.params.id, req.user.id]
    );
    await auditLog(client, req.params.id, 'cancelled', null, req.user.id);
    await client.query('commit');
    res.status(204).end();
  } catch (err) {
    await client.query('rollback');
    next(err);
  } finally {
    client.release();
  }
});

export default router;
