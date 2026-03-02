import { apiClient, unwrapResponse } from '@/config/api';

// Mirrors the API's SystemSettingKey enum (NEW_USER_WELCOME_BONUS excluded)
export enum SystemSettingKey {
  // Feature toggles
  PAYMENTS_ENABLED = 'payments_enabled',
  REWARDS_ENABLED = 'rewards_enabled',
  QR_CODES_ENABLED = 'qr_codes_enabled',
  USER_REGISTRATION_ENABLED = 'user_registration_enabled',
  REFERRAL_PROGRAM_ENABLED = 'referral_program_enabled',
  // Payment gateways
  PAYSTACK_ENABLED = 'paystack_enabled',
  OPAY_ENABLED = 'opay_enabled',
  // Security
  TWO_FACTOR_REQUIRED = 'two_factor_required',
  EMAIL_VERIFICATION_REQUIRED = 'email_verification_required',
  PHONE_VERIFICATION_REQUIRED = 'phone_verification_required',
  // General
  MAINTENANCE_MODE = 'maintenance_mode',
}

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
  lastUpdated?: string;
}

export interface SystemStatus {
  maintenanceMode: boolean;
  features: FeatureStatus[];
  timestamp: string;
}

export interface PaymentGatewayStatus {
  gateway: string;
  enabled: boolean;
  description?: string;
}

export interface BulkToggleItem {
  key: string;
  enabled: boolean;
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

  // POST /system-settings/toggle/bulk
  async bulkToggleFeatures(features: BulkToggleItem[]): Promise<SystemSetting[]> {
    const response = await apiClient.post<any>('/system-settings/toggle/bulk', { features });
    return unwrapResponse<SystemSetting[]>(response.data);
  }

  // PUT /system-settings/:key
  async updateSetting(key: string, value: string): Promise<SystemSetting> {
    const response = await apiClient.put<any>(`/system-settings/${key}`, { value });
    return unwrapResponse<SystemSetting>(response.data);
  }

  // GET /system-settings/status (public — no auth required)
  async getSystemStatus(): Promise<SystemStatus> {
    const response = await apiClient.get<any>('/system-settings/status');
    return unwrapResponse<SystemStatus>(response.data);
  }

  // POST /system-settings/initialize (SUPER_ADMIN)
  async initializeDefaults(): Promise<void> {
    await apiClient.post('/system-settings/initialize');
  }

  // POST /system-settings/refresh-cache (ADMIN / SUPER_ADMIN)
  async refreshCache(): Promise<void> {
    await apiClient.post('/system-settings/refresh-cache');
  }

  // GET /system-settings/payment-gateways (ADMIN / SUPER_ADMIN)
  async getPaymentGatewayStatuses(): Promise<PaymentGatewayStatus[]> {
    const response = await apiClient.get<any>('/system-settings/payment-gateways');
    return unwrapResponse<PaymentGatewayStatus[]>(response.data);
  }

  // GET /system-settings/available-payment-gateways (public)
  async getAvailablePaymentGateways(): Promise<PaymentGatewayStatus[]> {
    const response = await apiClient.get<any>('/system-settings/available-payment-gateways');
    return unwrapResponse<PaymentGatewayStatus[]>(response.data);
  }

  // POST /system-settings (SUPER_ADMIN)
  async createSetting(data: {
    key: string;
    value: string;
    type?: 'boolean' | 'string' | 'number' | 'json';
    category?: 'feature' | 'payment' | 'security' | 'general';
    description?: string;
  }): Promise<SystemSetting> {
    const response = await apiClient.post<any>('/system-settings', data);
    return unwrapResponse<SystemSetting>(response.data);
  }

  // DELETE /system-settings/:key (SUPER_ADMIN)
  async deleteSetting(key: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<any>(`/system-settings/${key}`);
    return unwrapResponse<{ success: boolean; message: string }>(response.data);
  }
}

export const systemSettingsService = new SystemSettingsService();
