import { api } from './client.js';

export const getVapidKey      = ()           => api.get('/api/push/vapid-public-key');
export const subscribePush    = (sub)        => api.post('/api/push/subscribe', sub);
export const unsubscribePush  = (endpoint)   => api.delete('/api/push/subscribe', { endpoint });
export const getPushStatus    = (endpoint)   => api.get(`/api/push/status?endpoint=${encodeURIComponent(endpoint)}`);
