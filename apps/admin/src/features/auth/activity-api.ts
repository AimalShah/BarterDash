import apiClient from '@/lib/api-client';
import type {
  ApiEnvelope,
  BackendAdminActivity,
  PaginatedData,
} from '@/types/admin';

export interface ListAdminActivityInput {
  page: number;
  limit: number;
  areas?: Array<'applications' | 'reports' | 'refunds'>;
}

export async function listAdminActivity(
  input: ListAdminActivityInput,
): Promise<PaginatedData<BackendAdminActivity>> {
  const response = await apiClient.get<
    ApiEnvelope<PaginatedData<BackendAdminActivity>>
  >('/admin/activity', {
    params: {
      page: input.page,
      limit: input.limit,
      areas: input.areas?.length ? input.areas.join(',') : undefined,
    },
  });

  return response.data.data;
}
