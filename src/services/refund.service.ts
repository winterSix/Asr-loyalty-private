import { apiClient, unwrapResponse } from '@/config/api';

export interface Refund {
  id: string;
  transactionId: string;
  userId: string;
  amount: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'FAILED';
  approvedBy?: string;
  rejectedReason?: string;
  processedAt?: string;
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

export interface RefundsResponse {
  data: Refund[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateRefundDto {
  transactionId: string;
  reason: string;
}

export interface ApproveRefundDto {
  notes?: string;
}

export interface RejectRefundDto {
  reason: string;
}

export interface ProcessRefundDto {
  notes?: string;
}

class RefundService {
  // POST /refunds
  async createRefund(data: CreateRefundDto): Promise<Refund> {
    const response = await apiClient.post<Refund>('/refunds', data);
    return unwrapResponse<Refund>(response.data);
  }

  // GET /refunds (Admin/Support only)
  async getRefunds(params?: {
    status?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<RefundsResponse> {
    const response = await apiClient.get<RefundsResponse>(
      '/refunds',
      { params }
    );
    const data = unwrapResponse<RefundsResponse | Refund[]>(response.data);
    if (Array.isArray(data)) {
      return {
        data,
        total: data.length,
        page: params?.page || 1,
        limit: params?.limit || 20,
      };
    }
    return data;
  }

  // GET /refunds/my-refunds
  async getMyRefunds(params?: { page?: number; limit?: number }): Promise<RefundsResponse> {
    const response = await apiClient.get<RefundsResponse>(
      '/refunds/my-refunds',
      { params }
    );
    const data = unwrapResponse<RefundsResponse | Refund[]>(response.data);
    if (Array.isArray(data)) {
      return {
        data,
        total: data.length,
        page: params?.page || 1,
        limit: params?.limit || 20,
      };
    }
    return data;
  }

  // GET /refunds/stats (Admin only)
  async getStats() {
    const response = await apiClient.get('/refunds/stats');
    return unwrapResponse(response.data);
  }

  // GET /refunds/:id
  async getRefund(refundId: string): Promise<Refund> {
    const response = await apiClient.get<Refund>(`/refunds/${refundId}`);
    return unwrapResponse<Refund>(response.data);
  }

  // PUT /refunds/:id/approve (Admin/Support only)
  async approveRefund(refundId: string, data?: ApproveRefundDto): Promise<Refund> {
    const response = await apiClient.put<Refund>(`/refunds/${refundId}/approve`, data || {});
    return unwrapResponse<Refund>(response.data);
  }

  // PUT /refunds/:id/reject (Admin/Support only)
  async rejectRefund(refundId: string, data: RejectRefundDto): Promise<Refund> {
    const response = await apiClient.put<Refund>(`/refunds/${refundId}/reject`, data);
    return unwrapResponse<Refund>(response.data);
  }

  // PUT /refunds/:id/process (Admin only)
  async processRefund(refundId: string, data?: ProcessRefundDto): Promise<Refund> {
    const response = await apiClient.put<Refund>(`/refunds/${refundId}/process`, data || {});
    return unwrapResponse<Refund>(response.data);
  }

  // DELETE /refunds/:id
  async cancelRefund(refundId: string): Promise<void> {
    await apiClient.delete(`/refunds/${refundId}`);
  }

  // Legacy method for compatibility
  async updateRefund(refundId: string, data: { status?: string; rejectedReason?: string }): Promise<Refund> {
    if (data.status === 'APPROVED') {
      return this.approveRefund(refundId);
    }
    if (data.status === 'REJECTED') {
      return this.rejectRefund(refundId, { reason: data.rejectedReason || 'No reason provided' });
    }
    if (data.status === 'PROCESSED') {
      return this.processRefund(refundId);
    }
    throw new Error('Invalid status update');
  }
}

export const refundService = new RefundService();
