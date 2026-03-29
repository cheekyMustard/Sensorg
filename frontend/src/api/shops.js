import { api } from './client.js';

export const fetchShops = () => api.get('/api/shops');
