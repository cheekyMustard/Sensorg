import { api } from './client.js';

// Users
export const fetchAdminUsers   = ()           => api.get('/api/admin/users');
export const createAdminUser   = (data)        => api.post('/api/admin/users', data);
export const updateAdminUser   = (id, data)    => api.patch(`/api/admin/users/${id}`, data);

// Shops
export const fetchAdminShops   = ()           => api.get('/api/admin/shops');
export const createAdminShop   = (data)        => api.post('/api/admin/shops', data);
export const updateAdminShop   = (id, data)    => api.patch(`/api/admin/shops/${id}`, data);

// Bikes
export const fetchAdminBikes   = ()           => api.get('/api/admin/bikes');
export const updateAdminBike   = (id, data)    => api.patch(`/api/admin/bikes/${id}`, data);
export const deleteAdminUser   = (id)          => api.delete(`/api/admin/users/${id}`);
