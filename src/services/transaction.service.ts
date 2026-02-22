import { apiClient } from '@/config/api';
import { walletService } from './wallet.service';

export interface Transaction {
  id: string;
  userId: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  paymentMethod?: string;
  description?: string;
  reference: string;
  rewardAmount?: string;
  fee?: string;
  netAmount?: string;
  createdAt: string;
  updatedAt: string;
}

class TransactionService {
  // Transactions are accessed through wallet history
  // GET /wallet/history
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const history = await walletService.getHistory(params);
    return {
      data: history.data || [],
      total: history.total || 0,
      page: history.page || 1,
      limit: history.limit || 10,
    };
  }

  // GET /payments/:reference
  async getTransaction(transactionId: string) {
    // Try to get from payment reference
    try {
      const { unwrapResponse } = await import('@/config/api');
      const response = await apiClient.get<any>(`/payments/${transactionId}`);
      return unwrapResponse(response.data);
    } catch (error) {
      // If not found as payment, return null
      return null;
    }
  }

  // POST /payments/make-payment
  async createTransaction(data: {
    amount: number;
    paymentMethod: string;
    description?: string;
    walletId?: string;
    recipientId?: string;
  }) {
    const { paymentService } = await import('./payment.service');
    return paymentService.makePayment(data);
  }

  // GET /wallet/stats
  async getTransactionStats() {
    return walletService.getStats();
  }
}

export const transactionService = new TransactionService();
