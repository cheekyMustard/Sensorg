import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { requireAuth, requireRole, hasRole } from '../middleware/auth.js';
import { sendPushToUsers } from '../push.js';

const router = Router();
router.use(requireAuth);

// GET /api/repair-requests
// mechanic/admin see all for their shop; admin sees all
// done records older than 2 days are auto-archived and excluded
router.get('/', async (req, res, next) => {
  try {
    // Auto-archive done records older than 2 days
    await pool.query(
      `update repair_requests
          set is_archived = true
        where status = 'done'
          and done_at < now() - interval '2 days'
          and is_archived = false`
    );

    const isAdmin = hasRole(req.user, 'admin');
    const sql = isAdmin
      ? `select rr.*, u.username as taken_by_username
           from repair_requests rr
           left join users u on u.id = rr.taken_by_user_id
          where rr.is_archived = false
          order by rr.status asc, rr.created_at desc`
      : `select rr.*, u.username as taken_by_username
           from repair_requests rr
           left join users u on u.id = rr.taken_by_user_id
          where rr.shop_id = $1 and rr.is_archived = false
          order by rr.status asc, rr.created_at desc`;

    const { rows } = await pool.query(sql, isAdmin ? [] : [req.user.shop_id]);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/repair-requests — all authenticated users can log a repair at their shop
const createSchema = z.object({
  bike_labels:         z.array(z.string().min(1)).min(1),
  problem_description: z.string().max(1000).optional(),
  is_roadbike:         z.boolean().default(false),
});

router.post('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const data   = createSchema.parse(req.body);
    const shopId = req.user.shop_id;
    if (!shopId) return res.status(400).json({ error: 'No shop associated with your account' });

    await client.query('begin');

    const { rows } = await client.query(
      `insert into repair_requests
         (shop_id, bike_labels, arrival_date, problem_description, is_roadbike, created_by_user_id)
       values ($1, $2, $3, $4, $5, $6)
       returning *`,
      [
        shopId,
        data.bike_labels.map(l => l.trim().toUpperCase()),
        new Date().toISOString().slice(0, 10),
        data.problem_description ?? null,
        data.is_roadbike,
        req.user.id,
      ]
    );
    const rr = rows[0];

    // If it's a roadbike, create a task to mark it as broken in the system
    if (data.is_roadbike) {
      const bikeLabels = rr.bike_labels.join(', ');
      await client.query(
        `insert into tasks (shop_id, title, description, recurrence_unit, recurrence_interval, is_one_time, created_by_user_id)
         values ($1, $2, $3, 'day', 1, true, $4)`,
        [
          shopId,
          `Mark roadbike as "broken" in BRM: ${bikeLabels}`,
          `A repair request has been created for roadbike(s) ${bikeLabels}. Mark them as "broken" in the reservation system until the repair is done.`,
          req.user.id,
        ]
      );
    }

    await client.query('commit');
    res.status(201).json(rr);
  } catch (err) {
    await client.query('rollback');
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  } finally {
    client.release();
  }
});

// POST /api/repair-requests/:id/status — mechanic or admin only
router.post('/:id/status', requireRole('mechanic', 'admin'), async (req, res, next) => {
  const schema = z.object({ to: z.enum(['in_progress', 'done']) });
  const client = await pool.connect();
  try {
    const { to } = schema.parse(req.body);

    await client.query('begin');

    const { rows } = await client.query(
      'select * from repair_requests where id = $1 for update',
      [req.params.id]
    );
    const rr = rows[0];
    if (!rr) { await client.query('rollback'); return res.status(404).json({ error: 'Not found' }); }

    // Only open → in_progress or in_progress → done
    const validNext = rr.status === 'open' ? 'in_progress' : rr.status === 'in_progress' ? 'done' : null;
    if (to !== validNext) {
      await client.query('rollback');
      return res.status(400).json({ error: `Cannot transition ${rr.status} → ${to}` });
    }

    const takenBy = to === 'in_progress' ? req.user.id : rr.taken_by_user_id;

    const { rows: updated } = await client.query(
      `update repair_requests
          set status = $2, taken_by_user_id = $3, updated_at = now(),
              done_at = case when $2 = 'done' then now() else done_at end
        where id = $1
        returning *`,
      [req.params.id, to, takenBy]
    );

    if (to === 'done') {
      // Create a task to change the bike back in the system — only for roadbikes
      if (rr.is_roadbike) {
        const bikeLabels = rr.bike_labels.join(', ');
        await client.query(
          `insert into tasks (shop_id, title, description, recurrence_unit, recurrence_interval, is_one_time, created_by_user_id)
           values ($1, $2, $3, 'day', 1, true, $4)`,
          [
            rr.shop_id,
            `Mark roadbike as "ready" in BRM: ${bikeLabels}`,
            `Repair of roadbike(s) ${bikeLabels} has been completed. Change them back to "available/ready" status in the reservation system.`,
            req.user.id,
          ]
        );
      }

      // Notify admin + organiser + mechanic at the repair shop
      const { rows: doneNotifyRows } = await client.query(
        `select id from users where is_active = true
           and (roles @> array['admin']::text[]
                or (roles && array['organiser','mechanic']::text[] and shop_id = $1))`,
        [rr.shop_id]
      );
      const doneNotifyIds = doneNotifyRows.map(r => r.id).filter(id => id !== req.user.id);
      if (doneNotifyIds.length) {
        await sendPushToUsers(client, doneNotifyIds, {
          title: '🔧 Repair completed',
          body:  rr.bike_labels.join(', '),
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

// DELETE /api/repair-requests/:id — own entry or admin
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('select * from repair_requests where id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });

    const rr = rows[0];
    const canDelete = hasRole(req.user, 'admin') || rr.created_by_user_id === req.user.id;
    if (!canDelete) return res.status(403).json({ error: 'Forbidden' });

    await pool.query('delete from repair_requests where id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
