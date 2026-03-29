import { api } from './client.js';

export const fetchRequests  = (status = 'active', limit = 20, offset = 0) =>
  api.get(`/api/requests?status=${status}&limit=${limit}&offset=${offset}`);
export const createRequest  = (data)               => api.post('/api/requests', data);
export const updateRequest  = (id, data)           => api.patch(`/api/requests/${id}`, data);
export const changeStatus   = (id, to)             => api.post(`/api/requests/${id}/status`, { to });
export const deleteRequest  = (id)                 => api.delete(`/api/requests/${id}`);
export const fetchBikes     = (query = '', shopId = null) => {
  const params = new URLSearchParams({ query });
  if (shopId) params.append('shop_id', shopId);
  return api.get(`/api/bikes?${params}`);
};
