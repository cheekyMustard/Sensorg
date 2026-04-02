import { api } from './client.js';

export const fetchExcursions  = (company) => api.get(`/api/excursions${company ? `?company=${encodeURIComponent(company)}` : ''}`);
export const createExcursion  = (data)    => api.post('/api/excursions', data);
export const updateExcursion  = (id, data) => api.patch(`/api/excursions/${id}`, data);
export const deleteExcursion    = (id)    => api.delete(`/api/excursions/${id}`);
export const approveExcursion   = (id)    => api.post(`/api/excursions/${id}/approve`, {});
export const rejectExcursion    = (id)    => api.post(`/api/excursions/${id}/reject`, {});
