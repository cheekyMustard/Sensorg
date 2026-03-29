import { api } from './client.js';

export const fetchTasks      = ()         => api.get('/api/tasks');
export const createTask      = (data)     => api.post('/api/tasks', data);
export const updateTask      = (id, data) => api.patch(`/api/tasks/${id}`, data);
export const deleteTask      = (id)       => api.delete(`/api/tasks/${id}`);
export const completeTask    = (id)       => api.post(`/api/tasks/${id}/complete`, {});
export const uncompleteTask  = (id)       => api.delete(`/api/tasks/${id}/complete`);
