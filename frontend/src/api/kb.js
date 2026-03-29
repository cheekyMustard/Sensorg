import { api } from './client.js';

export const fetchKb      = ()         => api.get('/api/kb');
export const createKb     = (data)     => api.post('/api/kb', data);
export const updateKb     = (id, data) => api.patch(`/api/kb/${id}`, data);
export const deleteKb     = (id)       => api.delete(`/api/kb/${id}`);
