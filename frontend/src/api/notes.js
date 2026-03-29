import { api } from './client.js';

export const fetchNotes  = ()           => api.get('/api/notes');
export const createNote  = (data)       => api.post('/api/notes', data);
export const updateNote  = (id, data)   => api.patch(`/api/notes/${id}`, data);
export const deleteNote  = (id)         => api.delete(`/api/notes/${id}`);
export const fetchArchive = ()          => api.get('/api/admin/archive');
