import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  content:   z.string().min(1).max(5000).optional(),
  image_url: z.string().max(1000).optional(),
  category:  z.string().min(1).max(100).optional(),
}).refine(d => d.content || d.image_url, {
  message: 'A joke must have content, an image, or both',
});

// GET /api/jokes/categories — must come before /:id
router.get('/categories', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'select name from joke_categories order by name asc'
    );
    res.json(rows.map(r => r.name));
  } catch (err) { next(err); }
});

// POST /api/jokes/categories
router.post('/categories', async (req, res, next) => {
  try {
    const { name } = z.object({ name: z.string().min(1).max(100) }).parse(req.body);
    await pool.query(
      'insert into joke_categories (name) values ($1) on conflict (name) do nothing',
      [name]
    );
    res.status(201).json({ name });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// GET /api/jokes
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      select j.id, j.content, j.image_url, j.category,
             j.created_at, u.username as author
        from jokes j
        left join users u on u.id = j.created_by_user_id
       order by j.created_at desc
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/jokes
router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    // Persist category if new
    if (data.category) {
      await pool.query(
        'insert into joke_categories (name) values ($1) on conflict (name) do nothing',
        [data.category]
      );
    }

    const { rows } = await pool.query(
      `insert into jokes (content, image_url, category, created_by_user_id)
       values ($1, $2, $3, $4)
       returning *`,
      [data.content ?? null, data.image_url ?? null, data.category ?? null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// DELETE /api/jokes/:id — own or admin
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('select * from jokes where id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });

    const isOwn   = rows[0].created_by_user_id === req.user.id;
    const isAdmin = req.user.roles?.includes('admin');
    if (!isOwn && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

    await pool.query('delete from jokes where id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
