import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { requireAuth, requireRole, hasRole } from '../middleware/auth.js';
import { applyActiveShop } from '../middleware/applyActiveShop.js';
import { sendPushToUsers } from '../push.js';

const router = Router();

router.use(requireAuth, applyActiveShop);

const createSchema = z.object({
  company:   z.string().min(1).max(100),
  topic:     z.string().min(1).max(200),
  note:      z.string().max(2000).optional(),
  image_url: z.string().max(1000).optional().or(z.literal('')),
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

    const conditions = [];
    const params = [];

    if (scope) {
      params.push(scope);
      conditions.push(`(e.shop_id = $${params.length} or e.shop_id is null)`);
    }

    if (company) {
      params.push(company);
      conditions.push(`e.company = $${params.length}`);
    }

    // Approval visibility: approved always; pending/rejected only for approvers or creator
    const isPrivileged = hasRole(req.user, 'admin', 'organiser');
    if (!isPrivileged) {
      params.push(req.user.id);
      conditions.push(`(e.approval_status = 'approved' or e.created_by_user_id = $${params.length})`);
    }

    const where2 = conditions.length ? `where ${conditions.join(' and ')}` : '';

    const { rows } = await pool.query(`
      select e.*,
             u.username  as author,
             s.name      as shop_name
        from excursions e
        left join users u on u.id = e.created_by_user_id
        left join shops s on s.id = e.shop_id
       ${where2}
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
      // General users may choose global (null) or their own shop — nothing else
      shopId = data.shop_id === null ? null : (req.user.shop_id ?? null);
    }

    const approvalStatus = hasRole(req.user, 'admin', 'organiser') ? 'approved' : 'pending';

    const { rows } = await pool.query(
      `insert into excursions (company, topic, note, image_url, shop_id, approval_status, created_by_user_id)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [data.company, data.topic, data.note ?? null, data.image_url || null, shopId, approvalStatus, req.user.id]
    );

    // Notify all admins + organisers when a general user creates an entry needing approval
    if (approvalStatus === 'pending') {
      const { rows: notifyRows } = await pool.query(
        `select id from users where is_active = true and roles && array['admin','organiser']::text[]`
      );
      const notifyIds = notifyRows.map(r => r.id).filter(id => id !== req.user.id);
      if (notifyIds.length) {
        await sendPushToUsers(pool, notifyIds, {
          title: '📋 New excursion entry pending',
          body:  `${data.company} · ${data.topic}`,
        });
      }
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// PATCH /api/excursions/:id — admin, organiser
const updateSchema = z.object({
  company:   z.string().min(1).max(100).optional(),
  topic:     z.string().min(1).max(200).optional(),
  note:      z.string().max(2000).nullable().optional(),
  image_url: z.string().max(1000).nullable().optional(),
  shop_id:   z.string().uuid().nullable().optional(),
});

router.patch('/:id', requireRole('admin', 'organiser'), async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);

    const { rows: existing } = await pool.query('select * from excursions where id = $1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Not found' });

    const fields = [];
    const params = [req.params.id];
    const add = (col, val) => { params.push(val); fields.push(`${col} = $${params.length}`); };

    if (data.company   !== undefined) add('company',   data.company);
    if (data.topic     !== undefined) add('topic',     data.topic);
    if (data.note      !== undefined) add('note',      data.note ?? null);
    if (data.image_url !== undefined) add('image_url', data.image_url ?? null);
    if (data.shop_id   !== undefined) add('shop_id',   data.shop_id ?? null);
    add('updated_at', new Date());

    const { rows } = await pool.query(
      `update excursions set ${fields.join(', ')} where id = $1 returning *`,
      params
    );
    res.json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// POST /api/excursions/:id/approve — admin, organiser
router.post('/:id/approve', requireRole('admin', 'organiser'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `update excursions set approval_status = 'approved', updated_at = now() where id = $1 returning *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /api/excursions/:id/reject — admin, organiser — deletes the entry
router.post('/:id/reject', requireRole('admin', 'organiser'), async (req, res, next) => {
  try {
    const { rows } = await pool.query('select id from excursions where id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await pool.query('delete from excursions where id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
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
