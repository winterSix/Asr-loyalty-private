'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardConfigurationService, RewardConfiguration } from '@/services/reward-configuration.service';
import {
  FiGift,
  FiEdit,
  FiPlus,
  FiCheck,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiStar,
  FiTrendingUp,
  FiLayers,
  FiCalendar,
  FiZap,
  FiArrowLeft,
} from '@/utils/icons';
import toast from 'react-hot-toast';

const tierColors: Record<string, { bg: string; text: string; ring: string }> = {
  bronze: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-600/20' },
  silver: { bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-500/20' },
  gold: { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-600/20' },
  platinum: { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-600/20' },
};

export default function RewardConfigPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  const { data: configsRaw, isLoading: configsLoading } = useQuery({
    queryKey: ['reward-configs'],
    queryFn: () => rewardConfigurationService.getAll({ includeInactive: true }),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'LOYALTY_MANAGER'),
  });

  const { data: activeConfig } = useQuery({
    queryKey: ['reward-config-active'],
    queryFn: () => rewardConfigurationService.getActive(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'LOYALTY_MANAGER'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => rewardConfigurationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-configs'] });
      queryClient.invalidateQueries({ queryKey: ['reward-config-active'] });
      toast.success('Configuration updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update configuration');
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['reward-configs'] }),
      queryClient.invalidateQueries({ queryKey: ['reward-config-active'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  if (isLoading || configsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  // Safely extract configs array
  const configs: RewardConfiguration[] = (() => {
    if (!configsRaw) return [];
    if (Array.isArray(configsRaw)) return configsRaw;
    const raw = configsRaw as any;
    return raw?.data || raw?.configs || [];
  })();

  const activeConfigData = activeConfig as any;
  const totalConfigs = configs.length;
  const activeVersion = activeConfigData?.version || '—';
  const rewardRate = activeConfigData?.rewardPercentage ? `${activeConfigData.rewardPercentage}%` : '—';

  const tierMultipliers = activeConfigData?.tierMultipliers || {};
  const multiplierValues = Object.values(tierMultipliers).map(Number).filter(n => !isNaN(n));
  const maxMultiplier = multiplierValues.length > 0 ? Math.max(...multiplierValues) : 0;

  const summaryCards = [
    {
      label: 'Active Version',
      value: `v${activeVersion}`,
      icon: FiCheckCircle,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
    },
    {
      label: 'Reward Rate',
      value: rewardRate,
      icon: FiStar,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
    },
    {
      label: 'Total Configs',
      value: String(totalConfigs),
      icon: FiLayers,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
    },
    {
      label: 'Max Multiplier',
      value: maxMultiplier > 0 ? `${maxMultiplier}x` : '—',
      icon: FiTrendingUp,
      color: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/25',
    },
  ];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25">
              <FiGift className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reward Configuration</h1>
              <p className="text-gray-500 text-sm">Manage reward percentages, tier multipliers, and expiry settings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/rewards')}
              className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium flex items-center gap-2"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Rewards
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
              title="Refresh"
            >
              <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card) => (
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

        {/* Active Configuration */}
        {activeConfigData && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                    <FiZap className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Active Configuration</h2>
                    <p className="text-xs text-gray-500">Version {activeConfigData.version}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Reward Rate */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiStar className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500">Reward Percentage</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{activeConfigData.rewardPercentage}%</p>
                  <p className="text-xs text-gray-400 mt-1">Base reward rate on transactions</p>
                </div>

                {/* Effective Period */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500">Effective Period</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatDate(activeConfigData.effectiveFrom)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Until: {activeConfigData.effectiveUntil ? formatDate(activeConfigData.effectiveUntil) : 'No expiry'}
                  </p>
                </div>

                {/* Tier Multipliers */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiTrendingUp className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500">Tier Multipliers</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(tierMultipliers).map(([tier, multiplier]: [string, any]) => {
                      const tc = tierColors[tier.toLowerCase()] || tierColors.bronze;
                      return (
                        <span key={tier} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${tc.bg} ${tc.text} ring-1 ring-inset ${tc.ring}`}>
                          {tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase()}: {multiplier}x
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tier Expiry Days */}
              {activeConfigData.tierExpiryDays && typeof activeConfigData.tierExpiryDays === 'object' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500">Tier Expiry Days (points validity)</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(activeConfigData.tierExpiryDays).map(([tier, days]: [string, any]) => {
                      const tc = tierColors[tier.toLowerCase()] || tierColors.bronze;
                      return (
                        <span key={tier} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${tc.bg} ${tc.text} ring-1 ring-inset ${tc.ring}`}>
                          {tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase()}: {days ? `${days} days` : 'Never'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Configurations */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">All Configurations</h2>
              <p className="text-xs text-gray-400 mt-0.5">{totalConfigs} configuration{totalConfigs !== 1 ? 's' : ''} total</p>
            </div>
            <button
              onClick={() => toast('Create configuration form coming soon')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              New Config
            </button>
          </div>

          {configs.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {configs.map((config: any) => {
                const isActive = config.isActive;
                const multipliers = config.tierMultipliers || {};

                return (
                  <div key={config.id} className={`p-5 hover:bg-gray-50/60 transition-colors ${isActive ? 'bg-emerald-50/30' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                          isActive
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          v{config.version}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">Version {config.version}</p>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">Created {formatDate(config.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!isActive && (
                          <button
                            onClick={() => updateMutation.mutate({ id: config.id, data: { isActive: true } })}
                            disabled={updateMutation.isPending}
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all"
                            title="Activate this configuration"
                          >
                            <FiCheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => toast('Edit form coming soon')}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
                          title="Edit"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-[10px] font-medium text-gray-400 uppercase">Reward %</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">{config.rewardPercentage}%</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-[10px] font-medium text-gray-400 uppercase">From</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">{formatDate(config.effectiveFrom)}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-[10px] font-medium text-gray-400 uppercase">Until</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          {config.effectiveUntil ? formatDate(config.effectiveUntil) : 'No expiry'}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-[10px] font-medium text-gray-400 uppercase">Multipliers</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {Object.entries(multipliers).length > 0 ? (
                            Object.entries(multipliers).map(([tier, val]: [string, any]) => (
                              <span key={tier} className="text-[10px] font-semibold text-gray-600 bg-gray-200/60 px-1.5 py-0.5 rounded">
                                {tier.charAt(0).toUpperCase()}: {val}x
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiGift className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold mb-1">No configurations found</p>
              <p className="text-sm text-gray-400">Create your first reward configuration to get started</p>
            </div>
          )}
        </div>
      </div>
  );
}
