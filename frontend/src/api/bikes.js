import { api } from './client.js';

export const fetchBikesInventory = () => api.get('/api/bikes/inventory');
export const deleteBike          = (id) => api.delete(`/api/bikes/${id}`);
