'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '@/services/role.service';
import {
  FiLayers,
  FiPlus,
  FiEdit,
  FiEye,
  FiUsers,
  FiSearch,
  FiShield,
  FiKey,
  FiRefreshCw,
  FiTrash2,
  FiCheckCircle,
  FiAlertTriangle,
} from '@/utils/icons';
import toast from 'react-hot-toast';

export default function RolesPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  const { data: rolesRaw, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getRoles(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  const roles = useMemo(() => {
    if (!rolesRaw) return [];
    if (Array.isArray(rolesRaw)) return rolesRaw;
    return (rolesRaw as any)?.data || [];
  }, [rolesRaw]);

  const filteredRoles = useMemo(() => {
    if (!searchTerm) return roles;
    const q = searchTerm.toLowerCase();
    return roles.filter((r: any) =>
      r.name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  }, [roles, searchTerm]);

  const deleteMutation = useMutation({
    mutationFn: (roleId: string) => roleService.deleteRole(roleId),
    onSuccess: () => {
      toast.success('Role deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeleteConfirm(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete role');
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['roles'] });
    setTimeout(() => setIsRefreshing(false), 600);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';
  const systemRoles = roles.filter((r: any) => r.isSystem);
  const customRoles = roles.filter((r: any) => !r.isSystem);
  const totalPermissions = roles.reduce((sum: number, r: any) => sum + (r.permissions?.length || 0), 0);

  const statCards = [
    {
      label: 'Total Roles',
      value: roles.length,
      icon: FiLayers,
      color: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/25',
    },
    {
      label: 'System Roles',
      value: systemRoles.length,
      icon: FiShield,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
    },
    {
      label: 'Custom Roles',
      value: customRoles.length,
      icon: FiUsers,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
    },
    {
      label: 'Total Permissions',
      value: totalPermissions,
      icon: FiKey,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
    },
  ];

  const getRoleColor = (roleName: string) => {
    const name = roleName?.toUpperCase();
    if (name?.includes('SUPER_ADMIN') || name?.includes('SUPER ADMIN')) return { bg: 'from-rose-500 to-red-600', shadow: 'shadow-rose-500/25', badge: 'bg-rose-50 text-rose-700 ring-rose-600/20' };
    if (name?.includes('ADMIN')) return { bg: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25', badge: 'bg-violet-50 text-violet-700 ring-violet-600/20' };
    if (name?.includes('CASHIER')) return { bg: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25', badge: 'bg-blue-50 text-blue-700 ring-blue-600/20' };
    if (name?.includes('CUSTOMER_SUPPORT') || name?.includes('SUPPORT')) return { bg: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/25', badge: 'bg-amber-50 text-amber-700 ring-amber-600/20' };
    if (name?.includes('FINANCE')) return { bg: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/25', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' };
    return { bg: 'from-gray-500 to-gray-600', shadow: 'shadow-gray-500/25', badge: 'bg-gray-50 text-gray-700 ring-gray-500/20' };
  };

  return (
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
              <FiLayers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Roles & Permissions</h1>
              <p className="text-gray-500 text-sm">Manage system roles and their permissions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
              title="Refresh"
            >
              <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => router.push('/dashboard/roles/create')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Add Role
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg ${card.shadow}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search roles by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* Roles Grid */}
        {rolesLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredRoles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map((roleItem: any) => {
              const rc = getRoleColor(roleItem.name);
              return (
                <div key={roleItem.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group overflow-hidden">
                  {/* Color bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${rc.bg}`}></div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${rc.bg} text-white shadow-lg ${rc.shadow}`}>
                        <FiLayers className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        {roleItem.isSystem && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20">
                            <FiShield className="w-3 h-3" />
                            System
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {roleItem.name?.replace(/_/g, ' ')}
                      </h3>
                      {roleItem.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{roleItem.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-xs font-medium text-gray-600">
                        <FiKey className="w-3.5 h-3.5" />
                        {roleItem.permissions?.length || 0} permissions
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => router.push(`/dashboard/roles/${roleItem.id}`)}
                        className="flex-1 px-3 py-2 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                      >
                        <FiEye className="w-4 h-4" />
                        View
                      </button>
                      {!roleItem.isSystem && (
                        <>
                          <button
                            onClick={() => router.push(`/dashboard/roles/${roleItem.id}/edit`)}
                            className="px-3 py-2 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors text-sm font-medium flex items-center gap-1.5"
                          >
                            <FiEdit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(roleItem.id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete Confirmation */}
                  {deleteConfirm === roleItem.id && (
                    <div className="px-5 pb-5 -mt-1">
                      <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                        <div className="flex items-center gap-2 mb-2">
                          <FiAlertTriangle className="w-4 h-4 text-red-500" />
                          <p className="text-sm font-medium text-red-700">Delete this role?</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => deleteMutation.mutate(roleItem.id)}
                            disabled={deleteMutation.isPending}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            {deleteMutation.isPending ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 rounded-lg bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors border border-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiLayers className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold mb-1">No roles found</p>
            <p className="text-sm text-gray-400">
              {searchTerm ? 'Try adjusting your search' : 'Create a new role to get started'}
            </p>
          </div>
        )}
      </div>
  );
}
