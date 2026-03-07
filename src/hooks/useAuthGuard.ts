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
      // Small delay to ensure token is fully available
      setTimeout(() => {
        checkAuth();
      }, 200);
    } else if (!hasToken && !storedUser) {
      // No token and no stored user, checkAuth will set loading to false
      checkAuth();
    }
  }, [user, isAuthenticated, checkAuth]);

  // Handle redirects after auth check completes
  // Only redirect if we're absolutely sure the user is not authenticated
  useEffect(() => {
    // Don't redirect if we're still loading or already redirecting
    if (isLoading || redirectingRef.current) return;
    
    // Check if we have a token or stored user
    const hasToken = authService.isAuthenticated();
    const storedUser = authService.getUser();
    
    // Only redirect if we have NO token, NO stored user, and state says not authenticated
    if (!isAuthenticated && !hasToken && !storedUser && !user) {
      redirectingRef.current = true;
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  return { user, isAuthenticated, isLoading: isLoading || !hydrated };
}

