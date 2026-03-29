import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { hasRole } from '../middleware/auth.js';
import { applyActiveShop } from '../middleware/applyActiveShop.js';

const router = Router();

router.use(requireAuth, applyActiveShop);

const createSchema = z.object({
  company:   z.string().min(1).max(100),
  topic:     z.string().min(1).max(200),
  note:      z.string().max(2000).optional(),
  image_url: z.string().url().max(1000).optional().or(z.literal('')),
  shop_id:   z.string().uuid().nullable().optional(),
});

function buildScope(user) {
  if (hasRole(user, 'admin', 'organiser')) return null;
  return user.shop_id;
}

// GET /api/excursions
router.get('/', async (req, res, next) => {
  try {
    const scope = buildScope(req.user);
    const company = req.query.company?.trim() || null;

    const conditions = ['e.id is not null'];
    const params = [];

    if (scope) {
      params.push(scope);
      conditions.push(`(e.shop_id = $${params.length} or e.shop_id is null)`);
    }

    if (company) {
      params.push(company);
      conditions.push(`e.company = $${params.length}`);
    }

    const where = conditions.join(' and ');

    const { rows } = await pool.query(`
      select e.*,
             u.username  as author,
             s.name      as shop_name
        from excursions e
        left join users u on u.id = e.created_by_user_id
        left join shops s on s.id = e.shop_id
       where ${where}
       order by e.company asc, e.created_at desc
    `, params);

    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/excursions — admin, organiser, general
router.post('/', requireRole('admin', 'organiser', 'general'), async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    let shopId = data.shop_id ?? req.user.shop_id ?? null;
    if (!hasRole(req.user, 'admin', 'organiser')) {
      shopId = req.user.shop_id ?? null;
    }

    const { rows } = await pool.query(
      `insert into excursions (company, topic, note, image_url, shop_id, created_by_user_id)
       values ($1, $2, $3, $4, $5, $6)
       returning *`,
      [data.company, data.topic, data.note ?? null, data.image_url || null, shopId, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// DELETE /api/excursions/:id — admin or creator only
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('select * from excursions where id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });

    const entry = rows[0];
    const canDelete = hasRole(req.user, 'admin') || entry.created_by_user_id === req.user.id;
    if (!canDelete) return res.status(403).json({ error: 'Forbidden' });

    await pool.query('delete from excursions where id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
