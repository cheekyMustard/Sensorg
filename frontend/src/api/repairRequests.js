import { api } from './client.js';

export const fetchRepairRequests     = ()          => api.get('/api/repair-requests');
export const createRepairRequest     = (data)      => api.post('/api/repair-requests', data);
export const deleteRepairRequest     = (id)        => api.delete(`/api/repair-requests/${id}`);
export const advanceRepairRequest    = (id, to)    => api.post(`/api/repair-requests/${id}/status`, { to });
