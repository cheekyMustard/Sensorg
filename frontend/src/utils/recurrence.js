export const RECURRENCE_OPTIONS = [
  { value: 'day:1',   label: 'Every day' },
  { value: 'day:2',   label: 'Every 2 days' },
  { value: 'day:3',   label: 'Every 3 days' },
  { value: 'day:4',   label: 'Every 4 days' },
  { value: 'day:5',   label: 'Every 5 days' },
  { value: 'day:6',   label: 'Every 6 days' },
  { value: 'week:1',  label: 'Every week' },
  { value: 'month:1', label: 'Every month' },
];

/** Parse a "unit:interval" recurrence key into its parts. */
export function parseRecurrenceKey(key) {
  const [unit, interval] = key.split(':');
  return { recurrence_unit: unit, recurrence_interval: Number(interval) };
}

/** Build a "unit:interval" key from separate fields. */
export function recurrenceKey(unit, interval) {
  return `${unit}:${interval}`;
}

/** Return a human-readable label for the given unit/interval pair. */
export function recurrenceLabel(unit, interval) {
  if (unit === 'week')  return 'Every week';
  if (unit === 'month') return 'Every month';
  if (interval === 1)   return 'Every day';
  return `Every ${interval} days`;
}
