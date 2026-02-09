import { apiClient, unwrapResponse } from '@/config/api';

export interface AuditLog {
  id: string;
  userId?: string;
  performedBy?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

class AuditService {
  // GET /audit (Admin only)
  async getAuditLogs(params?: {
    userId?: string;
    performedBy?: string;
    action?: string;
    resource?: string;
    resourceId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<AuditLogsResponse> {
    const response = await apiClient.get<AuditLogsResponse>(
      '/audit',
      { params }
    );
    const data = unwrapResponse<AuditLogsResponse | AuditLog[]>(response.data);
    // Handle both wrapped and unwrapped responses
    if (Array.isArray(data)) {
      return {
        data,
        total: data.length,
        page: params?.page || 1,
        limit: params?.limit || 50,
      };
    }
    return data;
  }

  // GET /audit/stats (Admin only)
  async getStats(params?: { startDate?: string; endDate?: string }) {
    const response = await apiClient.get('/audit/stats', { params });
    return unwrapResponse(response.data);
  }

  // GET /audit/user/:userId (Admin only)
  async getAuditLogsByUser(userId: string, params?: { page?: number; limit?: number }): Promise<AuditLogsResponse> {
    const response = await apiClient.get<AuditLogsResponse>(
      `/audit/user/${userId}`,
      { params }
    );
    const data = unwrapResponse<AuditLogsResponse | AuditLog[]>(response.data);
    if (Array.isArray(data)) {
      return {
        data,
        total: data.length,
        page: params?.page || 1,
        limit: params?.limit || 50,
      };
    }
    return data;
  }

  // GET /audit/resource (Admin only)
  async getAuditLogsByResource(resource: string, params?: { resourceId?: string; page?: number; limit?: number }): Promise<AuditLogsResponse> {
    const response = await apiClient.get<AuditLogsResponse>(
      '/audit/resource',
      { params: { resource, ...params } }
    );
    const data = unwrapResponse<AuditLogsResponse | AuditLog[]>(response.data);
    if (Array.isArray(data)) {
      return {
        data,
        total: data.length,
        page: params?.page || 1,
        limit: params?.limit || 50,
      };
    }
    return data;
  }

  // Legacy method for compatibility
  async getAuditLog(auditId: string): Promise<AuditLog | null> {
    // This endpoint doesn't exist directly, would need to get all and filter
    // For now, return null
    return null;
  }
}

export const auditService = new AuditService();
