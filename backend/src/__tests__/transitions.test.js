import { canTransition } from '../utils/transitions.js';

describe('canTransition – state machine', () => {
  // ── Valid transitions ──────────────────────────────────────────────────

  test('open → in_progress: driver allowed', () => {
    expect(canTransition('open', 'in_progress', ['driver'])).toBe(true);
  });

  test('open → in_progress: admin allowed', () => {
    expect(canTransition('open', 'in_progress', ['admin'])).toBe(true);
  });

  test('open → in_progress: driver+mechanic multi-role allowed', () => {
    expect(canTransition('open', 'in_progress', ['driver', 'mechanic'])).toBe(true);
  });

  test('in_progress → done: driver allowed', () => {
    expect(canTransition('in_progress', 'done', ['driver'])).toBe(true);
  });

  test('in_progress → done: admin allowed', () => {
    expect(canTransition('in_progress', 'done', ['admin'])).toBe(true);
  });

  test('open → cancelled: organiser allowed', () => {
    expect(canTransition('open', 'cancelled', ['organiser'])).toBe(true);
  });

  test('open → cancelled: admin allowed', () => {
    expect(canTransition('open', 'cancelled', ['admin'])).toBe(true);
  });

  test('in_progress → cancelled: organiser allowed', () => {
    expect(canTransition('in_progress', 'cancelled', ['organiser'])).toBe(true);
  });

  // ── Role denials ───────────────────────────────────────────────────────

  test('open → in_progress: mechanic denied (deliveries are driver-only)', () => {
    expect(canTransition('open', 'in_progress', ['mechanic'])).toBe(false);
  });

  test('open → in_progress: general denied', () => {
    expect(canTransition('open', 'in_progress', ['general'])).toBe(false);
  });

  test('open → in_progress: organiser denied', () => {
    expect(canTransition('open', 'in_progress', ['organiser'])).toBe(false);
  });

  test('in_progress → done: mechanic denied for deliveries', () => {
    expect(canTransition('in_progress', 'done', ['mechanic'])).toBe(false);
  });

  test('in_progress → done: general denied', () => {
    expect(canTransition('in_progress', 'done', ['general'])).toBe(false);
  });

  test('open → cancelled: driver denied', () => {
    expect(canTransition('open', 'cancelled', ['driver'])).toBe(false);
  });

  test('open → cancelled: mechanic denied', () => {
    expect(canTransition('open', 'cancelled', ['mechanic'])).toBe(false);
  });

  test('open → in_progress: cleaner denied', () => {
    expect(canTransition('open', 'in_progress', ['cleaner'])).toBe(false);
  });

  // ── Legacy string form (backward compat) ──────────────────────────────

  test('accepts single string role: driver allowed open→in_progress', () => {
    expect(canTransition('open', 'in_progress', 'driver')).toBe(true);
  });

  test('accepts single string role: general denied open→in_progress', () => {
    expect(canTransition('open', 'in_progress', 'general')).toBe(false);
  });

  // ── Invalid state-machine transitions ─────────────────────────────────

  test('done → in_progress: not a valid status-endpoint transition', () => {
    expect(canTransition('done', 'in_progress', ['admin'])).toBe(false);
  });

  test('done → open: not allowed', () => {
    expect(canTransition('done', 'open', ['admin'])).toBe(false);
  });

  test('cancelled → open: not allowed', () => {
    expect(canTransition('cancelled', 'open', ['admin'])).toBe(false);
  });

  test('open → done: must go through in_progress', () => {
    expect(canTransition('open', 'done', ['admin'])).toBe(false);
  });

  test('in_progress → open: not allowed via status endpoint', () => {
    expect(canTransition('in_progress', 'open', ['admin'])).toBe(false);
  });

  // ── Unknown states ─────────────────────────────────────────────────────

  test('unknown from-status returns false', () => {
    expect(canTransition('pending', 'open', ['admin'])).toBe(false);
  });

  test('null from-status returns false', () => {
    expect(canTransition(null, 'open', ['admin'])).toBe(false);
  });
});
