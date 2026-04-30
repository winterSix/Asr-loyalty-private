import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';

/**
 * Hook to protect routes and check authentication
 * Only calls checkAuth if needed (no user but has token)
 */
export function useAuthGuard() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const hasInitializedRef = useRef(false);
  const redirectingRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  // Initialize auth state on mount
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Check if we have a stored user or token
    const storedUser = authService.getUser();
    const hasToken = authService.isAuthenticated();

    // If authenticated in state but no actual token, clear stale state
    if (isAuthenticated && !hasToken) {
      checkAuth(); // This will reset state since no token exists
      return;
    }

    // If we have a user from persist or in state, we're good - don't call checkAuth
    if ((storedUser || user) && isAuthenticated && hasToken) {
      return; // User is already loaded, skip checkAuth
    }

    // If we have a stored user but no user in state, we still have the user - skip checkAuth
    if (storedUser && !user && hasToken) {
      return; // We have stored user, no need to call API
    }

    // Only call checkAuth if we have a token but no user at all
    if (hasToken && !user && !storedUser) {
      checkAuth();
    } else if (!hasToken && !storedUser) {
      // No token and no stored user, checkAuth will set loading to false
      checkAuth();
    }
  }, [user, isAuthenticated, checkAuth]);

  // Handle redirects after auth check completes.
  // Wait for both the store's loading flag AND client hydration before redirecting
  // so we never send an authenticated user to /login due to a rehydration race.
  useEffect(() => {
    if (isLoading || !hydrated || redirectingRef.current) return;

    const hasToken = authService.isAuthenticated();
    const storedUser = authService.getUser();

    if (!isAuthenticated && !hasToken && !storedUser && !user) {
      redirectingRef.current = true;
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, user, router, hydrated]);

  // Do NOT include !hydrated in isLoading here. Zustand rehydrates synchronously
  // from localStorage, so user/isAuthenticated are already correct by first render.
  // Including !hydrated causes every page navigation to show a full-page spinner
  // for one render cycle before queries can even start — that's the slug feeling.
  return { user, isAuthenticated, isLoading };
}

