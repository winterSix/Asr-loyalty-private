'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemSettingsService, SystemSettingKey } from '@/services/system-settings.service';
import {
  FiSettings,
  FiShield,
  FiBell,
  FiDatabase,
  FiRefreshCw,
  FiToggleLeft,
  FiToggleRight,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiActivity,
  FiZap,
  FiGlobe,
  FiLock,
  FiKey,
  FiEdit,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiCreditCard,
  FiSlash,
  FiTrash2,
  FiPlus,
} from '@/utils/icons';
import toast from 'react-hot-toast';

// Keys shown in dedicated sections — excluded from the generic Feature Flags list
const MAINTENANCE_KEY = SystemSettingKey.MAINTENANCE_MODE;
const GATEWAY_KEYS = [SystemSettingKey.PAYSTACK_ENABLED, SystemSettingKey.OPAY_ENABLED];
const DEDICATED_KEYS = [MAINTENANCE_KEY, ...GATEWAY_KEYS];

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingSetting, setEditingSetting] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    key: '',
    value: '',
    type: 'string' as 'boolean' | 'string' | 'number' | 'json',
    category: 'general' as 'feature' | 'payment' | 'security' | 'general',
    description: '',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { data: groupedRaw, isLoading: settingsLoading } = useQuery({
    queryKey: ['system-settings-grouped'],
    queryFn: () => systemSettingsService.getGroupedSettings(),
    enabled: !!user && isAdmin,
  });

  const { data: featuresRaw } = useQuery({
    queryKey: ['system-settings-features'],
    queryFn: () => systemSettingsService.getFeatures(),
    enabled: !!user && isAdmin,
  });

  const { data: paymentGatewaysRaw } = useQuery({
    queryKey: ['payment-gateway-statuses'],
    queryFn: () => systemSettingsService.getPaymentGatewayStatuses(),
    enabled: !!user && isAdmin,
  });

  // Public endpoint — works even during maintenance mode
  const { data: systemStatus } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => systemSettingsService.getSystemStatus(),
  });

  const grouped = useMemo(() => {
    if (!groupedRaw) return {};
    if (typeof groupedRaw === 'object' && !Array.isArray(groupedRaw)) return groupedRaw as Record<string, any[]>;
    return {};
  }, [groupedRaw]);

  const features = useMemo(() => {
    if (!featuresRaw) return [];
    if (Array.isArray(featuresRaw)) return featuresRaw;
    return (featuresRaw as any)?.data || (featuresRaw as any)?.features || [];
  }, [featuresRaw]);

  const paymentGateways = useMemo(() => {
    if (!paymentGatewaysRaw) return [];
    if (Array.isArray(paymentGatewaysRaw)) return paymentGatewaysRaw;
    return (paymentGatewaysRaw as any)?.gateways || [];
  }, [paymentGatewaysRaw]);

  // Maintenance mode derived from the public status endpoint (bypasses maintenance guard)
  const isMaintenanceActive = systemStatus?.maintenanceMode ?? false;

  // Feature flags excluding maintenance_mode and payment gateway keys (they have dedicated sections)
  const filteredFeatures = features.filter((f: any) => !DEDICATED_KEYS.includes(f.key));

  // Initialize all categories as expanded
  useEffect(() => {
    if (Object.keys(grouped).length > 0 && expandedCategories.size === 0) {
      setExpandedCategories(new Set(Object.keys(grouped)));
    }
  }, [grouped]);

  const filteredGrouped = useMemo(() => {
    if (!searchTerm) return grouped;
    const q = searchTerm.toLowerCase();
    const result: Record<string, any[]> = {};
    Object.entries(grouped).forEach(([category, settings]) => {
      const filtered = (settings as any[]).filter((s: any) =>
        s.key?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.value?.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q)
      );
      if (filtered.length > 0) result[category] = filtered;
    });
    return result;
  }, [grouped, searchTerm]);

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      systemSettingsService.toggleFeature(key, enabled),
    onSuccess: () => {
      toast.success('Setting toggled');
      queryClient.invalidateQueries({ queryKey: ['system-settings-grouped'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings-features'] });
      queryClient.invalidateQueries({ queryKey: ['payment-gateway-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to toggle setting');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      systemSettingsService.updateSetting(key, value),
    onSuccess: () => {
      toast.success('Setting updated');
      setEditingSetting(null);
      queryClient.invalidateQueries({ queryKey: ['system-settings-grouped'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update setting');
    },
  });

  const initializeMutation = useMutation({
    mutationFn: () => systemSettingsService.initializeDefaults(),
    onSuccess: () => {
      toast.success('System settings initialized with defaults');
      queryClient.invalidateQueries({ queryKey: ['system-settings-grouped'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings-features'] });
      queryClient.invalidateQueries({ queryKey: ['payment-gateway-statuses'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to initialize defaults');
    },
  });

  const refreshCacheMutation = useMutation({
    mutationFn: () => systemSettingsService.refreshCache(),
    onSuccess: () => {
      toast.success('Server cache refreshed');
      queryClient.invalidateQueries({ queryKey: ['system-settings-grouped'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings-features'] });
      queryClient.invalidateQueries({ queryKey: ['payment-gateway-statuses'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to refresh cache');
    },
  });

  const createMutation = useMutation({
    mutationFn: () => systemSettingsService.createSetting(createForm),
    onSuccess: () => {
      toast.success('Setting created');
      setShowCreateModal(false);
      setCreateForm({ key: '', value: '', type: 'string', category: 'general', description: '' });
      queryClient.invalidateQueries({ queryKey: ['system-settings-grouped'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings-features'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create setting');
    },
  });

  const deleteSettingMutation = useMutation({
    mutationFn: (key: string) => systemSettingsService.deleteSetting(key),
    onSuccess: () => {
      toast.success('Setting deleted');
      setDeleteConfirmKey(null);
      queryClient.invalidateQueries({ queryKey: ['system-settings-grouped'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings-features'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete setting');
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['system-settings-grouped'] }),
      queryClient.invalidateQueries({ queryKey: ['system-settings-features'] }),
      queryClient.invalidateQueries({ queryKey: ['payment-gateway-statuses'] }),
      queryClient.invalidateQueries({ queryKey: ['system-status'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
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
  const totalSettings = Object.values(grouped).flat().length;
  const categoryCount = Object.keys(grouped).length;

  const getCategoryIcon = (category: string) => {
    const c = category?.toLowerCase();
    if (c.includes('security')) return { icon: FiShield, color: 'from-rose-500 to-red-600', shadow: 'shadow-rose-500/25' };
    if (c.includes('notification')) return { icon: FiBell, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' };
    if (c.includes('feature')) return { icon: FiZap, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/25' };
    if (c.includes('payment') || c.includes('transaction')) return { icon: FiActivity, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/25' };
    if (c.includes('general') || c.includes('system')) return { icon: FiGlobe, color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' };
    if (c.includes('auth')) return { icon: FiLock, color: 'from-cyan-500 to-blue-600', shadow: 'shadow-cyan-500/25' };
    if (c.includes('api') || c.includes('integration')) return { icon: FiKey, color: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-500/25' };
    return { icon: FiDatabase, color: 'from-gray-500 to-gray-600', shadow: 'shadow-gray-500/25' };
  };

  const isBooleanValue = (value: string) => {
    return value === 'true' || value === 'false';
  };

  const statCards = [
    {
      label: 'Total Settings',
      value: totalSettings,
      icon: FiSettings,
      color: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/25',
    },
    {
      label: 'Categories',
      value: categoryCount,
      icon: FiDatabase,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
    },
    {
      label: 'Feature Flags',
      value: features.length,
      icon: FiZap,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
    },
    {
      label: 'Active Features',
      value: features.filter((f: any) => f.enabled).length,
      icon: FiActivity,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
    },
  ];

  return (
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
              <FiSettings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887]">Settings</h1>
              <p className="text-gray-500 text-sm">Manage system configuration and feature flags</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-all shadow-sm shadow-violet-500/25"
                  title="Add a new system setting"
                >
                  <FiPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Setting</span>
                </button>
                <button
                  onClick={() => initializeMutation.mutate()}
                  disabled={initializeMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                  title="Initialize system settings with default values"
                >
                  <FiDatabase className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {initializeMutation.isPending ? 'Initializing...' : 'Init Defaults'}
                  </span>
                </button>
                <button
                  onClick={() => refreshCacheMutation.mutate()}
                  disabled={refreshCacheMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                  title="Flush and reload server-side settings cache"
                >
                  <FiRefreshCw className={`w-4 h-4 ${refreshCacheMutation.isPending ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">
                    {refreshCacheMutation.isPending ? 'Refreshing...' : 'Refresh Cache'}
                  </span>
                </button>
              </>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
              title="Reload page data"
            >
              <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {isAdmin && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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
        )}

        {/* ── Maintenance Mode ──────────────────────────────────────── */}
        {isAdmin && (
          <div
            className={`rounded-2xl border shadow-sm overflow-hidden mb-6 ${
              isMaintenanceActive
                ? 'border-red-200 bg-red-50'
                : 'border-amber-100 bg-amber-50/40'
            }`}
          >
            <div
              className={`px-6 py-4 flex items-center justify-between border-b ${
                isMaintenanceActive ? 'border-red-200 bg-red-100/60' : 'border-amber-100 bg-amber-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg text-white shadow-sm ${
                    isMaintenanceActive
                      ? 'bg-gradient-to-br from-red-500 to-rose-600'
                      : 'bg-gradient-to-br from-amber-500 to-orange-500'
                  }`}
                >
                  {isMaintenanceActive ? (
                    <FiSlash className="w-4 h-4" />
                  ) : (
                    <FiAlertTriangle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h2 className={`font-semibold ${isMaintenanceActive ? 'text-red-900' : 'text-amber-900'}`}>
                    Maintenance Mode
                    {isMaintenanceActive && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">
                        ACTIVE
                      </span>
                    )}
                  </h2>
                  <p className={`text-xs mt-0.5 ${isMaintenanceActive ? 'text-red-600' : 'text-amber-700'}`}>
                    {isMaintenanceActive
                      ? 'All API requests are returning 503. Only admins can access the system.'
                      : 'Enabling this will block all non-admin API requests with a 503 response.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  toggleMutation.mutate({ key: MAINTENANCE_KEY, enabled: !isMaintenanceActive })
                }
                disabled={toggleMutation.isPending}
                title={isMaintenanceActive ? 'Disable maintenance mode' : 'Enable maintenance mode'}
                className={`flex-shrink-0 p-1 rounded-full transition-all disabled:opacity-50 ${
                  isMaintenanceActive
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-gray-300 hover:text-amber-500'
                }`}
              >
                {isMaintenanceActive ? (
                  <FiToggleRight className="w-9 h-9" />
                ) : (
                  <FiToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>
            <div className={`px-6 py-3 text-xs ${isMaintenanceActive ? 'text-red-700' : 'text-amber-700'}`}>
              <strong>Impact:</strong> When active, all public and authenticated API endpoints return HTTP 503.
              Admin and Super Admin bypass this restriction. Use with caution.
            </div>
          </div>
        )}

        {/* ── Payment Gateways ─────────────────────────────────────── */}
        {isAdmin && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FiCreditCard className="w-4 h-4 text-emerald-500" />
                Payment Gateways
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Enable or disable individual payment processors</p>
            </div>
            {paymentGateways.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {paymentGateways.map((gw: any) => (
                  <div key={gw.key} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm capitalize">
                        {gw.key?.replace(/_enabled$/, '').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                      {gw.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{gw.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          gw.enabled
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {gw.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <button
                        onClick={() => toggleMutation.mutate({ key: gw.key, enabled: !gw.enabled })}
                        disabled={toggleMutation.isPending}
                        className={`p-1 rounded-full transition-all ${
                          gw.enabled
                            ? 'text-emerald-500 hover:text-emerald-600'
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                      >
                        {gw.enabled ? (
                          <FiToggleRight className="w-8 h-8" />
                        ) : (
                          <FiToggleLeft className="w-8 h-8" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center">
                <FiCreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No payment gateways configured</p>
              </div>
            )}
          </div>
        )}

        {/* ── Feature Flags ────────────────────────────────────────── */}
        {isAdmin && filteredFeatures.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FiZap className="w-4 h-4 text-amber-500" />
                Feature Flags
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Toggle system features on or off</p>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredFeatures.map((feature: any) => (
                <div key={feature.key} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {feature.key?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </p>
                    {feature.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate({ key: feature.key, enabled: !feature.enabled })}
                    disabled={toggleMutation.isPending}
                    className={`flex-shrink-0 p-1 rounded-full transition-all ${
                      feature.enabled
                        ? 'text-emerald-500 hover:text-emerald-600'
                        : 'text-gray-300 hover:text-gray-400'
                    }`}
                  >
                    {feature.enabled ? (
                      <FiToggleRight className="w-8 h-8" />
                    ) : (
                      <FiToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        {isAdmin && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search settings by key, value, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
          </div>
        )}

        {/* Grouped Settings */}
        {isAdmin ? (
          settingsLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : Object.keys(filteredGrouped).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(filteredGrouped).map(([category, settings]) => {
                const isExpanded = expandedCategories.has(category);
                const catMeta = getCategoryIcon(category);
                const CatIcon = catMeta.icon;
                return (
                  <div key={category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${catMeta.color} text-white shadow-sm`}>
                          <CatIcon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900 capitalize">
                            {category.replace(/_/g, ' ')}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {(settings as any[]).length} setting{(settings as any[]).length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <FiChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <FiChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="border-t border-gray-100 divide-y divide-gray-100">
                        {(settings as any[]).map((setting: any) => {
                          const isBoolean = isBooleanValue(setting.value);
                          const boolVal = setting.value === 'true';
                          const isEditing = editingSetting === setting.key;

                          return (
                            <div key={setting.id || setting.key} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/30 transition-colors">
                              <div className="flex-1 min-w-0 mr-4">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900 text-sm">
                                    {setting.key?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                  </p>
                                  {setting.isDefault && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-100 text-gray-500">DEFAULT</span>
                                  )}
                                </div>
                                {setting.description && (
                                  <p className="text-xs text-gray-500 mt-0.5">{setting.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isBoolean ? (
                                  <button
                                    onClick={() => toggleMutation.mutate({ key: setting.key, enabled: !boolVal })}
                                    disabled={toggleMutation.isPending}
                                    className={`p-1 rounded-full transition-all ${
                                      boolVal
                                        ? 'text-emerald-500 hover:text-emerald-600'
                                        : 'text-gray-300 hover:text-gray-400'
                                    }`}
                                  >
                                    {boolVal ? (
                                      <FiToggleRight className="w-7 h-7" />
                                    ) : (
                                      <FiToggleLeft className="w-7 h-7" />
                                    )}
                                  </button>
                                ) : isEditing ? (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-sm w-40 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') updateMutation.mutate({ key: setting.key, value: editValue });
                                        if (e.key === 'Escape') setEditingSetting(null);
                                      }}
                                    />
                                    <button
                                      onClick={() => updateMutation.mutate({ key: setting.key, value: editValue })}
                                      disabled={updateMutation.isPending}
                                      className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
                                    >
                                      <FiCheck className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingSetting(null)}
                                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                                    >
                                      <FiX className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-mono text-gray-700 max-w-[200px] truncate">
                                      {setting.value}
                                    </span>
                                    {isSuperAdmin && (
                                      <button
                                        onClick={() => { setEditingSetting(setting.key); setEditValue(setting.value); }}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                      >
                                        <FiEdit className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {isSuperAdmin && !setting.isDefault && (
                                      deleteConfirmKey === setting.key ? (
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => deleteSettingMutation.mutate(setting.key)}
                                            disabled={deleteSettingMutation.isPending}
                                            className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                                          >
                                            Yes
                                          </button>
                                          <button
                                            onClick={() => setDeleteConfirmKey(null)}
                                            className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                          >
                                            No
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setDeleteConfirmKey(setting.key)}
                                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                          title="Delete setting"
                                        >
                                          <FiTrash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiSettings className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold mb-1">No settings found</p>
              <p className="text-sm text-gray-400">
                {searchTerm ? 'Try adjusting your search' : 'System settings have not been initialized'}
              </p>
              {!searchTerm && isSuperAdmin && (
                <button
                  onClick={() => initializeMutation.mutate()}
                  disabled={initializeMutation.isPending}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {initializeMutation.isPending ? 'Initializing...' : 'Initialize Defaults'}
                </button>
              )}
            </div>
          )
        ) : (
          /* Non-admin view */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiLock className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold mb-1">Admin Access Required</p>
            <p className="text-sm text-gray-400">
              System settings can only be managed by administrators
            </p>
          </div>
        )}

        {/* Create Setting Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
                    <FiPlus className="w-4 h-4" />
                  </div>
                  <h2 className="font-semibold text-gray-900">Add Setting</h2>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Key <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={createForm.key}
                    onChange={(e) => setCreateForm((f) => ({ ...f, key: e.target.value }))}
                    placeholder="e.g. max_login_attempts"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Value <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={createForm.value}
                    onChange={(e) => setCreateForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type</label>
                    <select
                      value={createForm.type}
                      onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                    >
                      <option value="general">General</option>
                      <option value="feature">Feature</option>
                      <option value="payment">Payment</option>
                      <option value="security">Security</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                  <input
                    type="text"
                    value={createForm.description}
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Optional description"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !createForm.key.trim() || !createForm.value.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Setting'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
