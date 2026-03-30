import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { requireAuth, requireRole, hasRole } from '../middleware/auth.js';
import { applyActiveShop } from '../middleware/applyActiveShop.js';

const router = Router();

router.use(requireAuth, applyActiveShop);

const createSchema = z.object({
  title:               z.string().min(1).max(200),
  description:         z.string().default(''),
  shop_ids:            z.array(z.string().uuid()).optional(),
  recurrence_unit:     z.enum(['day', 'week', 'month']).default('day'),
  recurrence_interval: z.number().int().min(1).default(1),
});

const patchSchema = z.object({
  title:               z.string().min(1).max(200).optional(),
  description:         z.string().optional(),
  is_active:           z.boolean().optional(),
  recurrence_unit:     z.enum(['day', 'week', 'month']).optional(),
  recurrence_interval: z.number().int().min(1).optional(),
});

const PERIOD_SQL = `
  case t.recurrence_unit
    when 'week'  then date_trunc('week',  current_date)::date
    when 'month' then date_trunc('month', current_date)::date
    else '2000-01-01'::date +
         (floor((current_date - '2000-01-01'::date) / t.recurrence_interval) * t.recurrence_interval)::int
  end`;

const PERIOD_SQL_DIRECT = `
  case recurrence_unit
    when 'week'  then date_trunc('week',  current_date)::date
    when 'month' then date_trunc('month', current_date)::date
    else '2000-01-01'::date +
         (floor((current_date - '2000-01-01'::date) / recurrence_interval) * recurrence_interval)::int
  end`;

// GET /api/tasks
router.get('/', async (req, res, next) => {
  try {
    const isPrivileged = hasRole(req.user, 'admin', 'organiser');
    const shopId = req.user.shop_id;

    let where, params;
    if (isPrivileged && !shopId) {
      where  = 't.is_active = true';
      params = [];
    } else {
      where  = 't.is_active = true and (t.shop_id = $1 or t.shop_id is null)';
      params = [shopId];
    }

    // Approval visibility: approved always visible; pending/rejected only for approvers or creator
    if (!isPrivileged) {
      params.push(req.user.id);
      where += ` and (t.approval_status = 'approved' or t.created_by_user_id = $${params.length})`;
    }

    // Completion join clause — uses a separate param index
    const completionShopClause = shopId
      ? `and tc.shop_id = $${params.length + 1}`
      : `and tc.shop_id is null`;
    if (shopId) params.push(shopId);

    const { rows } = await pool.query(`
      select t.*,
             s.name as shop_name,
             tc.id                   as completion_id,
             tc.completed_by_user_id,
             tc.completed_at,
             u.username              as completed_by_username
        from tasks t
        left join shops s on s.id = t.shop_id
        left join task_completions tc
               on tc.task_id = t.id
              ${completionShopClause}
              and tc.completed_date = (${PERIOD_SQL})
        left join users u on u.id = tc.completed_by_user_id
       where ${where}
       order by t.shop_id nulls last, t.title
    `, params);

    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/tasks — admin, organiser, general
router.post('/', requireRole('admin', 'organiser', 'general'), async (req, res, next) => {
  try {
    const data    = createSchema.parse(req.body);
    const shopIds = data.shop_ids?.length ? data.shop_ids : [null];
    const approvalStatus = hasRole(req.user, 'admin', 'organiser') ? 'approved' : 'pending';

    const client = await pool.connect();
    try {
      await client.query('begin');
      const created = [];
      for (const shopId of shopIds) {
        const { rows } = await client.query(
          `insert into tasks (shop_id, title, description, recurrence_unit, recurrence_interval, approval_status, created_by_user_id)
           values ($1, $2, $3, $4, $5, $6, $7) returning *`,
          [shopId, data.title, data.description, data.recurrence_unit, data.recurrence_interval, approvalStatus, req.user.id]
        );
        created.push(rows[0]);
      }
      await client.query('commit');
      res.status(201).json(created);
    } catch (err) {
      await client.query('rollback');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// PATCH /api/tasks/:id — admin, organiser
router.patch('/:id', requireRole('admin', 'organiser'), async (req, res, next) => {
  try {
    const data = patchSchema.parse(req.body);
    const fields = [];
    const params = [req.params.id];
    const add = (col, val) => { params.push(val); fields.push(`${col} = $${params.length}`); };

    if (data.title               !== undefined) add('title',               data.title);
    if (data.description         !== undefined) add('description',         data.description);
    if (data.is_active           !== undefined) add('is_active',           data.is_active);
    if (data.recurrence_unit     !== undefined) add('recurrence_unit',     data.recurrence_unit);
    if (data.recurrence_interval !== undefined) add('recurrence_interval', data.recurrence_interval);
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    add('updated_at', new Date());

    const { rows } = await pool.query(
      `update tasks set ${fields.join(', ')} where id = $1 returning *`, params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// DELETE /api/tasks/:id — admin, organiser
router.delete('/:id', requireRole('admin', 'organiser'), async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('delete from tasks where id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

// POST /api/tasks/:id/approve — admin, organiser
router.post('/:id/approve', requireRole('admin', 'organiser'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `update tasks set approval_status = 'approved', updated_at = now() where id = $1 returning *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /api/tasks/:id/reject — admin, organiser
router.post('/:id/reject', requireRole('admin', 'organiser'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `update tasks set approval_status = 'rejected', updated_at = now() where id = $1 returning *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /api/tasks/:id/complete
router.post('/:id/complete', async (req, res, next) => {
  try {
    const shopId = req.user.shop_id ?? null;
    const { rows } = await pool.query(
      `with period as (
         select (${PERIOD_SQL_DIRECT}) as period_start
           from tasks where id = $1
       )
       insert into task_completions (task_id, shop_id, completed_by_user_id, completed_date)
       select $1, $2, $3, period_start from period
       on conflict (task_id, shop_id, completed_date) where shop_id is not null
       do update set completed_by_user_id = $3, completed_at = now()
       returning *`,
      [req.params.id, shopId, req.user.id]
    );
    await pool.query(
      `update tasks set is_active = false, updated_at = now()
        where id = $1 and is_one_time = true`,
      [req.params.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/tasks/:id/complete
router.delete('/:id/complete', async (req, res, next) => {
  try {
    const shopId = req.user.shop_id ?? null;
    await pool.query(
      `delete from task_completions
        where task_id = $1
          and shop_id is not distinct from $2
          and completed_date = (
                select (${PERIOD_SQL_DIRECT}) from tasks where id = $1
              )`,
      [req.params.id, shopId]
    );
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
