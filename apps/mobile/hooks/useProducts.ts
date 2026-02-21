import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { productsService } from '@/lib/api/services/products';

export interface ProductsQuery {
  category?: string;
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

function normalizeProductsQuery(query?: ProductsQuery) {
  if (!query) return undefined;

  const { category, categoryId, ...restQuery } = query;
  const resolvedCategory = categoryId ?? category;
  return resolvedCategory
    ? { ...restQuery, category_id: resolvedCategory }
    : restQuery;
}

export function useProducts(query?: ProductsQuery) {
  const normalizedQuery = normalizeProductsQuery(query);

  return useQuery({
    queryKey: [...queryKeys.products, normalizedQuery] as const,
    queryFn: () => productsService.findAll(normalizedQuery),
  });
}

export function useProductById(id?: string) {
  return useQuery({
    queryKey: [...queryKeys.products, 'detail', id] as const,
    queryFn: () => productsService.findById(id as string),
    enabled: Boolean(id),
  });
}

export function useProductsByCategory(
  categoryId?: string,
  query?: Omit<ProductsQuery, 'category' | 'categoryId'>
) {
  return useProducts({ ...query, categoryId });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof productsService.create>[0]) =>
      productsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof productsService.update>[1];
    }) => productsService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.products, 'detail', variables.id],
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}
