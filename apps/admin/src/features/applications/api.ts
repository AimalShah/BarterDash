import apiClient from '@/lib/api-client';
import type {
  AdminApplicationRow,
  ApiEnvelope,
  PaginatedData,
  SellerIdentityStatus,
} from '@/types/admin';

export interface ApplicationMutationInput {
  applicationId: string;
  adminNotes?: string;
}

export interface ApplicationRejectInput extends ApplicationMutationInput {
  rejectionReason: string;
}

export interface ListAdminApplicationsInput {
  page: number;
  limit: number;
  statuses?: string[];
}

export async function listAdminApplications(
  input: ListAdminApplicationsInput,
): Promise<PaginatedData<AdminApplicationRow>> {
  const response = await apiClient.get<ApiEnvelope<PaginatedData<AdminApplicationRow>>>(
    '/sellers/applications',
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

export async function fetchIdentityStatus(
  applicationId: string,
): Promise<SellerIdentityStatus> {
  const response = await apiClient.get<ApiEnvelope<SellerIdentityStatus>>(
    `/sellers/applications/${applicationId}/identity`,
  );
  return response.data.data;
}

export async function approveApplication(
  input: ApplicationMutationInput,
): Promise<string> {
  const response = await apiClient.post<ApiEnvelope<unknown>>(
    `/sellers/applications/${input.applicationId}/approve`,
    {
      adminNotes: input.adminNotes,
    },
  );
  return response.data.message || 'Application approved';
}

export async function rejectApplication(
  input: ApplicationRejectInput,
): Promise<string> {
  const response = await apiClient.post<ApiEnvelope<unknown>>(
    `/sellers/applications/${input.applicationId}/reject`,
    {
      rejectionReason: input.rejectionReason,
      adminNotes: input.adminNotes,
    },
  );
  return response.data.message || 'Application rejected';
}

export async function mockApproveApplication(
  applicationId: string,
): Promise<string> {
  const response = await apiClient.post<ApiEnvelope<unknown>>(
    `/sellers/applications/${applicationId}/mock-approve`,
  );
  return response.data.message || 'Application mock approved';
}
