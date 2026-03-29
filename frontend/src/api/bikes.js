import { api } from './client.js';

export const fetchBikesInventory = () => api.get('/api/bikes/inventory');
