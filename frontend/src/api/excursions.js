import { api } from './client.js';

export const fetchExcursions  = (company) => api.get(`/api/excursions${company ? `?company=${encodeURIComponent(company)}` : ''}`);
export const createExcursion  = (data)    => api.post('/api/excursions', data);
export const deleteExcursion  = (id)      => api.delete(`/api/excursions/${id}`);
