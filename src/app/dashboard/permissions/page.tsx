'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { permissionService } from '@/services/permission.service';
import {
  FiKey,
  FiSearch,
  FiFilter,
  FiEye,
  FiDatabase,
  FiShield,
  FiRefreshCw,
  FiLayers,
  FiChevronDown,
  FiChevronUp,
  FiActivity,
} from '@/utils/icons';
import CustomSelect from '@/components/ui/CustomSelect';

export default function PermissionsPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [selectedResource, setSelectedResource] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionService.getAllPermissions(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  const { data: groupedPermissions } = useQuery({
    queryKey: ['permissions-grouped'],
    queryFn: () => permissionService.getGroupedPermissions(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  const { data: resources } = useQuery({
    queryKey: ['permissions-resources'],
    queryFn: () => permissionService.getResources(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  const { data: statistics } = useQuery({
    queryKey: ['permissions-stats'],
    queryFn: () => permissionService.getStatistics(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  // Initialize all groups as expanded
  useEffect(() => {
    if (groupedPermissions && expandedGroups.size === 0) {
      setExpandedGroups(new Set(Object.keys(groupedPermissions)));
    }
  }, [groupedPermissions]);

  const filteredPermissions = useMemo(() => {
    const perms = permissions || [];
    if (!searchTerm) return perms;
    const q = searchTerm.toLowerCase();
    return perms.filter((p: any) =>
      p.name?.toLowerCase().includes(q) ||
      p.resource?.toLowerCase().includes(q) ||
      p.action?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }, [permissions, searchTerm]);

  const filteredGrouped = useMemo(() => {
    const gp = groupedPermissions || {};
    const result = selectedResource
      ? { [selectedResource]: gp[selectedResource] || [] }
      : gp;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const filtered: Record<string, any[]> = {};
      Object.entries(result).forEach(([resource, perms]: [string, any[]]) => {
        const matches = perms.filter((p: any) =>
          p.name?.toLowerCase().includes(q) ||
          p.action?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        );
        if (matches.length > 0) filtered[resource] = matches;
      });
      return filtered;
    }
    return result;
  }, [groupedPermissions, selectedResource, searchTerm]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['permissions'] }),
      queryClient.invalidateQueries({ queryKey: ['permissions-grouped'] }),
      queryClient.invalidateQueries({ queryKey: ['permissions-resources'] }),
      queryClient.invalidateQueries({ queryKey: ['permissions-stats'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const toggleGroup = (resource: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(resource)) next.delete(resource);
      else next.add(resource);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  const statCards = [
    {
      label: 'Total Permissions',
      value: statistics?.totalPermissions || permissions?.length || 0,
      icon: FiKey,
      color: 'from-indigo-500 to-blue-600',
      shadow: 'shadow-indigo-500/25',
    },
    {
      label: 'Resources',
      value: statistics?.totalResources || resources?.length || 0,
      icon: FiDatabase,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
    },
    {
      label: 'Actions',
      value: statistics?.totalActions || 0,
      icon: FiActivity,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
    },
    {
      label: 'Assigned',
      value: statistics?.assignedPermissions || 0,
      icon: FiShield,
      color: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/25',
    },
  ];

  const getActionColor = (action: string) => {
    const a = action?.toUpperCase();
    if (a === 'CREATE' || a === 'WRITE') return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    if (a === 'READ' || a === 'VIEW' || a === 'LIST') return 'bg-blue-50 text-blue-700 ring-blue-600/20';
    if (a === 'UPDATE' || a === 'EDIT') return 'bg-amber-50 text-amber-700 ring-amber-600/20';
    if (a === 'DELETE' || a === 'REMOVE') return 'bg-red-50 text-red-700 ring-red-600/20';
    if (a === 'MANAGE' || a === 'ADMIN') return 'bg-violet-50 text-violet-700 ring-violet-600/20';
    return 'bg-gray-50 text-gray-700 ring-gray-500/20';
  };

  const getResourceColor = (resource: string) => {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-violet-500 to-purple-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-red-600',
      'from-cyan-500 to-blue-600',
      'from-pink-500 to-rose-600',
      'from-lime-500 to-green-600',
    ];
    const hash = resource.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25">
              <FiKey className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887]">Permissions</h1>
              <p className="text-gray-500 text-sm">View and manage system permissions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-300 transition-all disabled:opacity-50"
              title="Refresh"
            >
              <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grouped')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  viewMode === 'grouped'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                Grouped
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-5 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg ${card.shadow}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-[#94A3B8]">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search permissions by name, resource, or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
            {viewMode === 'grouped' && resources && (
              <CustomSelect
                value={selectedResource}
                onChange={(v) => setSelectedResource(v)}
                options={[
                  { value: '', label: 'All Resources' },
                  ...resources.map((resource: string) => ({
                    value: resource,
                    label: resource.replace(/_/g, ' '),
                  })),
                ]}
                className="min-w-[180px]"
              />
            )}
          </div>
        </div>

        {/* Permissions Display */}
        {permissionsLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : viewMode === 'grouped' ? (
          /* Grouped View */
          Object.keys(filteredGrouped).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(filteredGrouped).map(([resource, perms]: [string, any[]]) => {
                const isExpanded = expandedGroups.has(resource);
                const resColor = getResourceColor(resource);
                return (
                  <div key={resource} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleGroup(resource)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${resColor} text-white shadow-sm`}>
                          <FiDatabase className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                            {resource.replace(/_/g, ' ')}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-[#94A3B8]">{perms.length} permission{perms.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <FiChevronUp className="w-5 h-5 text-gray-400 dark:text-[#64748B]" />
                      ) : (
                        <FiChevronDown className="w-5 h-5 text-gray-400 dark:text-[#64748B]" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-gray-100 dark:border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                          {perms.map((perm: any) => (
                            <div
                              key={perm.id}
                              className="p-4 rounded-xl border border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20 hover:shadow-sm transition-all group bg-gray-50/50 dark:bg-white/5"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-primary transition-colors">
                                    {perm.name}
                                  </p>
                                  <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ring-inset ${getActionColor(perm.action)}`}>
                                    {perm.action}
                                  </span>
                                </div>
                              </div>
                              {perm.description && (
                                <p className="text-xs text-gray-500 dark:text-[#94A3B8] mt-2 line-clamp-2">{perm.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiKey className="w-8 h-8 text-gray-400 dark:text-[#64748B]" />
              </div>
              <p className="text-gray-900 dark:text-white font-semibold mb-1">No permissions found</p>
              <p className="text-sm text-gray-400 dark:text-[#64748B]">
                {searchTerm || selectedResource ? 'Try adjusting your filters' : 'No permissions have been configured'}
              </p>
            </div>
          )
        ) : (
          /* List View */
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
            {filteredPermissions.length > 0 ? (
              <div className="overflow-x-auto min-w-0">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-white/5">
                      <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Permission</th>
                      <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Resource</th>
                      <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Action</th>
                      <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                    {filteredPermissions.map((perm: any) => (
                      <tr key={perm.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors group">
                        <td className="py-4 px-5">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-primary transition-colors">{perm.name}</p>
                        </td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20 capitalize">
                            {perm.resource?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${getActionColor(perm.action)}`}>
                            {perm.action}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <p className="text-xs text-gray-500 dark:text-[#94A3B8] line-clamp-1">{perm.description || '\u2014'}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiKey className="w-8 h-8 text-gray-400 dark:text-[#64748B]" />
                </div>
                <p className="text-gray-900 dark:text-white font-semibold mb-1">No permissions found</p>
                <p className="text-sm text-gray-400 dark:text-[#64748B]">
                  {searchTerm ? 'Try adjusting your search' : 'No permissions have been configured'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
  );
}
