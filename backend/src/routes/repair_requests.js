import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { requireAuth, requireRole, hasRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/repair-requests
// mechanic/admin see all for their shop; admin sees all
router.get('/', async (req, res, next) => {
  try {
    const isAdmin = hasRole(req.user, 'admin');
    const sql = isAdmin
      ? `select rr.*, u.username as taken_by_username
           from repair_requests rr
           left join users u on u.id = rr.taken_by_user_id
          order by rr.status asc, rr.created_at desc`
      : `select rr.*, u.username as taken_by_username
           from repair_requests rr
           left join users u on u.id = rr.taken_by_user_id
          where rr.shop_id = $1
          order by rr.status asc, rr.created_at desc`;

    const { rows } = await pool.query(sql, isAdmin ? [] : [req.user.shop_id]);
    res.json(rows);
  } catch (err) { next(err); }
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
          set status = $2, taken_by_user_id = $3, updated_at = now()
        where id = $1
        returning *`,
      [req.params.id, to, takenBy]
    );

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

export default router;
