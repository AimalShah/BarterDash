import apiClient from '@/lib/api-client';
import type { ApiEnvelope } from '@/types/admin';

export interface HealthMetrics {
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    loadAvg: number[];
  };
  database: {
    connected: boolean;
    responseTime: number;
  };
  redis: {
    connected: boolean;
    responseTime: number;
    queueDepth: number;
  };
  api: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
  };
  externalServices: {
    stripe: boolean;
    supabase: boolean;
    resend: boolean;
  };
}

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: 'up' | 'down' | 'slow';
    redis: 'up' | 'down' | 'slow';
    api: 'up' | 'down' | 'overloaded';
  };
  lastChecked: string;
  issues: string[];
}

export async function getHealthMetrics(): Promise<HealthMetrics> {
  const response = await apiClient.get<ApiEnvelope<HealthMetrics>>('/health/metrics');
  return response.data.data;
}

export async function getServiceStatus(): Promise<ServiceStatus> {
  const response = await apiClient.get<ApiEnvelope<ServiceStatus>>('/health/status');
  return response.data.data;
}
