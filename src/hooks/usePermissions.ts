'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/store/auth.store';

export interface UsePermissionsReturn {
  /** True if user has at least one of the given permissions (OR logic). ADMIN/SUPER_ADMIN always true. */
  hasPermission: (...perms: string[]) => boolean;
  /** True if user has ALL of the given permissions (AND logic). ADMIN/SUPER_ADMIN always true. */
  hasAllPermissions: (...perms: string[]) => boolean;
  /** Convenience: any admin-class role (ADMIN | SUPER_ADMIN | OTHERS). */
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** True only for SUPER_ADMIN — has unconditional full access regardless of DB permissions. */
  isFullAccess: boolean;
  role: string;
  /** True while auth check is resolving and permissions are not yet available. */
  isLoadingPermissions: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, isLoading } = useAuthStore();
  const role = user?.role ?? 'CUSTOMER';

  const permSet = useMemo(
    () => new Set(user?.permissions ?? []),
    [user?.permissions],
  );

  const hasPermission = useMemo(
    () =>
      (...perms: string[]): boolean => {
        if (permSet.has('ALL')) return true;
        return perms.some((p) => permSet.has(p));
      },
    [permSet],
  );

  const hasAllPermissions = useMemo(
    () =>
      (...perms: string[]): boolean => {
        if (permSet.has('ALL')) return true;
        return perms.every((p) => permSet.has(p));
      },
    [permSet],
  );

  return {
    hasPermission,
    hasAllPermissions,
    isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'OTHERS',
    isSuperAdmin: role === 'SUPER_ADMIN',
    isFullAccess: permSet.has('ALL'),
    role,
    isLoadingPermissions: isLoading,
  };
}
