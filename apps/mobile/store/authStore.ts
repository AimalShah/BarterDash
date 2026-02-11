import { create } from 'zustand';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { usersService } from '../lib/api/services/users';

interface AuthState {
    session: Session | null;
    user: SupabaseUser | null;
    profile: User | null;
    loading: boolean;
    initialized: boolean;
    isFetchingProfile: boolean;
    lastProfileFetch: number;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, userData: any) => Promise<void>;
    signOut: () => Promise<void>;
    setSession: (session: Session | null) => void;
    fetchProfile: (force?: boolean) => Promise<void>;
    initialize: () => Promise<void>;
    setOnboarded: (status: boolean) => void;
    setSellerStatus: (isSeller: boolean) => void;
    subscribeToProfile: () => void;
    // Helper methods for auth guards
    isSeller: () => boolean;
    isAdmin: () => boolean;
    isOnboarded: () => boolean;
    canAccessSellerFeatures: () => boolean;
}

let profileSubscription: any = null;

export const useAuthStore = create<AuthState>((set, get) => ({
    session: null,
    user: null,
    profile: null,
    loading: true,
    initialized: false,
    isFetchingProfile: false,
    lastProfileFetch: 0,

    setOnboarded: (status: boolean) => {
        set((state) => ({
            profile: state.profile ? { ...state.profile, onboarded: status } : null
        }));
    },

    setSellerStatus: (isSeller: boolean) => {
        set((state) => ({
            profile: state.profile ? { ...state.profile, is_seller: isSeller, role: isSeller ? 'SELLER' : state.profile.role } : null
        }));
    },

    subscribeToProfile: () => {
        const { user } = get();
        if (!user) return;

        if (profileSubscription) {
            supabase.removeChannel(profileSubscription);
        }

        profileSubscription = supabase
            .channel(`profile-sync-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Real-time profile update:', payload.new);
                    set({ profile: payload.new as User });
                }
            )
            .subscribe();
    },

    initialize: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            set({ session, user: session?.user || null, loading: false, initialized: true });

            if (session?.user) {
                await get().fetchProfile();
                get().subscribeToProfile();
            }
        } catch (error) {
            console.error('Error initializing auth:', error);
            set({ loading: false, initialized: true });
        }
    },

    setSession: (session) => {
        set({
            session,
            user: session?.user || null,
            loading: false,
            initialized: true
        });
    },

    fetchProfile: async (force = false) => {
        const { session, isFetchingProfile, lastProfileFetch } = get();
        if (!session || isFetchingProfile) return;

        // Skip if fetched very recently (e.g. within 5 seconds) unless forced
        const now = Date.now();
        if (!force && now - lastProfileFetch < 5000 && get().profile) {
            console.log('Skipping profile fetch, recently updated');
            return;
        }

        try {
            set({ isFetchingProfile: true });
            const profile = await usersService.getMe();
            set({
                profile,
                isFetchingProfile: false,
                lastProfileFetch: Date.now()
            });
        } catch (error) {
            console.error('Error fetching profile from API:', error);
            set({ isFetchingProfile: false });
        }
    },

    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Check if user email is confirmed
        if (data.user && !data.user.email_confirmed_at) {
            // Sign out since email is not verified
            await supabase.auth.signOut();
            throw new Error("Email not confirmed. Please verify your email before logging in.");
        }

        set({ session: data.session, user: data.user });
        await get().fetchProfile();
        get().subscribeToProfile();
    },

    signUp: async (email, password, userData) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData,
            },
        });

        if (error) throw error;

        set({ session: data.session, user: data.user });
    },

    signOut: async () => {
        try {
            if (profileSubscription) {
                supabase.removeChannel(profileSubscription);
                profileSubscription = null;
            }
            await supabase.auth.signOut();
            set({ session: null, user: null, profile: null });
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    },

    // Helper methods for auth guards
    isSeller: () => {
        const state = get();
        return !!(state.profile?.is_seller || state.profile?.role === 'SELLER');
    },

    isAdmin: () => {
        const state = get();
        return state.profile?.role === 'ADMIN' || false;
    },

    isOnboarded: () => {
        const state = get();
        return !!(
            state.profile?.onboarded === true ||
            state.profile?.onboarding_step === 'completed'
        );
    },

    isEmailVerified: () => {
        const state = get();
        return !!state.profile?.email_verified;
    },

    isAgeVerified: () => {
        const state = get();
        return !!state.profile?.age_verified;
    },

    canCompleteOnboarding: () => {
        const state = get();
        return !!(
            state.profile?.email_verified === true &&
            state.profile?.age_verified === true
        );
    },

    canAccessSellerFeatures: () => {
        const state = get();
        return !!(state.profile?.is_seller && state.profile?.onboarded);
    },
}));

// Initialize on app start
// Initialize on app start - Commented out to prevent conflict with React Query in RootLayout
// The RootLayout now manages the auth session and data fetching
/*
supabase.auth.onAuthStateChange((event, session) => {
    const store = useAuthStore.getState();
    store.setSession(session);

    if (session) {
        store.fetchProfile();
        store.subscribeToProfile();
    } else {
        if (profileSubscription) {
            supabase.removeChannel(profileSubscription);
            profileSubscription = null;
        }
    }
});
*/
