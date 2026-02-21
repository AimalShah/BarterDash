import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { bidsService } from '@/lib/api/services/bids';

export function useBids(auctionId?: string) {
  return useQuery({
    queryKey: [...queryKeys.bids, 'auction', auctionId] as const,
    queryFn: () => bidsService.getAuctionBids(auctionId as string),
    enabled: Boolean(auctionId),
  });
}

export function useMyBids() {
  return useQuery({
    queryKey: [...queryKeys.bids, 'my'] as const,
    queryFn: () => bidsService.getMyBids(),
  });
}

export function usePlaceBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof bidsService.placeBid>[0]) =>
      bidsService.placeBid(payload),
    onSuccess: (_, variables) => {
      const auctionId = variables.auction_id ?? variables.auctionId;
      queryClient.invalidateQueries({ queryKey: queryKeys.bids });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.auctions, 'detail', auctionId],
      });
    },
  });
}
