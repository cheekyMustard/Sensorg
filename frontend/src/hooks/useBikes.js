import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchBikesInventory } from '../api/bikes.js';
import { updateAdminBike } from '../api/admin.js';

export function useBikesInventory() {
  return useQuery({
    queryKey: ['bikes', 'inventory'],
    queryFn: fetchBikesInventory,
    staleTime: 30_000,
  });
}

export function useMoveBike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, shop_id }) => updateAdminBike(id, { current_shop_id: shop_id ?? null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bikes', 'inventory'] });
      toast.success('Bike moved');
    },
    onError: (err) => toast.error(err.message),
  });
}
