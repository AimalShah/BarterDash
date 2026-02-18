import apiClient from '@/lib/api-client';
import type {
  AdminUserRecord,
  ApiEnvelope,
  PaginatedData,
} from '@/types/admin';

export async function listAdminUsers(input: {
  page: number;
  limit: number;
  query?: string;
  role?: 'USER' | 'SELLER' | 'ADMIN';
  accountStatus?: 'active' | 'suspended' | 'banned' | 'under_review';
}): Promise<PaginatedData<AdminUserRecord>> {
  const response = await apiClient.get<ApiEnvelope<PaginatedData<AdminUserRecord>>>(
    '/admin/users',
    {
      params: {
        page: input.page,
        limit: input.limit,
        query: input.query || undefined,
        role: input.role || undefined,
        account_status: input.accountStatus || undefined,
      },
    },
  );

  return response.data.data;
}

export async function updateAdminUser(input: {
  userId: string;
  accountStatus?: 'active' | 'suspended' | 'banned' | 'under_review';
  isAdmin?: boolean;
  isSeller?: boolean;
}): Promise<AdminUserRecord> {
  const response = await apiClient.patch<ApiEnvelope<AdminUserRecord>>(
    `/admin/users/${input.userId}`,
    {
      account_status: input.accountStatus,
      is_admin: input.isAdmin,
      is_seller: input.isSeller,
    },
  );

  return response.data.data;
}

export async function bulkUpdateAdminUsers(input: {
  userIds: string[];
  accountStatus?: 'active' | 'suspended' | 'banned' | 'under_review';
  isAdmin?: boolean;
  isSeller?: boolean;
}): Promise<{ updatedCount: number; failedCount: number }> {
  const response = await apiClient.post<ApiEnvelope<{ updatedCount: number; failedCount: number }>>(
    '/admin/users/bulk-update',
    {
      user_ids: input.userIds,
      account_status: input.accountStatus,
      is_admin: input.isAdmin,
      is_seller: input.isSeller,
    },
  );

  return response.data.data;
}
