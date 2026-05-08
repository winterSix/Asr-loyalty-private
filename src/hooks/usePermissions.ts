'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { roleService } from '@/services/role.service';

export interface UsePermissionsReturn {
  /** True for ADMIN/SUPER_ADMIN unconditionally; for OTHERS checks the API-fetched set. */
  hasPermission: (...perms: string[]) => boolean;
  /** Same as hasPermission but requires ALL perms (AND logic). */
  hasAllPermissions: (...perms: string[]) => boolean;
  /** Convenience: any admin-class role (ADMIN | SUPER_ADMIN | OTHERS). */
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: string;
  /** True while the OTHERS permission set is being fetched for the first time. */
  isLoadingPermissions: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, isLoading } = useAuthStore();
  const role = user?.role ?? 'CUSTOMER';

  const { data: rawPermissions, isLoading: permsLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: () => roleService.getMyPermissions(),
    // Only OTHERS users need a DB lookup — all other roles are handled by role check alone.
    enabled: !isLoading && !!user?.id && role === 'OTHERS',
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const permSet = useMemo(
    () => new Set((rawPermissions ?? []).map((p: { resource: string; action: string }) => `${p.resource}:${p.action}`)),
    [rawPermissions],
  );

  const hasPermission = useMemo(
    () =>
      (...perms: string[]): boolean => {
        if (role === 'SUPER_ADMIN' || role === 'ADMIN') return true;
        if (role !== 'OTHERS') return false;
        return perms.some((p) => permSet.has(p));
      },
    [role, permSet],
  );

  const hasAllPermissions = useMemo(
    () =>
      (...perms: string[]): boolean => {
        if (role === 'SUPER_ADMIN' || role === 'ADMIN') return true;
        if (role !== 'OTHERS') return false;
        return perms.every((p) => permSet.has(p));
      },
    [role, permSet],
  );

  return {
    hasPermission,
    hasAllPermissions,
    isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'OTHERS',
    isSuperAdmin: role === 'SUPER_ADMIN',
    role,
    isLoadingPermissions: role === 'OTHERS' ? permsLoading : false,
  };
}
