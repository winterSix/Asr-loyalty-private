import { apiClient, unwrapResponse } from '@/config/api';

export interface InitializePaymentDto {
  amount: number;
  currency?: string;
  paymentMethod?: string;
}

export interface MakePaymentDto {
  amount: number;
  paymentMethod: string;
  description?: string;
  walletId?: string;
  recipientId?: string;
}

export interface VerifyPaymentDto {
  reference: string;
}

class PaymentService {
  // POST /payments/initialize
  async initializePayment(data: InitializePaymentDto) {
    const response = await apiClient.post<any>('/payments/initialize', data);
    return unwrapResponse(response.data);
  }

  // POST /payments/verify
  async verifyPayment(reference: string) {
    const response = await apiClient.post<any>('/payments/verify', { reference });
    return unwrapResponse(response.data);
  }

  // POST /payments/make-payment
  async makePayment(data: MakePaymentDto) {
    const response = await apiClient.post<any>('/payments/make-payment', data);
    return unwrapResponse(response.data);
  }

  // GET /payments/:reference
  async getPayment(reference: string) {
    const response = await apiClient.get<any>(`/payments/${reference}`);
    return unwrapResponse(response.data);
  }

  // GET /payments/history/export — returns PDF as a Blob
  async exportTransactionHistory(params?: { period?: string; status?: string }): Promise<Blob> {
    const response = await apiClient.get('/payments/history/export', {
      params,
      responseType: 'blob',
    });
    return response.data as Blob;
  }

  // POST /payments/reverse/:transactionId (Admin only)
  async reversePayment(transactionId: string, reason: string) {
    const response = await apiClient.post<any>(`/payments/reverse/${transactionId}`, { reason });
    return unwrapResponse(response.data);
  }
}

export const paymentService = new PaymentService();

