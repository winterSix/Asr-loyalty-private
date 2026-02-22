import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, authService } from '@/services/auth.service';
import Cookies from 'js-cookie';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
        if (user) {
          authService.setUser(user);
        }
      },

      setTokens: (accessToken, refreshToken) => {
        authService.setTokens(accessToken, refreshToken);
        // Also set in cookies for server-side access (middleware)
        // Set path to '/' to ensure cookies are accessible to all routes
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
      },

      login: (accessToken, refreshToken, user) => {
        console.log('[AuthStore] login() called:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasUser: !!user,
          tokenLength: accessToken?.length || 0
        });
        
        // Ensure tokens are strings and not undefined
        if (!accessToken || !refreshToken) {
          console.error('[AuthStore] Login called with invalid tokens:', { accessToken, refreshToken });
          return;
        }
        
        authService.setTokens(accessToken, refreshToken);
        console.log('[AuthStore] Tokens set in authService');
        
        authService.setUser(user);
        console.log('[AuthStore] User set in authService');
        
        // Also set in cookies for server-side access (middleware)
        // Set path to '/' to ensure cookies are accessible to all routes
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
        console.log('[AuthStore] Cookies set');
        
        // Verify token was stored
        const storedToken = localStorage.getItem('accessToken');
        const cookieToken = Cookies.get('accessToken');
        console.log('[AuthStore] Token verification:', {
          localStorageMatch: storedToken === accessToken,
          cookieSet: !!cookieToken,
          cookieMatch: cookieToken === accessToken
        });
        
        if (storedToken !== accessToken) {
          console.error('[AuthStore] Token storage verification failed - localStorage mismatch');
        }
        if (cookieToken !== accessToken) {
          console.error('[AuthStore] Token storage verification failed - cookie mismatch');
        }
        
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        console.log('[AuthStore] State updated:', {
          isAuthenticated: true,
          isLoading: false,
          hasUser: !!user
        });
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          authService.clearTokens();
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      logoutAll: async () => {
        try {
          await authService.logoutAll();
        } catch (error) {
          console.error('Logout all error:', error);
        } finally {
          authService.clearTokens();
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      checkAuth: async () => {
        // Don't check auth if we don't have a token
        if (!authService.isAuthenticated()) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        try {
          const user = await authService.getCurrentUser();
          const storedUser = authService.getUser();
          const resolvedUser = user || storedUser;

          // If the user still has mustChangePassword set, redirect them
          if (resolvedUser?.mustChangePassword && typeof window !== 'undefined') {
            const path = window.location.pathname;
            if (path !== '/force-change-password') {
              window.location.href = '/force-change-password';
            }
          }

          set({
            user: resolvedUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          // If error is 401, user is not authenticated
          if (error?.response?.status === 401) {
            // Only clear tokens if we don't have a stored user
            // This prevents clearing tokens immediately after login
            const storedUser = authService.getUser();
            if (!storedUser) {
              authService.clearTokens();
              Cookies.remove('accessToken');
              Cookies.remove('refreshToken');
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
            } else {
              // We have a stored user, keep it even if API call failed
              set({
                user: storedUser,
                isAuthenticated: true,
                isLoading: false,
              });
            }
          } else {
            // Other errors, use stored user if available
            const storedUser = authService.getUser();
            set({
              user: storedUser,
              isAuthenticated: !!storedUser,
              isLoading: false,
            });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Verify tokens actually exist - prevent stale auth state
          const hasToken = typeof window !== 'undefined' &&
            (!!localStorage.getItem('accessToken') || !!Cookies.get('accessToken'));

          if (state.isAuthenticated && !hasToken) {
            // Tokens are gone but Zustand still says authenticated - reset
            state.isAuthenticated = false;
            state.user = null;
            state.isLoading = false;
            return;
          }

          // After rehydration, if we have a user, set loading to false
          if (state.user && state.isAuthenticated) {
            state.isLoading = false;
          }
        }
      },
    }
  )
);
