/**
 * Integration tests for POST /api/requests/:id/status
 *
 * The DB pool and push module are mocked so no real database is needed.
 * A JWT is signed with a known test secret.
 */

import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

// ── Env must be set BEFORE modules that read it are imported ──────────────
process.env.JWT_SECRET = 'test-secret';
// Prevent web-push from crashing on missing VAPID env vars
process.env.VAPID_SUBJECT    = 'mailto:test@example.com';
process.env.VAPID_PUBLIC_KEY  = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
process.env.VAPID_PRIVATE_KEY = 'IQ9Ur0iFXRZFMGMoTMTMaBwrI6q4wMdnGvKgkWChYIY';

// ── Mock the DB pool ──────────────────────────────────────────────────────
const mockRelease = jest.fn();
const mockClientQuery = jest.fn();
const mockClient = {
  query:   mockClientQuery,
  release: mockRelease,
};
const mockConnect = jest.fn().mockResolvedValue(mockClient);

jest.unstable_mockModule('../db.js', () => ({
  default: { connect: mockConnect, query: jest.fn() },
}));

// ── Mock push (avoid real web-push calls) ─────────────────────────────────
jest.unstable_mockModule('../push.js', () => ({
  sendPushToUsers: jest.fn().mockResolvedValue(undefined),
}));

// ── Dynamic imports AFTER mocks are registered ────────────────────────────
let app;

beforeAll(async () => {
  const express        = (await import('express')).default;
  const { default: requestsRouter } = await import('../routes/requests.js');

  app = express();
  app.use(express.json());
  app.use('/api/requests', requestsRouter);
});

// ── Helpers ───────────────────────────────────────────────────────────────

function makeToken(user) {
  return jwt.sign(user, 'test-secret');
}

const shopUserId  = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const driverId    = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const managerId   = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const shopId      = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const requestId   = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

const tokenShopUser = makeToken({ id: shopUserId, role: 'shopUser', shop_id: shopId });
const tokenDriver   = makeToken({ id: driverId,   role: 'driver',   shop_id: shopId });
const tokenManager  = makeToken({ id: managerId,  role: 'manager',  shop_id: shopId });

/** Build a fake request row as returned by the DB */
function fakeRequest(overrides = {}) {
  return {
    id:                requestId,
    from_shop_id:      shopId,
    to_shop_id:        'ffffffff-ffff-ffff-ffff-ffffffffffff',
    reason:            'rental',
    status:            'open',
    version:           1,
    created_by_user_id: shopUserId,
    ...overrides,
  };
}

/** Configure the mock client to handle a standard status transition flow */
function setupMockClientForTransition(requestRow, updatedStatus) {
  mockClientQuery
    .mockResolvedValueOnce({ rows: [] })                         // BEGIN
    .mockResolvedValueOnce({ rows: [requestRow] })               // SELECT ... FOR UPDATE
    .mockResolvedValueOnce({ rows: [{ ...requestRow, status: updatedStatus, version: requestRow.version + 1 }] }) // UPDATE
    .mockResolvedValueOnce({ rows: [] })                         // INSERT audit_log
    .mockResolvedValueOnce({ rows: [] });                        // COMMIT
}

// ── Tests ─────────────────────────────────────────────────────────────────

let request;
beforeAll(async () => {
  request = (await import('supertest')).default;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/requests/:id/status', () => {
  test('401 when no token provided', async () => {
    const res = await request(app)
      .post(`/api/requests/${requestId}/status`)
      .send({ to: 'in_progress' });

    expect(res.status).toBe(401);
  });

  test('open → in_progress: shopUser succeeds (200)', async () => {
    const req = fakeRequest({ status: 'open' });
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })                                                             // BEGIN
      .mockResolvedValueOnce({ rows: [req] })                                                          // SELECT FOR UPDATE
      .mockResolvedValueOnce({ rows: [{ ...req, status: 'in_progress', version: 2 }] })               // UPDATE
      .mockResolvedValueOnce({ rows: [] })                                                             // INSERT audit_log
      .mockResolvedValueOnce({ rows: [{ label: 'SG31-48-01' }] })                                     // SELECT bike labels (push)
      .mockResolvedValueOnce({ rows: [{ from_name: 'Arcos', to_name: 'THB' }] })                      // SELECT shop names (push)
      .mockResolvedValueOnce({ rows: [] });                                                            // COMMIT

    const res = await request(app)
      .post(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${tokenShopUser}`)
      .send({ to: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });

  test('open → in_progress: driver succeeds (200)', async () => {
    const req = fakeRequest({ status: 'open' });
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [req] })
      .mockResolvedValueOnce({ rows: [{ ...req, status: 'in_progress', version: 2 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ label: 'SG31-48-01' }] })
      .mockResolvedValueOnce({ rows: [{ from_name: 'Arcos', to_name: 'THB' }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${tokenDriver}`)
      .send({ to: 'in_progress' });

    expect(res.status).toBe(200);
  });

  test('in_progress → done: driver succeeds (200)', async () => {
    const req = fakeRequest({ status: 'in_progress', reason: 'repair' }); // repair skips push
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })          // BEGIN
      .mockResolvedValueOnce({ rows: [req] })        // SELECT FOR UPDATE
      .mockResolvedValueOnce({ rows: [{ ...req, status: 'done', version: 2 }] }) // UPDATE
      .mockResolvedValueOnce({ rows: [] })            // INSERT audit_log
      .mockResolvedValueOnce({ rows: [] })            // UPDATE bikes location
      .mockResolvedValueOnce({ rows: [] });           // COMMIT

    const res = await request(app)
      .post(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${tokenDriver}`)
      .send({ to: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
  });

  test('in_progress → done: shopUser denied (403)', async () => {
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })          // BEGIN
      .mockResolvedValueOnce({ rows: [fakeRequest({ status: 'in_progress' })] }) // SELECT
      .mockResolvedValueOnce({ rows: [] });          // ROLLBACK

    const res = await request(app)
      .post(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${tokenShopUser}`)
      .send({ to: 'done' });

    expect(res.status).toBe(403);
  });

  test('open → cancelled: shopUser denied (403)', async () => {
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [fakeRequest({ status: 'open' })] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${tokenShopUser}`)
      .send({ to: 'cancelled' });

    expect(res.status).toBe(403);
  });

  test('open → cancelled: manager succeeds (200)', async () => {
    setupMockClientForTransition(fakeRequest({ status: 'open' }), 'cancelled');

    const res = await request(app)
      .post(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${tokenManager}`)
      .send({ to: 'cancelled' });

    expect(res.status).toBe(200);
  });

  test('done → in_progress: invalid transition (403)', async () => {
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [fakeRequest({ status: 'done' })] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${tokenManager}`)
      .send({ to: 'in_progress' });

    expect(res.status).toBe(403);
  });

  test('request not found → 404', async () => {
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })   // BEGIN
      .mockResolvedValueOnce({ rows: [] })   // SELECT → empty
      .mockResolvedValueOnce({ rows: [] });  // ROLLBACK

    const res = await request(app)
      .post(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${tokenDriver}`)
      .send({ to: 'in_progress' });

    expect(res.status).toBe(404);
  });

  test('invalid status value → 400', async () => {
    const res = await request(app)
      .post(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${tokenDriver}`)
      .send({ to: 'unknown_status' });

    expect(res.status).toBe(400);
  });
});
