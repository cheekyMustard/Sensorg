import { api } from './client.js';

export const fetchRepairRequests     = ()          => api.get('/api/repair-requests');
export const advanceRepairRequest    = (id, to)    => api.post(`/api/repair-requests/${id}/status`, { to });
