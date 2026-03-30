import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchRequests, createRequest, updateRequest, changeStatus, deleteRequest, fetchBikes } from '../api/requests.js';

const PAGE_SIZE = 20;

export function useRequests(status = 'active') {
  const query = useInfiniteQuery({
    queryKey:        ['requests', status],
    queryFn:         ({ pageParam }) => fetchRequests(status, PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * PAGE_SIZE : undefined,
  });
  return {
    ...query,
    // Flat array of all loaded rows — works the same as the old `data` array for consumers
    requests: query.data?.pages.flatMap(p => p.data) ?? [],
  };
}

export function useUpdateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateRequest(id, data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['requests'] }); toast.success('Changes saved'); },
    onError:    (err) => toast.error(err.message ?? 'Failed to save changes'),
  });
}

export function useChangeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, to }) => changeStatus(id, to),
    onSuccess:  (_data, { to }) => {
      qc.invalidateQueries({ queryKey: ['requests'] });
      const label = to === 'in_progress' ? 'Job taken' : to === 'done' ? 'Marked as done' : 'Status updated';
      toast.success(label);
    },
    onError: (err) => toast.error(err.message ?? 'Status change failed'),
  });
}

export function useDeleteRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteRequest(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['requests'] }); toast.success('Request deleted'); },
    onError:    (err) => toast.error(err.message ?? 'Delete failed'),
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createRequest(data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['requests'] }); toast.success('Delivery created'); },
    onError:    (err) => toast.error(err.message ?? 'Failed to create delivery'),
  });
}

export function useBikeSuggest(query, shopId = null) {
  return useQuery({
    queryKey: ['bikes', 'suggest', query, shopId],
    queryFn:  () => fetchBikes(query, shopId),
    enabled:  query.trim().length > 0,
    staleTime: 10_000,
  });
}

/** Toggle brm_blocked on a request without showing a generic "Changes saved" toast. */
export function useBrmToggle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, brm_blocked, version }) => updateRequest(id, { brm_blocked, version }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['requests'] }),
    onError:    (err) => toast.error(err.message ?? 'Could not save'),
  });
}
