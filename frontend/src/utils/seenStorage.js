/** Generic localStorage-backed "seen" tracker used for unread badges. */

export function loadSeen(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
  catch { return new Set(); }
}

export function saveSeen(key, set) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

/** Merges ids into the stored seen set and persists it. */
export function markAllSeen(key, ids) {
  const next = new Set([...loadSeen(key), ...ids]);
  saveSeen(key, next);
  return next;
}
