import { apiClient, unwrapResponse, setMemoryToken, getMemoryToken, clearMemoryToken } from '@/config/api';
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
  accessToken?: string;  // not returned to client — set as httpOnly cookie by proxy
  refreshToken?: string; // not returned to client — set as httpOnly cookie by proxy
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
    // Route through Next.js proxy — sets httpOnly cookies server-side
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const responseData = await res.json();
    if (!res.ok) {
      const err: any = new Error(responseData?.message || 'OTP verification failed');
      err.response = { status: res.status, data: responseData };
      throw err;
    }
    return responseData as AuthResponse;
  }

  async resendOtp(email: string) {
    const response = await apiClient.post<any>('/auth/resend-otp', { email });
    return unwrapResponse(response.data);
  }

  async login(data: LoginData) {
    // Route through Next.js proxy — sets httpOnly cookies server-side
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok) {
      const err: any = new Error(responseData?.message || 'Login failed');
      err.response = { status: res.status, data: responseData };
      throw err;
    }

    // 2FA pending — no tokens issued yet
    if (responseData?.requiresTwoFactor) {
      return responseData as AuthResponse;
    }

    return responseData as AuthResponse;
  }

  async refreshToken(_refreshToken?: string) {
    // Refresh is handled via httpOnly cookie by the Next.js proxy route
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    if (!res.ok) throw new Error('Session expired');
    const data = await res.json();
    if (data?.accessToken) {
      setMemoryToken(data.accessToken);
    }
    return data as RefreshTokenResponse;
  }

  async logout() {
    clearMemoryToken();
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    return res.json().catch(() => ({}));
  }

  async logoutAll() {
    clearMemoryToken();
    const res = await fetch('/api/auth/logout-all', { method: 'POST' });
    return res.json().catch(() => ({}));
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
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data?.message || 'Google login failed');
      err.response = { status: res.status, data };
      throw err;
    }
    return data as AuthResponse;
  }

  async verify2FA(email: string, code: string) {
    // Route through Next.js proxy — sets httpOnly cookies server-side
    const res = await fetch('/api/auth/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const responseData = await res.json();
    if (!res.ok) {
      const err: any = new Error(responseData?.message || '2FA verification failed');
      err.response = { status: res.status, data: responseData };
      throw err;
    }
    return responseData as AuthResponse;
  }

  // Helper methods

  /**
   * Store the access token in memory only.
   * Tokens are set as httpOnly cookies by the Next.js proxy routes — this method
   * only updates the in-memory variable used by the axios interceptor.
   */
  setTokens(accessToken: string, _refreshToken?: string) {
    setMemoryToken(accessToken);
  }

  getAccessToken(): string | null {
    return getMemoryToken();
  }

  getRefreshToken(): string | null {
    // Refresh token is in an httpOnly cookie — not readable by JS; return null
    return null;
  }

  clearTokens() {
    clearMemoryToken();
    if (typeof window !== 'undefined') {
      // Clear the non-httpOnly userRole cookie
      Cookies.remove('userRole', { path: '/' });
      localStorage.removeItem('user');
    }
  }

  setUser(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
      // Set role cookie for middleware role-based route checks (non-sensitive data)
      Cookies.set('userRole', user.role, {
        expires: 7,
        path: '/',
        sameSite: 'strict',
        secure: window.location.protocol === 'https:',
      });
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
    // Check in-memory token; if missing (e.g. page refresh), checkAuth will call /api/auth/refresh
    return !!getMemoryToken();
  }
}

export const authService = new AuthService();
