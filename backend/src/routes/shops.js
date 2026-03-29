import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// GET /api/shops — list all shops
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, name FROM shops ORDER BY name');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
