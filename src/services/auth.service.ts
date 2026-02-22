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
    console.log('[AuthService] Calling login API...');
    const response = await apiClient.post<any>('/auth/login', data);
    console.log('[AuthService] Login API response:', {
      status: response.status,
      dataKeys: Object.keys(response.data || {}),
      fullData: response.data
    });
    
    const responseData = unwrapResponse<AuthResponse>(response.data);
    
    if (!responseData) {
      throw new Error('No data in response');
    }
    
    // Check if tokens are in the response
    if (!responseData.accessToken || !responseData.refreshToken) {
      console.error('[AuthService] Missing tokens in response:', responseData);
      throw new Error('Invalid response: missing tokens');
    }
    
    console.log('[AuthService] Tokens found:', {
      hasAccessToken: !!responseData.accessToken,
      hasRefreshToken: !!responseData.refreshToken,
      hasUser: !!responseData.user
    });
    
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

  // Helper methods
  setTokens(accessToken: string, refreshToken: string) {
    if (typeof window !== 'undefined') {
      console.log('[AuthService] setTokens() called:', {
        accessTokenLength: accessToken?.length || 0,
        refreshTokenLength: refreshToken?.length || 0
      });
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      console.log('[AuthService] Tokens stored in localStorage');
      
      // Set cookies with proper options for middleware access
      Cookies.set('accessToken', accessToken, { 
        expires: 7,
        path: '/',
        sameSite: 'lax'
      });
      Cookies.set('refreshToken', refreshToken, { 
        expires: 30,
        path: '/',
        sameSite: 'lax'
      });
      console.log('[AuthService] Cookies set:', {
        accessTokenCookie: Cookies.get('accessToken')?.substring(0, 20) + '...' || 'NOT SET',
        refreshTokenCookie: !!Cookies.get('refreshToken')
      });
    }
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken') || Cookies.get('accessToken') || null;
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken') || Cookies.get('refreshToken') || null;
  }

  clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
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
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      // Clear invalid data
      localStorage.removeItem('user');
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();
