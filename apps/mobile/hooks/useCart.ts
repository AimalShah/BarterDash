import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { cartService } from '@/lib/api/services/cart';

interface AddToCartInput {
  productId: string;
  quantity?: number;
}

interface UpdateQuantityInput {
  cartItemId: string;
  quantity: number;
}

const cartItemsQueryKey = [...queryKeys.cart, 'items'] as const;

export function useCartQuery() {
  return useQuery({
    queryKey: cartItemsQueryKey,
    queryFn: cartService.getCart,
  });
}

export function useAddToCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity = 1 }: AddToCartInput) =>
      cartService.addItem(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useRemoveFromCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cartItemId: string) => cartService.removeItem(cartItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useUpdateQuantityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartItemId, quantity }: UpdateQuantityInput) =>
      cartService.updateQuantity(cartItemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useClearCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cartService.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useCart() {
  const cartQuery = useCartQuery();
  const addToCartMutation = useAddToCartMutation();
  const removeFromCartMutation = useRemoveFromCartMutation();
  const updateQuantityMutation = useUpdateQuantityMutation();
  const clearCartMutation = useClearCartMutation();

  return {
    items: cartQuery.data ?? [],
    cartQuery,
    addToCartMutation,
    removeFromCartMutation,
    updateQuantityMutation,
    clearCartMutation,
    isLoading: cartQuery.isLoading,
  };
}
