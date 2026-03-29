export const TRANSITIONS = {
  open:        ['in_progress', 'cancelled'],
  in_progress: ['done', 'cancelled'],
  done:        [],
  cancelled:   [],
};

/**
 * Returns true if the given role(s) may move a request from `from` to `to`.
 * @param {string}          from  - current status
 * @param {string}          to    - target status
 * @param {string|string[]} roles - user role or array of roles
 */
export function canTransition(from, to, roles) {
  const roleArr = Array.isArray(roles) ? roles : [roles];
  const has = (...allowed) => roleArr.some(r => allowed.includes(r));

  if (!TRANSITIONS[from]?.includes(to)) return false;
  if (to === 'in_progress' && !has('driver', 'admin')) return false;
  if (to === 'done'        && !has('driver', 'admin')) return false;
  if (to === 'cancelled'   && !has('organiser', 'admin')) return false;
  return true;
}
