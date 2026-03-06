import { apiClient } from '@/config/api';

export interface LandingStats {
  totalUsers: number;
  totalTransactions: number;
  totalVolumeProcessed: number;
  totalRewardsGiven: number;
  totalWalletFunding: number;
}

class PublicService {
  async getLandingStats(): Promise<LandingStats> {
    const response = await apiClient.get<any>('/public/stats');
    const data = response.data;
    // Handle both wrapped and unwrapped responses
    const stats = data?.stats ?? data?.data?.stats ?? data;
    return {
      totalUsers: stats?.totalUsers ?? 0,
      totalTransactions: stats?.totalTransactions ?? 0,
      totalVolumeProcessed: stats?.totalVolumeProcessed ?? 0,
      totalRewardsGiven: stats?.totalRewardsGiven ?? 0,
      totalWalletFunding: stats?.totalWalletFunding ?? 0,
    };
  }
}

export const publicService = new PublicService();
