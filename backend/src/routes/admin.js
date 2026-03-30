import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

// Keep in sync with: frontend/src/pages/Admin/UsersPanel.jsx and db/migrations/015_multi_role.sql
const ROLES = ['admin', 'driver', 'mechanic', 'cleaner', 'organiser', 'general'];

// ── Users ───────────────────────────────────────────────────────────────────

// GET /api/admin/users
router.get('/users', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select u.id, u.username, u.roles, u.shop_id, u.is_active, u.created_at,
              s.name as shop_name
         from users u
         left join shops s on s.id = u.shop_id
        order by u.username`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

const createUserSchema = z.object({
  username: z.string().min(2).max(64),
  password: z.string().min(6),
  roles:    z.array(z.enum(ROLES)).min(1),
  shop_id:  z.string().uuid().nullable().optional(),
});

// POST /api/admin/users
router.post('/users', async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);
    const hash = await bcrypt.hash(data.password, 10);
    const { rows } = await pool.query(
      `insert into users (username, password_hash, roles, shop_id)
       values ($1, $2, $3, $4)
       returning id, username, roles, shop_id, is_active, created_at`,
      [data.username, hash, data.roles, data.shop_id ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    if (err.code === '23505') return res.status(409).json({ error: 'Username already exists' });
    next(err);
  }
});

const patchUserSchema = z.object({
  roles:     z.array(z.enum(ROLES)).min(1).optional(),
  shop_id:   z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
  password:  z.string().min(6).optional(),
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req, res, next) => {
  try {
    const data = patchUserSchema.parse(req.body);
    const fields = [];
    const params = [req.params.id];

    const add = (col, val) => { params.push(val); fields.push(`${col} = $${params.length}`); };

    if (data.roles     !== undefined) add('roles',     data.roles);
    if (data.shop_id   !== undefined) add('shop_id',   data.shop_id);
    if (data.is_active !== undefined) add('is_active', data.is_active);
    if (data.password) {
      const hash = await bcrypt.hash(data.password, 10);
      add('password_hash', hash);
    }

    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

    add('updated_at', new Date());

    const { rows } = await pool.query(
      `update users set ${fields.join(', ')} where id = $1
       returning id, username, roles, shop_id, is_active, created_at,
         (select name from shops where id = shop_id) as shop_name`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    const { rowCount } = await pool.query('delete from users where id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

// ── Shops ───────────────────────────────────────────────────────────────────

// GET /api/admin/shops
router.get('/shops', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select s.id, s.name, s.created_at,
              count(u.id) filter (where u.is_active) as user_count
         from shops s
         left join users u on u.shop_id = s.id
        group by s.id
        order by s.name`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/admin/shops
router.post('/shops', async (req, res, next) => {
  try {
    const { name } = z.object({ name: z.string().min(1).max(128) }).parse(req.body);
    const { rows } = await pool.query(
      'insert into shops (name) values ($1) returning *',
      [name]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// PATCH /api/admin/shops/:id
router.patch('/shops/:id', async (req, res, next) => {
  try {
    const { name } = z.object({ name: z.string().min(1).max(128) }).parse(req.body);
    const { rows } = await pool.query(
      'update shops set name = $2, updated_at = now() where id = $1 returning *',
      [req.params.id, name]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Bikes ───────────────────────────────────────────────────────────────────

// GET /api/admin/bikes
router.get('/bikes', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select b.id, b.label, b.notes, b.is_active, b.current_shop_id,
              s.name as current_shop_name,
              b.created_at, b.updated_at
         from bikes b
         left join shops s on s.id = b.current_shop_id
        order by b.label`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// PATCH /api/admin/bikes/:id
router.patch('/bikes/:id', async (req, res, next) => {
  try {
    const data = z.object({
      is_active:       z.boolean().optional(),
      current_shop_id: z.string().uuid().nullable().optional(),
      notes:           z.string().nullable().optional(),
    }).parse(req.body);

    const fields = [];
    const params = [req.params.id];
    const add = (col, val) => { params.push(val); fields.push(`${col} = $${params.length}`); };

    if (data.is_active       !== undefined) add('is_active',       data.is_active);
    if (data.current_shop_id !== undefined) add('current_shop_id', data.current_shop_id);
    if (data.notes           !== undefined) add('notes',           data.notes);

    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    add('updated_at', new Date());

    const { rows } = await pool.query(
      `update bikes set ${fields.join(', ')} where id = $1 returning *`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Archive ──────────────────────────────────────────────────────────────────

// GET /api/admin/archive
router.get('/archive', async (_req, res, next) => {
  try {
    const [requestsRes, notesRes, tasksRes] = await Promise.all([
      pool.query(`
        select r.id, r.reason, r.status, r.date_rental, r.note,
               fs.name as from_shop_name, ts.name as to_shop_name,
               r.updated_at, u.username as author,
               json_agg(json_build_object('label', b.label) order by rb.position)
                 filter (where b.id is not null) as bikes
          from requests r
          join shops fs on fs.id = r.from_shop_id
          join shops ts on ts.id = r.to_shop_id
          left join users u on u.id = r.created_by_user_id
          left join request_bikes rb on rb.request_id = r.id
          left join bikes b on b.id = rb.bike_id
         where r.status in ('done', 'cancelled')
         group by r.id, fs.name, ts.name, u.username
         order by r.updated_at desc
         limit 200
      `),
      pool.query(`
        select n.id, n.title, n.content, n.done_at, n.is_archived,
               s.name as shop_name, u.username as author
          from notes n
          left join shops s on s.id = n.shop_id
          left join users u on u.id = n.created_by_user_id
         where n.is_archived = true
         order by n.done_at desc
         limit 200
      `),
      pool.query(`
        select t.id, t.title, t.description, t.shop_id, t.updated_at,
               s.name as shop_name, u.username as author
          from tasks t
          left join shops s on s.id = t.shop_id
          left join users u on u.id = t.created_by_user_id
         where t.is_one_time = true and t.is_active = false
         order by t.updated_at desc
         limit 200
      `),
    ]);

    res.json({
      requests: requestsRes.rows,
      notes:    notesRes.rows,
      tasks:    tasksRes.rows,
    });
  } catch (err) { next(err); }
});

export default router;
