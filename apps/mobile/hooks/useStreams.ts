import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { streamsService } from '@/lib/api/services/streams';

export interface StreamsQuery {
  status?: string;
  category_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function useStreams(query?: StreamsQuery) {
  return useQuery({
    queryKey: [...queryKeys.streams, query] as const,
    queryFn: () => streamsService.findAll(query),
  });
}

export function useStreamById(id?: string) {
  return useQuery({
    queryKey: [...queryKeys.streams, 'detail', id] as const,
    queryFn: () => streamsService.findById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof streamsService.create>[0]) =>
      streamsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streams });
    },
  });
}

export function useUpdateStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof streamsService.update>[1];
    }) => streamsService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streams });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.streams, 'detail', variables.id],
      });
    },
  });
}

export function useDeleteStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => streamsService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streams });
    },
  });
}
