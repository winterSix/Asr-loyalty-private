import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// Keep frontend and API rewrites aligned; default includes /api/v1 prefix.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:9000/api/v1';

/**
 * In-memory access token store.
 * Tokens are NEVER written to localStorage or readable-by-JS cookies.
 * The refresh token lives in an httpOnly cookie managed exclusively by Next.js API routes.
 * On page load, checkAuth() calls /api/auth/refresh to hydrate this variable.
 */
let _memoryAccessToken: string | null = null;

export function setMemoryToken(token: string | null) {
  _memoryAccessToken = token;
}

export function getMemoryToken(): string | null {
  return _memoryAccessToken;
}

export function clearMemoryToken() {
  _memoryAccessToken = null;
}

// Singleton refresh promise to prevent concurrent 401s all firing refresh
let _refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!_refreshPromise) {
    _refreshPromise = fetch('/api/auth/refresh', { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        const token = data?.accessToken ?? null;
        _memoryAccessToken = token;
        return token;
      })
      .catch(() => null)
      .finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor — attach in-memory access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (_memoryAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${_memoryAccessToken}`;
    }

    // Add device info
    if (typeof window !== 'undefined') {
      const deviceId = localStorage.getItem('deviceId');
      if (deviceId && config.headers) config.headers['x-device-id'] = deviceId;
      const deviceName = localStorage.getItem('deviceName');
      if (deviceName && config.headers) config.headers['x-device-name'] = deviceName;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 with httpOnly-cookie refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();

      if (newToken) {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } else {
        // Refresh failed — only redirect if we still have no token in memory.
        // If a concurrent checkAuth() already set a token, skip the redirect to
        // avoid a race-condition logout.
        if (!_memoryAccessToken) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    }

    // Handle 503 Maintenance Mode
    if (error.response?.status === 503) {
      const msg = error.response?.data?.message || 'The system is currently under maintenance.';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('asr:maintenance', { detail: { active: true, message: msg } }));
        toast.error(msg, { id: 'maintenance-mode', duration: 8000 });
      }
      return Promise.reject(error);
    }

    const message = error.response?.data?.message || error.message || 'An error occurred';
    if (error.response?.status !== 401 && !isAuthEndpoint && typeof window !== 'undefined') {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Generate device ID if not exists
if (typeof window !== 'undefined' && !localStorage.getItem('deviceId')) {
  const deviceId = `web-${crypto.randomUUID()}`;
  localStorage.setItem('deviceId', deviceId);
  localStorage.setItem('deviceName', 'Web Browser');
}

/**
 * Utility function to unwrap API responses
 * Backend returns wrapped responses: { success, statusCode, timestamp, data, message }
 * This function extracts the data if wrapped, otherwise returns the response as-is
 */
export function unwrapResponse<T>(responseData: any): T {
  // Only strip the OUTER interceptor wrapper which has BOTH success AND statusCode.
  // Inner service responses (e.g. { success, data, pagination }) only have success,
  // so they won't be incorrectly unwrapped.
  if (responseData?.data !== undefined && typeof responseData.data === 'object' &&
      responseData.success !== undefined && responseData.statusCode !== undefined) {
    // When pagination is present, return normalized { data, total, page, limit }
    // so callers don't lose pagination info (interceptor strips the backend pagination object)
    if (responseData.pagination) {
      return {
        data: responseData.data,
        total: responseData.pagination.total ?? 0,
        page: responseData.pagination.page ?? 1,
        limit: responseData.pagination.limit ?? 10,
        totalPages: responseData.pagination.totalPages,
      } as T;
    }
    return responseData.data as T;
  }
  // Return as-is if not wrapped
  return responseData as T;
}
