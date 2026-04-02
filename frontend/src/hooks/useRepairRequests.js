import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchRepairRequests, createRepairRequest, deleteRepairRequest, advanceRepairRequest } from '../api/repairRequests.js';

export function useRepairRequests() {
  return useQuery({ queryKey: ['repair-requests'], queryFn: fetchRepairRequests });
}

export function useCreateRepairRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createRepairRequest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repair-requests'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteRepairRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteRepairRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['repair-requests'] }),
    onError: (err) => toast.error(err.message),
  });
}

export function useAdvanceRepairRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, to }) => advanceRepairRequest(id, to),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repair-requests'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => toast.error(err.message),
  });
}
