import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// GET /api/bikes/inventory — full inventory with location, for all authenticated users
router.get('/inventory', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select b.id, b.label, b.notes, b.is_active, b.current_shop_id,
              s.name as current_shop_name
         from bikes b
         left join shops s on s.id = b.current_shop_id
        order by s.name nulls last, b.label`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/bikes?query=&shop_id=
router.get('/', async (req, res, next) => {
  try {
    const query  = (req.query.query   ?? '').trim();
    const shopId =  req.query.shop_id ?? null;

    const conditions = ['is_active = true'];
    const params = [];

    if (shopId) {
      params.push(shopId);
      conditions.push(`(current_shop_id = $${params.length} or current_shop_id is null)`);
    }

    let result;
    if (query.length === 0) {
      result = await pool.query(
        `select id, label, notes from bikes where ${conditions.join(' and ')} order by label limit 20`,
        params
      );
    } else {
      params.push(`%${query}%`);
      const ilikeIdx = params.length;
      params.push(query);
      const simIdx = params.length;
      conditions.push(`label ilike $${ilikeIdx}`);
      result = await pool.query(
        `select id, label, notes
           from bikes
          where ${conditions.join(' and ')}
          order by similarity(label, $${simIdx}) desc
          limit 20`,
        params
      );
    }

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

const bikeSchema = z.object({
  label: z.string().min(1).transform(s => s.trim().toUpperCase()),
  notes: z.string().optional(),
});

// POST /api/bikes  (upsert by label)
router.post('/', async (req, res, next) => {
  try {
    const { label, notes } = bikeSchema.parse(req.body);

    const { rows } = await pool.query(
      `insert into bikes (label, notes)
       values ($1, $2)
       on conflict (label) do update set notes = coalesce(excluded.notes, bikes.notes), updated_at = now()
       returning id, label, notes`,
      [label, notes ?? null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

export default router;
