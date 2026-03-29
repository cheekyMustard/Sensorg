import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const loginSchema = z.object({
  username:         z.string().min(1),
  password:         z.string().min(1),
  active_shop_id:   z.string().uuid().nullable().optional(),
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { username, password, active_shop_id } = loginSchema.parse(req.body);

    const { rows } = await pool.query(
      'select id, username, password_hash, roles, shop_id from users where username = $1 and is_active = true',
      [username]
    );

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Record which shop the user selected for today and when they last logged in
    await pool.query(
      'update users set last_active_shop_id = $1, last_seen_at = now() where id = $2',
      [active_shop_id ?? null, user.id]
    );

    const token = jwt.sign(
      { id: user.id, username: user.username, roles: user.roles, shop_id: user.shop_id },
      process.env.JWT_SECRET,
      { expiresIn: '10h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, roles: user.roles, shop_id: user.shop_id } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

export default router;
