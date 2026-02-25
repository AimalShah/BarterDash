import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import apiClient from '@/lib/api/client';
import { getEmailVerificationRedirectUri } from '@/lib/auth/emailVerification';
import { queryKeys } from '@/lib/api/queryKeys';

type AuthProfile = Record<string, unknown> | null;

interface RegisterInput {
  email: string;
  password: string;
  username: string;
}

interface PasswordResetInput {
  email: string;
  redirectTo?: string;
}

interface ResendVerificationInput {
  email: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: [...queryKeys.auth, 'session'],
    queryFn: async (): Promise<Session | null> => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...queryKeys.auth, 'session'], data.session ?? null);
    },
  });

  const sessionMutation = useMutation({
    mutationFn: async ({ access_token, refresh_token }: { access_token: string; refresh_token: string }
    ) => {
      const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
      if (error) throw error;
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...queryKeys.auth, 'session'], data.session ?? null)
    }
  })

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, username }: RegisterInput) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: username,
          },
          emailRedirectTo: getEmailVerificationRedirectUri(),
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...queryKeys.auth, 'session'], data.session ?? null);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.setQueryData([...queryKeys.auth, 'session'], null);
    },
  });

  const requestPasswordResetMutation = useMutation({
    mutationFn: async ({ email, redirectTo }: PasswordResetInput) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || 'barterdash://auth/confirm',
      });

      if (error) throw error;
      return true;
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return data;
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async ({ email }: ResendVerificationInput) => {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: getEmailVerificationRedirectUri(),
        },
      });

      if (error) throw error;
      return true;
    },
  });

  const verificationStatusMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.get('/auth/verification-status');
      return Boolean(response?.data?.data?.emailVerified);
    },
  });

  const user: User | null = sessionQuery.data?.user ?? null;
  const session = sessionQuery.data ?? null;

  return {
    user,
    session,
    profile: null as AuthProfile,
    loading: sessionQuery.isLoading,
    sessionQuery,
    loginMutation,
    registerMutation,
    logoutMutation,
    requestPasswordResetMutation,
    updatePasswordMutation,
    resendVerificationMutation,
    verificationStatusMutation,
    signIn: (email: string, password: string) => loginMutation.mutateAsync({ email, password }),
    signUp: (email: string, password: string, username: string) =>
      registerMutation.mutateAsync({ email, password, username }),
    signOut: () => logoutMutation.mutateAsync(),
  };
}
