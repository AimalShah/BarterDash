import apiClient from '@/lib/api-client';
import type {
  ApiEnvelope,
  PaginatedData,
  RefundRecord,
} from '@/types/admin';

export interface ProcessRefundInput {
  refundId: string;
  status: 'approved' | 'rejected';
  notes?: string;
}

export interface ListAdminRefundsInput {
  page: number;
  limit: number;
  statuses?: string[];
}

export async function listAdminRefunds(
  input: ListAdminRefundsInput,
): Promise<PaginatedData<RefundRecord>> {
  const response = await apiClient.get<ApiEnvelope<PaginatedData<RefundRecord>>>(
    '/refunds',
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

export async function fetchRefund(refundId: string): Promise<RefundRecord> {
  const response = await apiClient.get<ApiEnvelope<RefundRecord>>(
    `/refunds/${refundId}`,
  );
  return response.data.data;
}

export async function fetchRefundsByOrder(orderId: string): Promise<RefundRecord[]> {
  const response = await apiClient.get<ApiEnvelope<RefundRecord[]>>(
    `/refunds/order/${orderId}`,
  );
  return response.data.data;
}

export async function processRefund(input: ProcessRefundInput): Promise<string> {
  const response = await apiClient.patch<ApiEnvelope<RefundRecord>>(
    `/refunds/${input.refundId}/process`,
    {
      status: input.status,
      notes: input.notes,
    },
  );

  return response.data.message || `Refund ${input.status}`;
}
