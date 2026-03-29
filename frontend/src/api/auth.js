import { api } from './client.js';

export function login(username, password, activeShopId) {
  return api.post('/api/auth/login', { username, password, active_shop_id: activeShopId ?? null });
}

export function getMe() {
  return api.get('/api/auth/me');
}
