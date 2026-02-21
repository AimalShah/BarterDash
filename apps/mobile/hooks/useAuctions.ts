import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { auctionsService } from '@/lib/api/services/auctions';

export interface AuctionsQuery {
  status?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function useAuctions(query?: AuctionsQuery) {
  return useQuery({
    queryKey: [...queryKeys.auctions, query] as const,
    queryFn: () => auctionsService.findAll(query),
  });
}

export function useAuctionById(id?: string) {
  return useQuery({
    queryKey: [...queryKeys.auctions, 'detail', id] as const,
    queryFn: () => auctionsService.findById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateAuction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof auctionsService.create>[0]) =>
      auctionsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions });
    },
  });
}

export function useEndAuction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => auctionsService.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.auctions, 'detail', id],
      });
    },
  });
}
