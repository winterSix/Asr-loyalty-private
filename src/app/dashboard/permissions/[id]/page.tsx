'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { permissionService } from '@/services/permission.service';
import {
  FiKey,
  FiArrowLeft,
  FiShield,
  FiDatabase,
} from '@/utils/icons';

export default function PermissionDetailPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const permissionId = params?.id as string;

  const { data: permission, isLoading: permissionLoading } = useQuery({
    queryKey: ['permission', permissionId],
    queryFn: () => permissionService.getPermission(permissionId),
    enabled: !!permissionId && !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  if (isLoading || permissionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!permission) {
    return (
      <DashboardLayout role={user?.role || 'CUSTOMER'}>
        <div className="text-center py-12">
          <FiKey className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Permission not found</p>
          <button onClick={() => router.back()} className="btn-primary mt-4">
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const role = user?.role || 'CUSTOMER';

  return (
    <DashboardLayout role={role}>
      <div>
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Permissions
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Permission Details</h1>
          <p className="text-gray-600">View permission information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Permission Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Permission Name</label>
                  <p className="text-gray-900 font-semibold text-lg mt-1">{permission.name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Resource</label>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                      <FiDatabase className="w-4 h-4" />
                      {permission.resource.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Action</label>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <FiShield className="w-4 h-4" />
                      {permission.action}
                    </span>
                  </div>
                </div>
                {permission.description && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Description</label>
                    <p className="text-gray-900 mt-1">{permission.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-semibold text-gray-700">Permission ID</label>
                  <p className="text-gray-900 font-mono text-xs mt-1">{permission.id}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Format</p>
                  <p className="text-sm font-semibold text-gray-900 font-mono">
                    {permission.resource}:{permission.action}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}



