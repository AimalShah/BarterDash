import { makeRedirectUri } from 'expo-auth-session';

export function getEmailVerificationRedirectUri(): string {
  return makeRedirectUri({
    scheme: 'barterdash',
    path: 'auth/confirm',
  });
}
