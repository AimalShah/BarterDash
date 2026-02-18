import apiClient from '@/lib/api-client';
import type { AdminAnalyticsOverview, ApiEnvelope } from '@/types/admin';

export async function getAdminAnalyticsOverview(input?: {
  lookbackDays?: number;
  startDate?: string;
  endDate?: string;
}): Promise<AdminAnalyticsOverview> {
  const params: Record<string, string | number | undefined> = {};
  
  if (input?.startDate && input?.endDate) {
    params.start_date = input.startDate;
    params.end_date = input.endDate;
  } else if (input?.lookbackDays) {
    params.lookback_days = input.lookbackDays;
  }
  
  const response = await apiClient.get<ApiEnvelope<AdminAnalyticsOverview>>(
    '/admin/analytics/overview',
    {
      params,
      timeout: 60_000,
    },
  );

  return response.data.data;
}
