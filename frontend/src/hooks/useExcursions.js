import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchExcursions, createExcursion, deleteExcursion } from '../api/excursions.js';

export function useExcursions(company = null) {
  return useQuery({
    queryKey: ['excursions', company],
    queryFn:  () => fetchExcursions(company),
    staleTime: 30_000,
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
