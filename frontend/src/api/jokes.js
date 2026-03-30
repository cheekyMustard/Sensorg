import { api } from './client.js';

export const fetchJokes      = ()       => api.get('/api/jokes');
export const createJoke      = (data)   => api.post('/api/jokes', data);
export const deleteJoke      = (id)     => api.delete(`/api/jokes/${id}`);
export const fetchCategories = ()       => api.get('/api/jokes/categories');
export const createCategory  = (name)   => api.post('/api/jokes/categories', { name });
