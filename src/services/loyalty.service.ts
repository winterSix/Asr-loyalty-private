import { apiClient, unwrapResponse } from '@/config/api';

export interface LoyaltyTierConfig {
  id: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  minSpend: string;
  minTransactions: number;
  rewardMultiplier: string;
  benefits: any;
  color?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTierHistory {
  id: string;
  userId: string;
  fromTier?: string;
  toTier: string;
  reason?: string;
  createdAt: string;
}

export interface TierProgress {
  currentTier: string;
  nextTier?: string;
  progress: {
    spendProgress: number;
    transactionProgress: number;
    overallProgress: number;
  };
  requirements: {
    current: {
      minSpend: string;
      minTransactions: number;
    };
    next?: {
      minSpend: string;
      minTransactions: number;
    };
  };
}

class LoyaltyService {
  // GET /loyalty-tiers/my-progress
  async getMyProgress() {
    const response = await apiClient.get<any>('/loyalty-tiers/my-progress');
    return unwrapResponse<TierProgress>(response.data);
  }

  // GET /loyalty-tiers/my-history
  async getMyHistory(params?: { page?: number; limit?: number }) {
    const response = await apiClient.get<any>('/loyalty-tiers/my-history', { params });
    return unwrapResponse<{ data: LoyaltyTierHistory[]; total: number }>(response.data);
  }

  // POST /loyalty-tiers/evaluate
  async evaluateMyTier() {
    const response = await apiClient.post<any>('/loyalty-tiers/evaluate');
    return unwrapResponse(response.data);
  }

  // GET /loyalty-tiers/benefits
  async getBenefitsComparison() {
    const response = await apiClient.get<any>('/loyalty-tiers/benefits');
    return unwrapResponse(response.data);
  }

  // GET /loyalty-tiers/configs (Admin)
  async getAllTierConfigs() {
    const response = await apiClient.get<any>('/loyalty-tiers/configs');
    return unwrapResponse<LoyaltyTierConfig[]>(response.data);
  }

  // GET /loyalty-tiers/configs/:tier (Admin)
  async getTierConfig(tier: string) {
    const response = await apiClient.get<any>(`/loyalty-tiers/configs/${tier}`);
    return unwrapResponse<LoyaltyTierConfig>(response.data);
  }

  // POST /loyalty-tiers/configs (Admin)
  async createTierConfig(data: Partial<LoyaltyTierConfig>) {
    const response = await apiClient.post<any>('/loyalty-tiers/configs', data);
    return unwrapResponse<LoyaltyTierConfig>(response.data);
  }

  // PUT /loyalty-tiers/configs/:tier (Admin)
  async updateTierConfig(tier: string, data: Partial<LoyaltyTierConfig>) {
    const response = await apiClient.put<any>(`/loyalty-tiers/configs/${tier}`, data);
    return unwrapResponse<LoyaltyTierConfig>(response.data);
  }

  // GET /loyalty-tiers/stats (Admin)
  async getTierStats() {
    const response = await apiClient.get<any>('/loyalty-tiers/stats');
    return unwrapResponse(response.data);
  }

  // GET /loyalty-tiers/user/:userId/progress (Admin)
  async getUserTierProgress(userId: string) {
    const response = await apiClient.get<any>(`/loyalty-tiers/user/${userId}/progress`);
    return unwrapResponse<TierProgress>(response.data);
  }

  // POST /loyalty-tiers/user/:userId/evaluate (Admin)
  async evaluateUserTier(userId: string) {
    const response = await apiClient.post<any>(`/loyalty-tiers/user/${userId}/evaluate`);
    return unwrapResponse(response.data);
  }

  // Legacy methods for compatibility
  async getTiers() {
    return this.getAllTierConfigs();
  }

  async getTier(tierId: string) {
    // If tierId is a tier name (BRONZE, SILVER, etc.)
    if (['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].includes(tierId)) {
      return this.getTierConfig(tierId);
    }
    // Otherwise, get all and find by id
    const tiers = await this.getAllTierConfigs();
    return tiers.find((t) => t.id === tierId);
  }

  async updateTier(tierId: string, data: Partial<LoyaltyTierConfig>) {
    // If tierId is a tier name
    if (['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].includes(tierId)) {
      return this.updateTierConfig(tierId, data);
    }
    // Otherwise, find the tier name from id
    const tiers = await this.getAllTierConfigs();
    const tier = tiers.find((t) => t.id === tierId);
    if (!tier) throw new Error('Tier not found');
    return this.updateTierConfig(tier.tier, data);
  }

  async getUserTierHistory(userId: string) {
    // This endpoint doesn't exist directly, use my-history for current user
    // For admin, would need a different endpoint
    const response = await apiClient.get<any>(`/loyalty-tiers/user/${userId}/history`);
    const unwrapped = unwrapResponse<{ data: LoyaltyTierHistory[] }>(response.data);
    return unwrapped.data || [];
  }
}

export const loyaltyService = new LoyaltyService();
