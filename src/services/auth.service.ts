import { apiClient, unwrapResponse } from '@/config/api';
import Cookies from 'js-cookie';

export interface RegisterData {
  firstName: string;
  lastName: string;
  phoneNumber?: string; // Optional in backend
  email: string; // Required in backend
  password: string;
  referralCode?: string;
}

export interface LoginData {
  email: string; // Backend uses email, not phoneNumber
  password: string;
}

export interface VerifyOtpData {
  email: string; // Backend uses email for OTP verification
  code: string;
}

export interface ResendOtpData {
  email: string; // Backend uses email for resend OTP
}

export interface AuthResponse {
  message: string;
  mustChangePassword?: boolean;
  accessToken: string;
  refreshToken: string;
  user: User;
  requiresTwoFactor?: boolean;
  email?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  phoneVerified: boolean;
  emailVerified?: boolean;
  role: string;
  status: string;
  mustChangePassword?: boolean;
  twoFactorEnabled?: boolean;
  currentTier?: string;
  totalSpent?: string;
  totalTransactions?: number;
  referralCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  async register(data: RegisterData) {
    const response = await apiClient.post<any>('/auth/register', data);
    return unwrapResponse<AuthResponse>(response.data);
  }

  async verifyOtp(data: VerifyOtpData) {
    const response = await apiClient.post<any>('/auth/verify-otp', data);
    return unwrapResponse<AuthResponse>(response.data);
  }

  async resendOtp(email: string) {
    const response = await apiClient.post<any>('/auth/resend-otp', { email });
    return unwrapResponse(response.data);
  }

  async login(data: LoginData) {
    const response = await apiClient.post<any>('/auth/login', data);
    const responseData = unwrapResponse<AuthResponse>(response.data);

    if (!responseData) {
      throw new Error('No data in response');
    }

    // 2FA required — return partial response without tokens so the page can show the 2FA step
    if ((responseData as any).requiresTwoFactor) {
      return responseData;
    }

    if (!responseData.accessToken || !responseData.refreshToken) {
      throw new Error('Invalid response: missing tokens');
    }

    return responseData;
  }

  async refreshToken(refreshToken: string) {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }

  async logout() {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }

  async logoutAll() {
    const response = await apiClient.post('/auth/logout-all');
    return response.data;
  }

  async getCurrentUser() {
    const response = await apiClient.get<any>('/auth/me');
    return unwrapResponse<User>(response.data);
  }

  async forgotPassword(email: string) {
    const response = await apiClient.post<any>('/auth/forgot-password', { email });
    return unwrapResponse(response.data);
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const response = await apiClient.post<any>('/auth/reset-password', {
      email,
      code,
      newPassword,
    });
    return unwrapResponse(response.data);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await apiClient.post<any>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return unwrapResponse(response.data);
  }

  async googleLogin(idToken: string) {
    const response = await apiClient.post<any>('/auth/google', { idToken });
    return unwrapResponse<AuthResponse>(response.data);
  }

  async verify2FA(email: string, code: string) {
    const response = await apiClient.post<any>('/auth/verify-2fa', { email, code });
    return unwrapResponse<AuthResponse>(response.data);
  }

  // Helper methods
  setTokens(accessToken: string, refreshToken: string) {
    if (typeof window !== 'undefined') {
      // Store tokens ONLY in cookies — never localStorage (XSS risk)
      Cookies.set('accessToken', accessToken, {
        expires: 7,
        path: '/',
        sameSite: 'strict',
        secure: window.location.protocol === 'https:',
      });
      Cookies.set('refreshToken', refreshToken, {
        expires: 30,
        path: '/',
        sameSite: 'strict',
        secure: window.location.protocol === 'https:',
      });
    }
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return Cookies.get('accessToken') || null;
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return Cookies.get('refreshToken') || null;
  }

  clearTokens() {
    if (typeof window !== 'undefined') {
      Cookies.remove('accessToken', { path: '/' });
      Cookies.remove('refreshToken', { path: '/' });
      localStorage.removeItem('user');
    }
  }

  setUser(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();
