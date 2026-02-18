import { db } from '../db';
import Redis from 'ioredis';
import { config } from '../config';

interface HealthMetrics {
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
    activeConnections?: number;
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

interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: 'up' | 'down' | 'slow';
    redis: 'up' | 'down' | 'slow';
    api: 'up' | 'down' | 'overloaded';
  };
  lastChecked: string;
  issues: string[];
}

export class HealthService {
  private redis: Redis | null = null;
  private requestMetrics: { timestamp: number; duration: number; error: boolean }[] = [];
  private readonly METRICS_WINDOW = 5 * 60 * 1000; // 5 minutes

  constructor() {
    if (config.redisUrl) {
      this.redis = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
      });
    }
  }

  async getHealthMetrics(): Promise<HealthMetrics> {
    
    // Database health check
    const dbStart = Date.now();
    let dbConnected = false;
    try {
      await db.execute('SELECT 1');
      dbConnected = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }
    const dbResponseTime = Date.now() - dbStart;

    // Redis health check
    const redisStart = Date.now();
    let redisConnected = false;
    let queueDepth = 0;
    try {
      if (this.redis) {
        await this.redis.ping();
        redisConnected = true;
        // Get queue depth from BullMQ if available
        const queueKeys = await this.redis.keys('bull:*:wait');
        for (const key of queueKeys) {
          const length = await this.redis.llen(key);
          queueDepth += length;
        }
      }
    } catch (error) {
      console.error('Redis health check failed:', error);
    }
    const redisResponseTime = Date.now() - redisStart;

    // Clean old metrics
    const cutoff = Date.now() - this.METRICS_WINDOW;
    this.requestMetrics = this.requestMetrics.filter(m => m.timestamp > cutoff);

    // Calculate API metrics
    const recentRequests = this.requestMetrics.filter(
      m => m.timestamp > Date.now() - 60000
    );
    const errorCount = recentRequests.filter(m => m.error).length;
    const avgResponseTime = recentRequests.length > 0
      ? recentRequests.reduce((sum, m) => sum + m.duration, 0) / recentRequests.length
      : 0;

    // External services status (cached)
    const externalServices = await this.checkExternalServices();

    const memory = process.memoryUsage();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(memory.heapUsed / 1024 / 1024),
        total: Math.round(memory.heapTotal / 1024 / 1024),
        percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100),
      },
      cpu: {
        usage: 0, // Would need os-utils for this
        loadAvg: require('os').loadavg(),
      },
      database: {
        connected: dbConnected,
        responseTime: dbResponseTime,
      },
      redis: {
        connected: redisConnected,
        responseTime: redisResponseTime,
        queueDepth,
      },
      api: {
        requestsPerMinute: recentRequests.length,
        averageResponseTime: Math.round(avgResponseTime),
        errorRate: recentRequests.length > 0 
          ? Math.round((errorCount / recentRequests.length) * 100) 
          : 0,
      },
      externalServices,
    };
  }

  async getServiceStatus(): Promise<ServiceStatus> {
    const metrics = await this.getHealthMetrics();
    const issues: string[] = [];
    
    const status: ServiceStatus = {
      status: 'healthy',
      services: {
        database: metrics.database.connected ? 'up' : 'down',
        redis: metrics.redis.connected ? 'up' : 'down',
        api: 'up',
      },
      lastChecked: metrics.timestamp,
      issues,
    };

    // Check for issues
    if (!metrics.database.connected) {
      status.status = 'unhealthy';
      issues.push('Database connection failed');
    } else if (metrics.database.responseTime > 1000) {
      status.services.database = 'slow';
      status.status = 'degraded';
      issues.push(`Database response time is slow (${metrics.database.responseTime}ms)`);
    }

    if (!metrics.redis.connected) {
      status.status = 'unhealthy';
      issues.push('Redis connection failed');
    } else if (metrics.redis.responseTime > 500) {
      status.services.redis = 'slow';
      if (status.status === 'healthy') status.status = 'degraded';
      issues.push(`Redis response time is slow (${metrics.redis.responseTime}ms)`);
    }

    if (metrics.api.errorRate > 5) {
      status.services.api = 'overloaded';
      if (status.status === 'healthy') status.status = 'degraded';
      issues.push(`High error rate: ${metrics.api.errorRate}%`);
    }

    if (metrics.memory.percentage > 90) {
      if (status.status === 'healthy') status.status = 'degraded';
      issues.push(`High memory usage: ${metrics.memory.percentage}%`);
    }

    return status;
  }

  recordRequest(duration: number, error: boolean = false) {
    this.requestMetrics.push({
      timestamp: Date.now(),
      duration,
      error,
    });

    // Cleanup old metrics periodically
    if (this.requestMetrics.length > 10000) {
      const cutoff = Date.now() - this.METRICS_WINDOW;
      this.requestMetrics = this.requestMetrics.filter(m => m.timestamp > cutoff);
    }
  }

  private async checkExternalServices(): Promise<HealthMetrics['externalServices']> {
    // Simple health checks for external services
    const results = {
      stripe: false,
      supabase: false,
      resend: false,
    };

    // Check if config values are present (basic check)
    if (config.stripeSecretKey && config.stripeSecretKey.startsWith('sk_')) {
      results.stripe = true;
    }
    
    if (config.supabaseUrl && config.supabaseServiceRoleKey) {
      results.supabase = true;
    }

    if (config.resendApiKey) {
      results.resend = true;
    }

    return results;
  }

  close() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }
}

export const healthService = new HealthService();
