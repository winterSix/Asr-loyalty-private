import { apiClient, unwrapResponse } from '@/config/api';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  role: string;
  status: string;
  currentTier: string;
  totalSpent: string;
  totalTransactions: number;
  referralCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreference {
  pushNotifications: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  transactionAlerts: boolean;
  marketingEmails: boolean;
  language: string;
  currency: string;
}

export interface UserDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  osVersion?: string;
  appVersion?: string;
  isActive: boolean;
  lastSeenAt: string;
  createdAt: string;
}

class UserService {
  // GET /users/profile
  async getProfile() {
    const response = await apiClient.get<any>('/users/profile');
    return unwrapResponse<UserProfile>(response.data);
  }

  // PUT /users/profile
  async updateProfile(data: Partial<UserProfile>) {
    const response = await apiClient.put<any>('/users/profile', data);
    return unwrapResponse<UserProfile>(response.data);
  }

  // POST /users/change-password
  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const response = await apiClient.post<any>('/users/change-password', data);
    return unwrapResponse(response.data);
  }

  // POST /users/set-payment-pin (Legacy - use payment-pin service instead)
  async setPaymentPin(pin: string) {
    const { paymentPinService } = await import('./payment-pin.service');
    return paymentPinService.setPaymentPin(pin);
  }

  // GET /users/preferences
  async getPreferences() {
    const response = await apiClient.get<any>('/users/preferences');
    return unwrapResponse<UserPreference>(response.data);
  }

  // PUT /users/preferences
  async updatePreferences(data: Partial<UserPreference>) {
    const response = await apiClient.put<any>('/users/preferences', data);
    return unwrapResponse<UserPreference>(response.data);
  }

  // GET /users/devices
  async getDevices() {
    const response = await apiClient.get<any>('/users/devices');
    return unwrapResponse<UserDevice[]>(response.data);
  }

  // POST /users/devices
  async registerDevice(data: { deviceId: string; deviceName: string; deviceType: string; osVersion?: string; appVersion?: string }) {
    const response = await apiClient.post<any>('/users/devices', data);
    return unwrapResponse(response.data);
  }

  // DELETE /users/devices/:deviceId
  async removeDevice(deviceId: string) {
    const response = await apiClient.delete<any>(`/users/devices/${deviceId}`);
    return unwrapResponse(response.data);
  }

  // POST /users/send-phone-otp
  async sendPhoneOtp() {
    const response = await apiClient.post<any>('/users/send-phone-otp');
    return unwrapResponse(response.data);
  }

  // POST /users/verify-phone
  async verifyPhone(code: string) {
    const response = await apiClient.post<any>('/users/verify-phone', { code });
    return unwrapResponse(response.data);
  }

  // PATCH /users/me/two-factor
  async toggle2FA(enabled: boolean): Promise<{ message: string; twoFactorEnabled: boolean }> {
    const response = await apiClient.patch<any>('/users/me/two-factor', { enabled });
    return unwrapResponse<{ message: string; twoFactorEnabled: boolean }>(response.data);
  }

  // Admin methods - These endpoints don't exist in the current controller
  // They would need to be added to the backend
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }) {
    // This endpoint doesn't exist in the current user controller
    // For now, return empty - will need backend endpoint
    return { data: [] as UserProfile[], total: 0 };
  }

  async getUser(userId: string) {
    // This endpoint doesn't exist in the current user controller
    throw new Error('Get user by ID endpoint not available');
  }

  async updateUser(userId: string, data: Partial<UserProfile>) {
    // This endpoint doesn't exist in the current user controller
    throw new Error('Update user endpoint not available');
  }

  async deleteUser(userId: string) {
    // This endpoint doesn't exist in the current user controller
    throw new Error('Delete user endpoint not available');
  }
}

export const userService = new UserService();
