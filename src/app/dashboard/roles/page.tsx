'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { roleService } from '@/services/role.service';
import {
  FiLayers,
  FiPlus,
  FiEdit,
  FiEye,
  FiUsers,
} from '@/utils/icons';

export default function RolesPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getRoles(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  if (isLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  return (
    <DashboardLayout role={role}>
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Roles & Permissions</h1>
            <p className="text-gray-600">Manage system roles and their permissions</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/roles/create')}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Add Role
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles && roles.length > 0 ? (
            roles.map((roleItem) => (
              <div key={roleItem.id} className="card card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-primary rounded-xl text-white">
                    <FiLayers className="w-6 h-6" />
                  </div>
                  {roleItem.isSystem && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      System
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{roleItem.name}</h3>
                    {roleItem.description && (
                      <p className="text-sm text-gray-600 mt-1">{roleItem.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiUsers className="w-4 h-4" />
                    <span>{roleItem.permissions?.length || 0} permissions</span>
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => router.push(`/dashboard/roles/${roleItem.id}`)}
                      className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2"
                    >
                      <FiEye className="w-4 h-4" />
                      View
                    </button>
                    {!roleItem.isSystem && (
                      <button
                        onClick={() => router.push(`/dashboard/roles/${roleItem.id}/edit`)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FiLayers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No roles found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

