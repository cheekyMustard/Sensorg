import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchExcursions, createExcursion, updateExcursion, deleteExcursion, approveExcursion, rejectExcursion } from '../api/excursions.js';

export function useExcursions(company = null) {
  return useQuery({
    queryKey: ['excursions', company],
    queryFn:  () => fetchExcursions(company),
    staleTime: 30_000,
  });
}

export function useUpdateExcursion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => updateExcursion(id, data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['excursions'] });
      toast.success('Entry updated');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useCreateExcursion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createExcursion,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['excursions'] });
      toast.success('Entry created');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteExcursion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteExcursion,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['excursions'] });
      toast.success('Entry deleted');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useApproveExcursion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approveExcursion,
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['excursions'] }); toast.success('Entry approved'); },
    onError:    (err) => toast.error(err.message),
  });
}

export function useRejectExcursion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rejectExcursion,
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['excursions'] }); toast.success('Entry rejected'); },
    onError:    (err) => toast.error(err.message),
  });
}
