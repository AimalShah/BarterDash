import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/users';
import { supabase } from '../../supabase';
import { User } from '../../../types';

export const USER_QUERY_KEY = ['user', 'me'];

export function useUserQuery() {
    return useQuery({
        queryKey: USER_QUERY_KEY,
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;
            return usersService.getMe();
        },
        // Only refetch when explicit or stale, avoids loops
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false, // Don't retry on 401/403/429 loops instantly
    });
}

export function useUpdateProfileMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<User>) => {
            const response = await usersService.updateProfile(data as any);
            return response;
        },
        onSuccess: () => {
            // Invalidate the user query to refetch fresh data
            queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
        },
    });
}
