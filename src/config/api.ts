import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

// Keep frontend and API rewrites aligned; default includes /api/v1 prefix.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:9000/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Try to get token from cookies (server-side) or localStorage (client-side)
    let token: string | null = null;
    
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('accessToken') || Cookies.get('accessToken') || null;
    }

    if (token && config.headers) {
      // Remove any existing Bearer prefix if present (to avoid double prefixing)
      const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }

    // Add device info for mobile compatibility
    if (typeof window !== 'undefined') {
      const deviceId = localStorage.getItem('deviceId');
      if (deviceId && config.headers) {
        config.headers['x-device-id'] = deviceId;
      }

      const deviceName = localStorage.getItem('deviceName');
      if (deviceName && config.headers) {
        config.headers['x-device-name'] = deviceName;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Skip refresh for auth endpoints to prevent infinite loops
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');
    
    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        let refreshToken: string | null = null;
        
        if (typeof window !== 'undefined') {
          refreshToken = localStorage.getItem('refreshToken') || Cookies.get('refreshToken') || null;
        }

        // Only try to refresh if we have a refresh token
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          }, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            Cookies.set('accessToken', accessToken, { expires: 7 });
            
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
              Cookies.set('refreshToken', newRefreshToken, { expires: 30 });
            }
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return apiClient(originalRequest);
        } else {
          // No refresh token, clear everything and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            Cookies.remove('accessToken');
            Cookies.remove('refreshToken');
            // Only redirect if not already on login/register page
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
              window.location.href = '/login';
            }
          }
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          // Only redirect if not already on login/register page
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
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

    // Handle other errors
    const message = error.response?.data?.message || error.message || 'An error occurred';

    // Don't show toast for 401 errors (handled above) or if it's an auth endpoint
    if (error.response?.status !== 401 && !isAuthEndpoint && typeof window !== 'undefined') {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Generate device ID if not exists (client-side only)
if (typeof window !== 'undefined' && !localStorage.getItem('deviceId')) {
  const deviceId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
