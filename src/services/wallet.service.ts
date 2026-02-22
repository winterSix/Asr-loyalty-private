import { apiClient, unwrapResponse } from '@/config/api';

export interface Wallet {
  id: string;
  userId: string;
  type: 'MAIN' | 'REWARD';
  currency: string;
  balance: string;
  availableBalance: string;
  pendingBalance: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletLedger {
  id: string;
  walletId: string;
  type: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string;
  createdAt: string;
}

export interface WalletBalance {
  main: {
    balance: string;
    availableBalance: string;
    pendingBalance: string;
  };
  reward: {
    balance: string;
    availableBalance: string;
    pendingBalance: string;
  };
}

class WalletService {
  // GET /wallet/balance
  async getBalance() {
    const response = await apiClient.get<any>('/wallet/balance');
    return unwrapResponse<WalletBalance>(response.data);
  }

  // GET /wallet/history
  async getHistory(params?: { page?: number; limit?: number; type?: string; status?: string; period?: string; startDate?: string; endDate?: string }) {
    const response = await apiClient.get<any>('/wallet/history', { params });
    return unwrapResponse<{ data: any[]; total: number; page: number; limit: number }>(response.data);
  }

  // GET /wallet/ledger/:walletType
  async getLedger(walletType: 'MAIN' | 'REWARD', params?: { page?: number; limit?: number }) {
    const response = await apiClient.get<any>(`/wallet/ledger/${walletType}`, { params });
    return unwrapResponse<{ data: WalletLedger[]; total: number }>(response.data);
  }

  // GET /wallet/stats
  async getStats() {
    const response = await apiClient.get<any>('/wallet/stats');
    return unwrapResponse(response.data);
  }

  // Helper to get wallets array from balance
  async getWallets(): Promise<Wallet[]> {
    const balance = await this.getBalance();
    if (!balance || !balance.main || !balance.reward) {
      // Return default wallets if balance structure is invalid
      return [
        {
          id: 'main',
          userId: '',
          type: 'MAIN',
          currency: 'NGN',
          balance: '0.00',
          availableBalance: '0.00',
          pendingBalance: '0.00',
          isActive: true,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'reward',
          userId: '',
          type: 'REWARD',
          currency: 'NGN',
          balance: '0.00',
          availableBalance: '0.00',
          pendingBalance: '0.00',
          isActive: true,
          createdAt: '',
          updatedAt: '',
        },
      ];
    }
    return [
      {
        id: 'main',
        userId: '',
        type: 'MAIN',
        currency: 'NGN',
        balance: balance.main.balance || '0.00',
        availableBalance: balance.main.availableBalance || '0.00',
        pendingBalance: balance.main.pendingBalance || '0.00',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'reward',
        userId: '',
        type: 'REWARD',
        currency: 'NGN',
        balance: balance.reward.balance || '0.00',
        availableBalance: balance.reward.availableBalance || '0.00',
        pendingBalance: balance.reward.pendingBalance || '0.00',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ];
  }
}

export const walletService = new WalletService();
