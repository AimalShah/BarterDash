import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/users';
import { USER_QUERY_KEY } from './useUser';

interface AgeVerificationPayload {
  dateOfBirth: string;
  guardianConsent?: boolean;
}

export function useAgeVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AgeVerificationPayload) => {
      const response = await usersService.verifyAge(data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    },
  });
}
