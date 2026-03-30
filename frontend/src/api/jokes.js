import api from './client.js';

export const fetchJokes      = ()       => api.get('/api/jokes').then(r => r.data);
export const createJoke      = (data)   => api.post('/api/jokes', data).then(r => r.data);
export const deleteJoke      = (id)     => api.delete(`/api/jokes/${id}`);
export const fetchCategories = ()       => api.get('/api/jokes/categories').then(r => r.data);
export const createCategory  = (name)   => api.post('/api/jokes/categories', { name }).then(r => r.data);
