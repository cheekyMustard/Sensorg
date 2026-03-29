const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('token');
}

function getActiveShopId() {
  try {
    const raw = localStorage.getItem('activeShop');
    return raw ? JSON.parse(raw).id : null;
  } catch { return null; }
}

async function request(path, options = {}) {
  const token       = getToken();
  const activeShopId = getActiveShopId();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token        ? { Authorization: `Bearer ${token}` }   : {}),
      ...(activeShopId ? { 'X-Shop-Id': activeShopId }          : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const raw = body.error;
    const msg = Array.isArray(raw)
      ? raw.map(e => e.message ?? String(e)).join(', ')
      : (raw ?? `HTTP ${res.status}`);
    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get:    (path)         => request(path),
  post:   (path, data)  => request(path, { method: 'POST',   body: JSON.stringify(data) }),
  patch:  (path, data)  => request(path, { method: 'PATCH',  body: JSON.stringify(data) }),
  delete: (path, data)  => request(path, { method: 'DELETE', ...(data ? { body: JSON.stringify(data) } : {}) }),
};
