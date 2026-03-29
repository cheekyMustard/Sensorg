import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser,
  fetchAdminShops, createAdminShop, updateAdminShop,
  fetchAdminBikes, updateAdminBike,
} from '../api/admin.js';

// ── Users ────────────────────────────────────────────────────────────────────

export function useAdminUsers() {
  return useQuery({ queryKey: ['admin', 'users'], queryFn: fetchAdminUsers });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdminUser,
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('User created'); },
    onError:    (err) => toast.error(err.message),
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateAdminUser(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(['admin', 'users'], (old) =>
        old ? old.map(u => u.id === updated.id ? { ...u, ...updated } : u) : old
      );
      toast.success('User updated');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminUser,
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('User deleted'); },
    onError:    (err) => toast.error(err.message),
  });
}

// ── Shops ────────────────────────────────────────────────────────────────────

export function useAdminShops() {
  return useQuery({ queryKey: ['admin', 'shops'], queryFn: fetchAdminShops });
}

export function useCreateAdminShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdminShop,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['admin', 'shops'] });
      qc.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Shop created');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateAdminShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateAdminShop(id, data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['admin', 'shops'] });
      qc.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Shop updated');
    },
    onError: (err) => toast.error(err.message),
  });
}

// ── Bikes ────────────────────────────────────────────────────────────────────

export function useAdminBikes() {
  return useQuery({ queryKey: ['admin', 'bikes'], queryFn: fetchAdminBikes });
}

export function useUpdateAdminBike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateAdminBike(id, data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'bikes'] }); toast.success('Bike updated'); },
    onError:    (err) => toast.error(err.message),
  });
}
