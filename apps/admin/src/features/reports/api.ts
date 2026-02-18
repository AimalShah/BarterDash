import apiClient from '@/lib/api-client';
import type {
  ApiEnvelope,
  PaginatedData,
  ReportRecord,
} from '@/types/admin';

export interface ResolveReportInput {
  reportId: string;
  status: 'resolved' | 'dismissed';
  reviewNotes?: string;
  actionTaken?: string;
}

export interface ListAdminReportsInput {
  page: number;
  limit: number;
  statuses?: string[];
}

export async function listAdminReports(
  input: ListAdminReportsInput,
): Promise<PaginatedData<ReportRecord>> {
  const response = await apiClient.get<ApiEnvelope<PaginatedData<ReportRecord>>>(
    '/reports',
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

export async function fetchReport(reportId: string): Promise<ReportRecord> {
  const response = await apiClient.get<ApiEnvelope<ReportRecord>>(
    `/reports/${reportId}`,
  );
  return response.data.data;
}

export async function resolveReport(input: ResolveReportInput): Promise<string> {
  const response = await apiClient.patch<ApiEnvelope<ReportRecord>>(
    `/reports/${input.reportId}/resolve`,
    {
      status: input.status,
      review_notes: input.reviewNotes,
      action_taken: input.actionTaken,
    },
  );

  return response.data.message || 'Report updated';
}
