import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { requireAuth, hasRole } from '../middleware/auth.js';
import { applyActiveShop } from '../middleware/applyActiveShop.js';

const router = Router();

router.use(requireAuth, applyActiveShop);

const createSchema = z.object({
  title:   z.string().min(1).max(200),
  content: z.string().default(''),
  shop_id: z.string().uuid().nullable().optional(),
});

const patchSchema = z.object({
  title:   z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  is_done: z.boolean().optional(),
});

/** Admin/organiser see all shops; everyone else scoped to their shop. */
function buildScope(user) {
  if (hasRole(user, 'admin', 'organiser')) return null;
  return user.shop_id;
}

// GET /api/notes
router.get('/', async (req, res, next) => {
  try {
    await pool.query(
      `update notes set is_archived = true
        where is_done = true and done_at < now() - interval '1 day' and is_archived = false`
    );

    const scope = buildScope(req.user);

    let sql, params;
    if (scope) {
      sql = `
        select n.*, u.username as author
          from notes n
          left join users u on u.id = n.created_by_user_id
         where (n.shop_id = $1 or n.shop_id is null)
           and n.is_archived = false
         order by n.is_done asc, n.created_at desc`;
      params = [scope];
    } else {
      sql = `
        select n.*, u.username as author, s.name as shop_name
          from notes n
          left join users u on u.id = n.created_by_user_id
          left join shops s on s.id = n.shop_id
         where n.is_archived = false
         order by n.is_done asc, n.created_at desc`;
      params = [];
    }

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/notes — all roles except cleaner-only
router.post('/', async (req, res, next) => {
  try {
    if (hasRole(req.user, 'cleaner') && !hasRole(req.user, 'admin', 'organiser', 'driver', 'mechanic', 'general')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const data = createSchema.parse(req.body);

    let shopId = data.shop_id ?? req.user.shop_id ?? null;
    if (!hasRole(req.user, 'admin', 'organiser')) {
      shopId = req.user.shop_id ?? null;
    }

    const { rows } = await pool.query(
      `insert into notes (shop_id, title, content, created_by_user_id, updated_by_user_id)
       values ($1, $2, $3, $4, $4)
       returning *`,
      [shopId, data.title, data.content, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// PATCH /api/notes/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const data = patchSchema.parse(req.body);

    const { rows: existing } = await pool.query('select * from notes where id = $1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Not found' });

    const note = existing[0];
    const canEdit = hasRole(req.user, 'admin', 'organiser') || note.created_by_user_id === req.user.id;
    if (!canEdit) return res.status(403).json({ error: 'Forbidden' });

    const fields = [];
    const params = [req.params.id];
    const add = (col, val) => { params.push(val); fields.push(`${col} = $${params.length}`); };

    if (data.title   !== undefined) add('title',   data.title);
    if (data.content !== undefined) add('content', data.content);
    if (data.is_done !== undefined) {
      add('is_done', data.is_done);
      add('done_at', data.is_done ? new Date() : null);
    }
    add('updated_by_user_id', req.user.id);
    add('updated_at', new Date());

    const { rows } = await pool.query(
      `update notes set ${fields.join(', ')} where id = $1 returning *`,
      params
    );
    res.json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// DELETE /api/notes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('select * from notes where id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });

    const note = rows[0];
    const canDelete = hasRole(req.user, 'admin', 'organiser') || note.created_by_user_id === req.user.id;
    if (!canDelete) return res.status(403).json({ error: 'Forbidden' });

    await pool.query('delete from notes where id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
