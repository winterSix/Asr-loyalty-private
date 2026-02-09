import { apiClient, unwrapResponse } from '@/config/api';

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
  updatedAt?: string;
}

export interface CreateRewardConfigurationDto {
  rewardPercentage: number;
  tierExpiryDays?: any;
  tierMultipliers?: any;
  effectiveFrom?: string;
  effectiveUntil?: string;
}

export interface UpdateRewardConfigurationDto {
  rewardPercentage?: number;
  tierExpiryDays?: any;
  tierMultipliers?: any;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveUntil?: string;
}

class RewardConfigurationService {
  // POST /reward-configuration
  async createRewardConfiguration(data: CreateRewardConfigurationDto) {
    const response = await apiClient.post<any>('/reward-configuration', data);
    return unwrapResponse<RewardConfiguration>(response.data);
  }

  // GET /reward-configuration/active
  async getActiveRewardConfiguration() {
    const response = await apiClient.get<any>('/reward-configuration/active');
    return unwrapResponse<RewardConfiguration>(response.data);
  }

  // GET /reward-configuration
  async getAllRewardConfigurations(params?: {
    page?: number;
    limit?: number;
    includeInactive?: boolean;
  }) {
    const response = await apiClient.get<any>('/reward-configuration', { params });
    return unwrapResponse<{
      data: RewardConfiguration[];
      total: number;
      page: number;
      limit: number;
    }>(response.data);
  }

  // GET /reward-configuration/:id
  async getRewardConfigurationById(id: string) {
    const response = await apiClient.get<any>(`/reward-configuration/${id}`);
    return unwrapResponse<RewardConfiguration>(response.data);
  }

  // PATCH /reward-configuration/:id
  async updateRewardConfiguration(id: string, data: UpdateRewardConfigurationDto) {
    const response = await apiClient.patch<any>(`/reward-configuration/${id}`, data);
    return unwrapResponse<RewardConfiguration>(response.data);
  }

  // DELETE /reward-configuration/:id
  async deleteRewardConfiguration(id: string) {
    const response = await apiClient.delete<any>(`/reward-configuration/${id}`);
    return unwrapResponse(response.data);
  }

  // Aliases for backwards compatibility
  async getAll(params?: { page?: number; limit?: number; includeInactive?: boolean }) {
    return this.getAllRewardConfigurations(params);
  }

  async getActive() {
    return this.getActiveRewardConfiguration();
  }

  async getById(id: string) {
    return this.getRewardConfigurationById(id);
  }

  async create(data: CreateRewardConfigurationDto) {
    return this.createRewardConfiguration(data);
  }

  async update(id: string, data: UpdateRewardConfigurationDto) {
    return this.updateRewardConfiguration(id, data);
  }

  async delete(id: string) {
    return this.deleteRewardConfiguration(id);
  }
}

export const rewardConfigurationService = new RewardConfigurationService();

