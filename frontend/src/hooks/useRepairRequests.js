import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchRepairRequests, advanceRepairRequest } from '../api/repairRequests.js';

export function useRepairRequests() {
  return useQuery({ queryKey: ['repair-requests'], queryFn: fetchRepairRequests });
}

export function useAdvanceRepairRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, to }) => advanceRepairRequest(id, to),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repair-requests'] });
    },
    onError: (err) => toast.error(err.message),
  });
}
