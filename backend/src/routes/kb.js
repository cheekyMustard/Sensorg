import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { hasRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

const createSchema = z.object({
  title:    z.string().min(1).max(200),
  content:  z.string().default(''),
  category: z.string().max(100).nullable().optional(),
  shop_id:  z.string().uuid().nullable().optional(),
});

const patchSchema = z.object({
  title:    z.string().min(1).max(200).optional(),
  content:  z.string().optional(),
  category: z.string().max(100).nullable().optional(),
  is_active: z.boolean().optional(),
});

// GET /api/kb — admin/organiser/mechanic see all; others see own shop + global
router.get('/', async (req, res, next) => {
  try {
    const isPrivileged = hasRole(req.user, 'admin', 'organiser', 'mechanic');

    let sql, params;
    if (isPrivileged) {
      sql = `
        select a.*, u.username as author, s.name as shop_name
          from kb_articles a
          left join users u on u.id = a.created_by_user_id
          left join shops s on s.id = a.shop_id
         where a.is_active = true
         order by a.category nulls last, a.title`;
      params = [];
    } else {
      sql = `
        select a.*, u.username as author
          from kb_articles a
          left join users u on u.id = a.created_by_user_id
         where a.is_active = true
           and (a.shop_id = $1 or a.shop_id is null)
         order by a.category nulls last, a.title`;
      params = [req.user.shop_id];
    }

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/kb — admin, organiser, mechanic
router.post('/', requireRole('admin', 'organiser', 'mechanic'), async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const shopId = hasRole(req.user, 'admin')
      ? (data.shop_id ?? null)
      : req.user.shop_id;

    const { rows } = await pool.query(
      `insert into kb_articles (shop_id, title, content, category, created_by_user_id, updated_by_user_id)
       values ($1, $2, $3, $4, $5, $5)
       returning *`,
      [shopId, data.title, data.content, data.category ?? null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// PATCH /api/kb/:id — admin, organiser, mechanic
router.patch('/:id', requireRole('admin', 'organiser', 'mechanic'), async (req, res, next) => {
  try {
    const data = patchSchema.parse(req.body);

    const fields = [];
    const params = [req.params.id];
    const add = (col, val) => { params.push(val); fields.push(`${col} = $${params.length}`); };

    if (data.title     !== undefined) add('title',     data.title);
    if (data.content   !== undefined) add('content',   data.content);
    if (data.category  !== undefined) add('category',  data.category);
    if (data.is_active !== undefined) add('is_active', data.is_active);
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    add('updated_by_user_id', req.user.id);
    add('updated_at', new Date());

    const { rows } = await pool.query(
      `update kb_articles set ${fields.join(', ')} where id = $1 returning *`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// DELETE /api/kb/:id — admin, organiser, mechanic
router.delete('/:id', requireRole('admin', 'organiser', 'mechanic'), async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('delete from kb_articles where id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
