/**
 * Integration tests for GET /api/bikes and POST /api/bikes
 *
 * The DB pool is mocked so no real database is needed.
 */

import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

// ── Env must be set BEFORE modules that read it are imported ──────────────
process.env.JWT_SECRET = 'test-secret';

// ── Mock the DB pool ──────────────────────────────────────────────────────
const mockQuery = jest.fn();

jest.unstable_mockModule('../db.js', () => ({
  default: { query: mockQuery, connect: jest.fn() },
}));

// ── Dynamic imports AFTER mocks are registered ────────────────────────────
let app;
let request;

beforeAll(async () => {
  request = (await import('supertest')).default;
  const express = (await import('express')).default;
  const { default: bikesRouter } = await import('../routes/bikes.js');

  app = express();
  app.use(express.json());
  app.use('/api/bikes', bikesRouter);
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────

function makeToken(user) {
  return jwt.sign(user, 'test-secret');
}

const token = makeToken({ id: 'user-1', role: 'shopUser', shop_id: 'shop-1' });

function fakeBike(label) {
  return { id: `bike-${label}`, label, notes: null };
}

// ── GET /api/bikes ────────────────────────────────────────────────────────

describe('GET /api/bikes', () => {
  test('401 when no token provided', async () => {
    const res = await request(app).get('/api/bikes');
    expect(res.status).toBe(401);
  });

  test('empty query → returns all bikes, no query param passed to DB', async () => {
    const bikes = [fakeBike('SG31-48-01'), fakeBike('SG31-48-02')];
    mockQuery.mockResolvedValueOnce({ rows: bikes });

    const res = await request(app)
      .get('/api/bikes')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(bikes);
    // Empty-query branch calls pool.query with no params array
    expect(mockQuery.mock.calls[0][1]).toBeUndefined();
  });

  test('query string → passes %query% and raw query to DB for ILIKE + similarity', async () => {
    const bikes = [fakeBike('SG31-48-01')];
    mockQuery.mockResolvedValueOnce({ rows: bikes });

    const res = await request(app)
      .get('/api/bikes?query=SG31')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(bikes);
    expect(mockQuery.mock.calls[0][1]).toEqual(['%SG31%', 'SG31']);
  });

  test('query is trimmed before DB call', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await request(app)
      .get('/api/bikes?query=%20SG31%20')
      .set('Authorization', `Bearer ${token}`);

    expect(mockQuery.mock.calls[0][1]).toEqual(['%SG31%', 'SG31']);
  });

  test('no matches → returns empty array with 200', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/api/bikes?query=ZZZZZ')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ── POST /api/bikes ───────────────────────────────────────────────────────

describe('POST /api/bikes', () => {
  test('401 when no token provided', async () => {
    const res = await request(app).post('/api/bikes').send({ label: 'SG31-48-01' });
    expect(res.status).toBe(401);
  });

  test('upsert new bike → 201 with bike data', async () => {
    const bike = fakeBike('SG31-48-01');
    mockQuery.mockResolvedValueOnce({ rows: [bike] });

    const res = await request(app)
      .post('/api/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'SG31-48-01' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(bike);
  });

  test('label is uppercased before DB call', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeBike('SG31-48-01')] });

    await request(app)
      .post('/api/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'sg31-48-01' });

    // First param to pool.query is the label — must be uppercased
    expect(mockQuery.mock.calls[0][1][0]).toBe('SG31-48-01');
  });

  test('label is trimmed before DB call', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeBike('SG31-48-01')] });

    await request(app)
      .post('/api/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: '  sg31-48-01  ' });

    expect(mockQuery.mock.calls[0][1][0]).toBe('SG31-48-01');
  });

  test('missing label → 400', async () => {
    const res = await request(app)
      .post('/api/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('empty label → 400', async () => {
    const res = await request(app)
      .post('/api/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: '' });

    expect(res.status).toBe(400);
  });

  test('notes field is stored when provided', async () => {
    const bike = { ...fakeBike('SG31-48-01'), notes: 'needs service' };
    mockQuery.mockResolvedValueOnce({ rows: [bike] });

    const res = await request(app)
      .post('/api/bikes')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'SG31-48-01', notes: 'needs service' });

    expect(res.status).toBe(201);
    expect(res.body.notes).toBe('needs service');
    // notes is passed as second DB param
    expect(mockQuery.mock.calls[0][1][1]).toBe('needs service');
  });
});
