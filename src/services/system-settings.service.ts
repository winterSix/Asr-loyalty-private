import { apiClient, unwrapResponse } from '@/config/api';

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupedSettings {
  [category: string]: SystemSetting[];
}

export interface FeatureStatus {
  key: string;
  enabled: boolean;
  description?: string;
}

class SystemSettingsService {
  // GET /system-settings
  async getAllSettings(category?: string): Promise<SystemSetting[]> {
    const response = await apiClient.get<any>('/system-settings', {
      params: category ? { category } : undefined,
    });
    return unwrapResponse<SystemSetting[]>(response.data);
  }

  // GET /system-settings/grouped
  async getGroupedSettings(): Promise<GroupedSettings> {
    const response = await apiClient.get<any>('/system-settings/grouped');
    return unwrapResponse<GroupedSettings>(response.data);
  }

  // GET /system-settings/features
  async getFeatures(): Promise<FeatureStatus[]> {
    const response = await apiClient.get<any>('/system-settings/features');
    return unwrapResponse<FeatureStatus[]>(response.data);
  }

  // POST /system-settings/toggle
  async toggleFeature(key: string, enabled: boolean): Promise<SystemSetting> {
    const response = await apiClient.post<any>('/system-settings/toggle', { key, enabled });
    return unwrapResponse<SystemSetting>(response.data);
  }

  // PUT /system-settings/:key
  async updateSetting(key: string, value: string): Promise<SystemSetting> {
    const response = await apiClient.put<any>(`/system-settings/${key}`, { value });
    return unwrapResponse<SystemSetting>(response.data);
  }

  // GET /system-settings/status (public)
  async getSystemStatus(): Promise<any> {
    const response = await apiClient.get<any>('/system-settings/status');
    return unwrapResponse(response.data);
  }
}

export const systemSettingsService = new SystemSettingsService();
