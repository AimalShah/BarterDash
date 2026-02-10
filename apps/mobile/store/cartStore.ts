import { create } from 'zustand';
import { cartService } from '../lib/api/services/cart';

interface CartState {
    itemCount: number;
    loading: boolean;
    error: string | null;
    fetchCartCount: () => Promise<void>;
    incrementCount: () => void;
    decrementCount: () => void;
    setCount: (count: number) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
    itemCount: 0,
    loading: false,
    error: null,

    fetchCartCount: async () => {
        try {
            set({ loading: true, error: null });
            const count = await cartService.getItemCount();
            set({ itemCount: count, loading: false });
        } catch (error) {
            console.error('Error fetching cart count:', error);
            set({ error: 'Failed to fetch cart count', loading: false });
        }
    },

    incrementCount: () => {
        set((state) => ({ itemCount: state.itemCount + 1 }));
    },

    decrementCount: () => {
        set((state) => ({ itemCount: Math.max(0, state.itemCount - 1) }));
    },

    setCount: (count: number) => {
        set({ itemCount: count });
    },
}));
