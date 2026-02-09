import { apiClient, unwrapResponse } from '@/config/api';

export interface Dispute {
  id: string;
  transactionId: string;
  userId: string;
  reason: string;
  description?: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED' | 'ESCALATED';
  resolution?: string;
  resolutionNotes?: string;
  rejectedReason?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  transaction?: {
    id: string;
    reference: string;
    amount: string;
    type: string;
    status: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateDisputeDto {
  transactionId: string;
  reason: string;
  description?: string;
  attachments?: any;
}

export interface UpdateDisputeStatusDto {
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED' | 'ESCALATED';
}

export interface ResolveDisputeDto {
  resolution: string;
  resolutionNotes?: string;
}

class DisputeService {
  // POST /disputes
  async createDispute(data: CreateDisputeDto) {
    const response = await apiClient.post<any>('/disputes', data);
    return unwrapResponse<Dispute>(response.data);
  }

  // GET /disputes (Admin only)
  async getDisputes(params?: {
    status?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get<any>('/disputes', { params });
    return unwrapResponse<{ data: Dispute[]; total: number; page: number; limit: number }>(response.data);
  }

  // GET /disputes/my-disputes
  async getMyDisputes(params?: { page?: number; limit?: number }) {
    const response = await apiClient.get<any>('/disputes/my-disputes', { params });
    return unwrapResponse<{ data: Dispute[]; total: number; page: number; limit: number }>(response.data);
  }

  // GET /disputes/stats (Admin only)
  async getStats() {
    const response = await apiClient.get<any>('/disputes/stats');
    return unwrapResponse(response.data);
  }

  // GET /disputes/:id
  async getDispute(disputeId: string) {
    const response = await apiClient.get<any>(`/disputes/${disputeId}`);
    return unwrapResponse<Dispute>(response.data);
  }

  // PATCH /disputes/:id/status (Admin only)
  async updateStatus(disputeId: string, data: UpdateDisputeStatusDto) {
    const response = await apiClient.patch<any>(`/disputes/${disputeId}/status`, data);
    return unwrapResponse(response.data);
  }

  // PATCH /disputes/:id/resolve (Admin only)
  async resolveDispute(disputeId: string, data: ResolveDisputeDto) {
    const response = await apiClient.patch<any>(`/disputes/${disputeId}/resolve`, data);
    return unwrapResponse(response.data);
  }

  // PATCH /disputes/:id/reject (Admin only)
  async rejectDispute(disputeId: string, reason: string) {
    const response = await apiClient.patch<any>(`/disputes/${disputeId}/reject`, { reason });
    return unwrapResponse(response.data);
  }

  // Legacy method for compatibility
  async updateDispute(disputeId: string, data: { status?: string; resolution?: string; resolutionNotes?: string }) {
    if (data.status) {
      return this.updateStatus(disputeId, { status: data.status as any });
    }
    if (data.resolution) {
      return this.resolveDispute(disputeId, {
        resolution: data.resolution,
        resolutionNotes: data.resolutionNotes,
      });
    }
    throw new Error('Invalid update data');
  }
}

export const disputeService = new DisputeService();
