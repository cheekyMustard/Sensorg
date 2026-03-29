import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchKb, createKb, updateKb, deleteKb } from '../api/kb.js';

export function useKb() {
  return useQuery({ queryKey: ['kb'], queryFn: fetchKb });
}

export function useCreateKb() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createKb,
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['kb'] }); toast.success('Article created'); },
    onError:    (err) => toast.error(err.message),
  });
}

export function useUpdateKb() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateKb(id, data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['kb'] }); toast.success('Article updated'); },
    onError:    (err) => toast.error(err.message),
  });
}

export function useDeleteKb() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteKb(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['kb'] }); toast.success('Article deleted'); },
    onError:    (err) => toast.error(err.message),
  });
}
