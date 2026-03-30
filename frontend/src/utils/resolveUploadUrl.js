const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * Resolves an image URL that may be a relative /uploads/ path (from the
 * local upload endpoint) or an absolute URL (external image). Returns null
 * if the input is falsy.
 */
export function resolveUploadUrl(url) {
  if (!url) return null;
  return url.startsWith('/uploads/') ? `${API_BASE}${url}` : url;
}
