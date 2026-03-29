import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth:   z.string().min(1),
  }),
});

// GET /api/push/vapid-public-key
router.get('/vapid-public-key', (_req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe
router.post('/subscribe', async (req, res, next) => {
  try {
    const { endpoint, keys } = subscribeSchema.parse(req.body);

    await pool.query(
      `insert into push_subscriptions (user_id, endpoint, p256dh, auth)
       values ($1, $2, $3, $4)
       on conflict (user_id, endpoint) do update set p256dh = $3, auth = $4`,
      [req.user.id, endpoint, keys.p256dh, keys.auth]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// DELETE /api/push/subscribe
router.delete('/subscribe', async (req, res, next) => {
  try {
    const { endpoint } = z.object({ endpoint: z.string().url() }).parse(req.body);

    await pool.query(
      'delete from push_subscriptions where user_id = $1 and endpoint = $2',
      [req.user.id, endpoint]
    );

    res.status(204).end();
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// GET /api/push/status — is the current user subscribed on this device?
// (Frontend checks by sending endpoint as query param)
router.get('/status', async (req, res, next) => {
  try {
    const endpoint = req.query.endpoint;
    if (!endpoint) return res.json({ subscribed: false });

    const { rows } = await pool.query(
      'select id from push_subscriptions where user_id = $1 and endpoint = $2',
      [req.user.id, endpoint]
    );

    res.json({ subscribed: rows.length > 0 });
  } catch (err) {
    next(err);
  }
});

export default router;
