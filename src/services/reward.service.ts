import { apiClient, unwrapResponse } from '@/config/api';

export interface RewardTransaction {
  id: string;
  transactionId: string;
  userId: string;
  amount: string;
  tierMultiplier: string;
  baseAmount: string;
  expiresAt?: string;
  isRedeemed: boolean;
  redeemedAt?: string;
  redeemedInTransaction?: string;
  createdAt: string;
}

export interface RewardConfiguration {
  id: string;
  version: number;
  rewardPercentage: string;
  tierExpiryDays?: any;
  tierMultipliers: any;
  isActive: boolean;
  effectiveFrom: string;
  effectiveUntil?: string;
  createdAt: string;
}

export interface UserRewardDetails {
  userId: string;
  currentTier: string;
  totalRewards: string;
  availableRewards: string;
  redeemedRewards: string;
  tierMultiplier: string;
  benefits: any;
}

export interface CalculateRewardDto {
  loyaltyTier: string;
  purchaseAmount: number;
}

class RewardService {
  // POST /reward/calculate
  async calculateReward(data: CalculateRewardDto) {
    const response = await apiClient.post<any>('/reward/calculate', data);
    return unwrapResponse(response.data);
  }

  // POST /reward/calculate-with-expiry
  async calculateRewardWithExpiry(data: CalculateRewardDto) {
    const response = await apiClient.post<any>('/reward/calculate-with-expiry', data);
    return unwrapResponse(response.data);
  }

  // POST /reward/apply/:transactionId
  async applyReward(transactionId: string) {
    const response = await apiClient.post<any>(`/reward/apply/${transactionId}`);
    return unwrapResponse(response.data);
  }

  // GET /reward/user/:userId/details
  async getUserRewardDetails(userId: string) {
    const response = await apiClient.get<any>(`/reward/user/${userId}/details`);
    return unwrapResponse<UserRewardDetails>(response.data);
  }

  // Note: Reward configuration methods moved to reward-configuration.service.ts
  // These are kept for backward compatibility
  async getActiveRewardConfiguration() {
    const { rewardConfigurationService } = await import('./reward-configuration.service');
    return rewardConfigurationService.getActiveRewardConfiguration();
  }

  async getRewardConfigurations(params?: { page?: number; limit?: number; includeInactive?: boolean }) {
    const { rewardConfigurationService } = await import('./reward-configuration.service');
    return rewardConfigurationService.getAllRewardConfigurations(params);
  }

  // Legacy methods for compatibility
  async getRewards(params?: { page?: number; limit?: number; isRedeemed?: boolean }) {
    // This endpoint doesn't exist directly, use user reward details instead
    // For now, return empty array - will be populated from user reward details
    return { data: [] as RewardTransaction[], total: 0 };
  }

  async getReward(rewardId: string) {
    // This endpoint doesn't exist in the backend
    throw new Error('Get reward by ID endpoint not available');
  }

  async redeemReward(rewardId: string, amount: number) {
    // This endpoint doesn't exist in the backend
    throw new Error('Redeem reward endpoint not available');
  }

  async getRewardStats() {
    // This endpoint doesn't exist in the backend
    return {};
  }
}

export const rewardService = new RewardService();
