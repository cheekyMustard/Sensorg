/**
 * Returns Tailwind border + background classes for a request card
 * based on how many days remain until date_rental.
 *
 * Colour rules (from docs/instructions.md):
 *   done / cancelled → gray
 *   ≤ 0 days         → red   (overdue)
 *   1–2 days         → yellow
 *   3–5 days         → blue
 *   > 5 days         → green
 */
export function getColorByDue(dateRental, status, today = new Date()) {
  if (status === 'done' || status === 'cancelled') {
    return { border: 'border-gray-200', bg: 'bg-gray-50', text: 'text-gray-400', badge: 'bg-gray-100 text-gray-500' };
  }

  const due      = new Date(dateRental);
  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const dueUtc   = new Date(Date.UTC(due.getFullYear(),   due.getMonth(),   due.getDate()));
  const days     = Math.round((dueUtc - todayUtc) / 86_400_000);

  if (days <= 0) {
    return { border: 'border-red-400',    bg: 'bg-red-50',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700' };
  }
  if (days <= 2) {
    return { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' };
  }
  if (days <= 5) {
    return { border: 'border-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700' };
  }
  return   { border: 'border-green-400',  bg: 'bg-green-50',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700' };
}
