import apiClient from '@/lib/api-client';
import type {
  AdminDisputeRecord,
  ApiEnvelope,
  PaginatedData,
  ResolveDisputeResult,
} from '@/types/admin';

export async function listAdminDisputes(input: {
  page: number;
  limit: number;
  statuses?: string[];
}): Promise<PaginatedData<AdminDisputeRecord>> {
  const response = await apiClient.get<ApiEnvelope<PaginatedData<AdminDisputeRecord>>>(
    '/admin/disputes',
    {
      params: {
        page: input.page,
        limit: input.limit,
        statuses: input.statuses?.length ? input.statuses.join(',') : undefined,
      },
    },
  );

  return response.data.data;
}

export async function resolveAdminDispute(input: {
  escrowId: string;
  resolution: 'release' | 'refund';
  reason: string;
}): Promise<ResolveDisputeResult> {
  const response = await apiClient.post<ApiEnvelope<ResolveDisputeResult>>(
    `/admin/disputes/${input.escrowId}/resolve`,
    {
      resolution: input.resolution,
      reason: input.reason,
    },
  );

  return response.data.data;
}
