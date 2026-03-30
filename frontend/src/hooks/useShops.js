import { useQuery } from '@tanstack/react-query';
import { fetchShops } from '../api/shops.js';

export function useShops() {
  return useQuery({
    queryKey: ['shops'],
    queryFn:  fetchShops,
    staleTime: 5 * 60_000,
  });
}
