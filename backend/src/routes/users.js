import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// GET /api/users — active users who logged in today, grouped by their selected shop
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      select u.id, u.username, u.roles,
             u.last_seen_at,
             s.name as active_shop_name
        from users u
        left join shops s on s.id = u.last_active_shop_id
       where u.is_active = true
         and u.last_seen_at >= current_date
       order by s.name nulls last, u.username
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
