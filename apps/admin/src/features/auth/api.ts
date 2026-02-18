import apiClient from '@/lib/api-client';
import type { AdminProfile, ApiEnvelope } from '@/types/admin';

export async function fetchAdminProfile(): Promise<AdminProfile> {
  const response = await apiClient.get<ApiEnvelope<AdminProfile>>('/auth/me');
  return response.data.data;
}
