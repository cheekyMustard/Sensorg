import { describe, test, expect } from 'vitest';
import { getColorByDue } from './getColorByDue.js';

// Fixed reference date for all tests
const TODAY = new Date('2026-03-16');

describe('getColorByDue', () => {
  // ── Completed/cancelled statuses override date logic ──────────────────

  test('done → gray regardless of date', () => {
    const result = getColorByDue('2026-03-10', 'done', TODAY); // overdue date
    expect(result.border).toBe('border-gray-200');
    expect(result.bg).toBe('bg-gray-50');
  });

  test('cancelled → gray regardless of date', () => {
    const result = getColorByDue('2026-03-30', 'cancelled', TODAY); // future date
    expect(result.border).toBe('border-gray-200');
  });

  // ── Overdue / same-day (≤ 0 days) → red ───────────────────────────────

  test('same day (0 days) → red', () => {
    const result = getColorByDue('2026-03-16', 'open', TODAY);
    expect(result.border).toBe('border-red-400');
    expect(result.bg).toBe('bg-red-50');
    expect(result.text).toBe('text-red-700');
    expect(result.badge).toBe('bg-red-100 text-red-700');
  });

  test('1 day overdue (-1 days) → red', () => {
    const result = getColorByDue('2026-03-15', 'open', TODAY);
    expect(result.border).toBe('border-red-400');
  });

  test('7 days overdue → red', () => {
    const result = getColorByDue('2026-03-09', 'open', TODAY);
    expect(result.border).toBe('border-red-400');
  });

  // ── 1–2 days remaining → yellow ───────────────────────────────────────

  test('1 day remaining → yellow', () => {
    const result = getColorByDue('2026-03-17', 'open', TODAY);
    expect(result.border).toBe('border-yellow-400');
    expect(result.bg).toBe('bg-yellow-50');
  });

  test('2 days remaining → yellow', () => {
    const result = getColorByDue('2026-03-18', 'open', TODAY);
    expect(result.border).toBe('border-yellow-400');
  });

  // ── 3–5 days remaining → blue ─────────────────────────────────────────

  test('3 days remaining → blue', () => {
    const result = getColorByDue('2026-03-19', 'open', TODAY);
    expect(result.border).toBe('border-blue-400');
    expect(result.bg).toBe('bg-blue-50');
  });

  test('5 days remaining → blue', () => {
    const result = getColorByDue('2026-03-21', 'open', TODAY);
    expect(result.border).toBe('border-blue-400');
  });

  // ── > 5 days remaining → green ────────────────────────────────────────

  test('6 days remaining → green', () => {
    const result = getColorByDue('2026-03-22', 'open', TODAY);
    expect(result.border).toBe('border-green-400');
    expect(result.bg).toBe('bg-green-50');
  });

  test('30 days remaining → green', () => {
    const result = getColorByDue('2026-04-15', 'open', TODAY);
    expect(result.border).toBe('border-green-400');
  });

  // ── Status in_progress follows date logic too ─────────────────────────

  test('in_progress + overdue → red', () => {
    const result = getColorByDue('2026-03-10', 'in_progress', TODAY);
    expect(result.border).toBe('border-red-400');
  });

  test('in_progress + future → green', () => {
    const result = getColorByDue('2026-03-25', 'in_progress', TODAY);
    expect(result.border).toBe('border-green-400');
  });

  // ── Return shape always has all four keys ─────────────────────────────

  test('result always contains border, bg, text, badge', () => {
    for (const status of ['open', 'in_progress', 'done', 'cancelled']) {
      const result = getColorByDue('2026-03-20', status, TODAY);
      expect(result).toHaveProperty('border');
      expect(result).toHaveProperty('bg');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('badge');
    }
  });

  // ── Default today parameter ───────────────────────────────────────────

  test('today defaults to current date (smoke test)', () => {
    // Just ensure it does not throw when today is omitted
    expect(() => getColorByDue('2030-01-01', 'open')).not.toThrow();
  });
});
