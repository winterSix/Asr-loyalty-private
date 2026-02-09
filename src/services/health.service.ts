import { apiClient, unwrapResponse } from '@/config/api';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    [key: string]: {
      status: 'up' | 'down';
      responseTime?: number;
      details?: Record<string, any>;
    };
  };
}

class HealthService {
  // GET /health
  async getHealth() {
    const response = await apiClient.get<any>('/health');
    return unwrapResponse<HealthCheckResult>(response.data);
  }

  // GET /health/live
  async getLiveness() {
    const response = await apiClient.get<any>('/health/live');
    return unwrapResponse<{ status: 'ok' | 'error'; timestamp: string }>(response.data);
  }

  // GET /health/ready
  async getReadiness() {
    const response = await apiClient.get<any>('/health/ready');
    return unwrapResponse<{ status: 'ok' | 'error'; timestamp: string }>(response.data);
  }

  // GET /health/metrics (Admin only)
  async getMetrics() {
    const response = await apiClient.get('/health/metrics');
    return unwrapResponse(response.data);
  }

  // GET /health/stats (Admin only)
  async getDatabaseStats() {
    const response = await apiClient.get('/health/stats');
    return unwrapResponse(response.data);
  }
}

export const healthService = new HealthService();

