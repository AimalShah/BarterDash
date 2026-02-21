import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '@/lib/api/services/categories';
import { queryKeys } from '@/lib/api/queryKeys';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: categoriesService.findAll,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  });
}
