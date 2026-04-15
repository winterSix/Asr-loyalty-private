import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, authService } from '@/services/auth.service';
import { setMemoryToken, refreshAccessToken } from '@/config/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
        if (user) {
          authService.setUser(user);
        }
      },

      setTokens: (accessToken, _refreshToken) => {
        authService.setTokens(accessToken);
      },

      login: (_accessToken, _refreshToken, user) => {
        // Tokens are set by the Next.js proxy route as httpOnly cookies — nothing to store here.
        // Only persist user profile in memory/zustand.
        authService.setUser(user);
        set({ user, isAuthenticated: true, isLoading: false });
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // swallow — we still clear local state
        } finally {
          authService.clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      logoutAll: async () => {
        try {
          await authService.logoutAll();
        } catch {
          // swallow
        } finally {
          authService.clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      checkAuth: async () => {
        // On every page load the memory token is gone — always attempt a silent refresh
        // via the httpOnly refresh cookie before deciding auth state.
        // Uses the shared singleton so concurrent calls (layout + page) only hit
        // the backend once.
        try {
          const accessToken = await refreshAccessToken();

          if (!accessToken) {
            // Refresh cookie is absent or expired — signed out
            authService.clearTokens();
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          // Token is already stored in memory by refreshAccessToken()

          // Always fetch fresh user data so userRoles/permissions are current
          const user = await authService.getCurrentUser();
          const resolvedUser = user || authService.getUser();

          if (resolvedUser?.mustChangePassword && typeof window !== 'undefined') {
            if (window.location.pathname !== '/force-change-password') {
              window.location.href = '/force-change-password';
            }
          }

          set({ user: resolvedUser, isAuthenticated: true, isLoading: false });
        } catch {
          authService.clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
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
          // isLoading stays true until checkAuth resolves — it will verify via refresh cookie
          state.isLoading = true;
        }
      },
    }
  )
);
