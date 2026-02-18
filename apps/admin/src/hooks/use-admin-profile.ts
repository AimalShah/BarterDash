import { useQuery } from '@tanstack/react-query';
import { fetchAdminProfile } from '@/features/auth/api';
import { useAuthStore } from '@/store/auth-store';

export function useAdminProfileQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['admin-profile'],
    queryFn: fetchAdminProfile,
    enabled: Boolean(accessToken),
    staleTime: 30_000,
    retry: 1,
  });
}
