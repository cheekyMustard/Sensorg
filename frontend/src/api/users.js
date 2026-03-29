import { api } from './client.js';

export const fetchUsers = () => api.get('/api/users');
