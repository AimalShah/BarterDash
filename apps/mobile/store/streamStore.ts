import { create } from 'zustand';

interface Product {
    id: string;
    title: string;
    price: number;
    image: string;
}

interface StreamState {
    isLive: boolean;
    viewerCount: number;
    activeProduct: Product | null;
    messages: any[];
    setIsLive: (status: boolean) => void;
    setViewerCount: (count: number) => void;
    setActiveProduct: (product: Product | null) => void;
    addMessage: (message: any) => void;
    reset: () => void;
}

export const useStreamStore = create<StreamState>((set) => ({
    isLive: false,
    viewerCount: 0,
    activeProduct: null,
    messages: [],
    setIsLive: (status) => set({ isLive: status }),
    setViewerCount: (count) => set({ viewerCount: count }),
    setActiveProduct: (product) => set({ activeProduct: product }),
    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
    reset: () => set({ isLive: false, viewerCount: 0, activeProduct: null, messages: [] }),
}));
