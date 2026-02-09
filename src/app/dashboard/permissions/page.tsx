'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { permissionService } from '@/services/permission.service';
import {
  FiKey,
  FiSearch,
  FiFilter,
  FiEye,
  FiDatabase,
  FiShield,
} from '@/utils/icons';

export default function PermissionsPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [selectedResource, setSelectedResource] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionService.getAllPermissions(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  const { data: groupedPermissions, isLoading: groupedLoading } = useQuery({
    queryKey: ['permissions-grouped'],
    queryFn: () => permissionService.getGroupedPermissions(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && viewMode === 'grouped',
  });

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['permissions-resources'],
    queryFn: () => permissionService.getResources(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['permissions-stats'],
    queryFn: () => permissionService.getStatistics(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  if (isLoading || permissionsLoading || groupedLoading || resourcesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  const filteredPermissions = permissions?.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.action.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredGrouped = selectedResource && groupedPermissions
    ? { [selectedResource]: groupedPermissions[selectedResource] || [] }
    : groupedPermissions || {};

  return (
    <DashboardLayout role={role}>
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Permissions Management</h1>
            <p className="text-gray-600">View and manage system permissions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'grouped' ? 'list' : 'grouped')}
              className="btn-secondary text-sm"
            >
              {viewMode === 'grouped' ? 'List View' : 'Grouped View'}
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <FiKey className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-gray-700">Total Permissions</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.totalPermissions || permissions?.length || 0}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <FiDatabase className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-gray-700">Resources</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.totalResources || resources?.length || 0}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <FiShield className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-gray-700">Actions</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.totalActions || 0}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <FiDatabase className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-gray-700">Assigned</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.assignedPermissions || 0}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            {viewMode === 'grouped' && resources && (
              <div className="flex items-center gap-2">
                <FiFilter className="text-gray-400" />
                <select
                  value={selectedResource}
                  onChange={(e) => setSelectedResource(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Resources</option>
                  {resources.map((resource) => (
                    <option key={resource} value={resource}>
                      {resource}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Permissions Display */}
        <div className="card">
          {viewMode === 'grouped' ? (
            // Grouped View
            Object.keys(filteredGrouped).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(filteredGrouped).map(([resource, perms]: [string, any[]]) => (
                  <div key={resource} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 capitalize">
                      {resource.replace(/_/g, ' ')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {perms.map((perm) => (
                        <div
                          key={perm.id}
                          className="p-4 rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{perm.name}</p>
                              <p className="text-xs text-gray-500 mt-1">{perm.action}</p>
                            </div>
                            <button
                              onClick={() => router.push(`/dashboard/permissions/${perm.id}`)}
                              className="text-primary hover:text-primary-light"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                          </div>
                          {perm.description && (
                            <p className="text-sm text-gray-600 mt-2">{perm.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiKey className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No permissions found</p>
              </div>
            )
          ) : (
            // List View
            filteredPermissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Permission</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Resource</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPermissions.map((perm) => (
                      <tr key={perm.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <p className="font-semibold text-gray-900">{perm.name}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                            {perm.resource.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {perm.action}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {perm.description || '—'}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => router.push(`/dashboard/permissions/${perm.id}`)}
                            className="text-primary hover:text-primary-light"
                          >
                            <FiEye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FiKey className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No permissions found</p>
              </div>
            )
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}



