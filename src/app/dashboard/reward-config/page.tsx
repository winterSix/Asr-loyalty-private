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
  FiX,
} from '@/utils/icons';
import toast from 'react-hot-toast';

const tierColors: Record<string, { bg: string; darkBg: string; text: string; ring: string }> = {
  bronze: { bg: 'bg-amber-50', darkBg: 'dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', ring: 'ring-amber-600/20' },
  silver: { bg: 'bg-gray-100', darkBg: 'dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-300', ring: 'ring-gray-500/20' },
  gold: { bg: 'bg-yellow-50', darkBg: 'dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', ring: 'ring-yellow-600/20' },
  platinum: { bg: 'bg-violet-50', darkBg: 'dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', ring: 'ring-violet-600/20' },
};

export default function RewardConfigPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);

  const emptyCreateForm = () => ({
    rewardPercentage: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveUntil: '',
    tierMultipliers: { bronze: '', silver: '', gold: '', platinum: '' },
  });
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(emptyCreateForm());

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const { data: configsRaw, isLoading: configsLoading } = useQuery({
    queryKey: ['reward-configs'],
    queryFn: () => rewardConfigurationService.getAll({ includeInactive: true }),
    enabled: !isLoading && !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'OTHERS'),
  });

  const { data: activeConfig } = useQuery({
    queryKey: ['reward-config-active'],
    queryFn: () => rewardConfigurationService.getActive(),
    enabled: !isLoading && !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'OTHERS'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => rewardConfigurationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-configs'] });
      queryClient.invalidateQueries({ queryKey: ['reward-config-active'] });
      toast.success('Configuration updated successfully');
      router.push('/dashboard/rewards');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update configuration');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => rewardConfigurationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-configs'] });
      queryClient.invalidateQueries({ queryKey: ['reward-config-active'] });
      toast.success('Configuration created successfully');
      setShowCreateModal(false);
      setCreateForm(emptyCreateForm());
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create configuration');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rewardPct = parseFloat(createForm.rewardPercentage);
    if (isNaN(rewardPct) || rewardPct <= 0 || rewardPct > 100) {
      toast.error('Reward percentage must be between 0 and 100');
      return;
    }
    // Build tier multipliers — only include tiers the user filled in
    const tierMultipliers: Record<string, number> = {};
    for (const [tier, val] of Object.entries(createForm.tierMultipliers)) {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        tierMultipliers[tier] = num;
      }
    }
    createMutation.mutate({
      rewardPercentage: rewardPct,
      effectiveFrom: createForm.effectiveFrom || undefined,
      effectiveUntil: createForm.effectiveUntil || undefined,
      tierMultipliers: Object.keys(tierMultipliers).length > 0 ? tierMultipliers : undefined,
    });
  };

  const openEditModal = (config: any) => {
    const multipliers = config.tierMultipliers || {};
    setEditForm({
      rewardPercentage: String(config.rewardPercentage || ''),
      effectiveFrom: config.effectiveFrom ? config.effectiveFrom.split('T')[0] : '',
      effectiveUntil: config.effectiveUntil ? config.effectiveUntil.split('T')[0] : '',
      tierMultipliers: {
        bronze: multipliers.bronze != null ? String(multipliers.bronze) : '',
        silver: multipliers.silver != null ? String(multipliers.silver) : '',
        gold: multipliers.gold != null ? String(multipliers.gold) : '',
        platinum: multipliers.platinum != null ? String(multipliers.platinum) : '',
      },
    });
    setEditingConfigId(config.id);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfigId) return;
    const rewardPct = parseFloat(editForm.rewardPercentage);
    if (isNaN(rewardPct) || rewardPct <= 0 || rewardPct > 100) {
      toast.error('Reward percentage must be between 0 and 100');
      return;
    }
    const tierMultipliers: Record<string, number> = {};
    for (const [tier, val] of Object.entries(editForm.tierMultipliers)) {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) tierMultipliers[tier] = num;
    }
    updateMutation.mutate({
      id: editingConfigId,
      data: {
        rewardPercentage: rewardPct,
        effectiveFrom: editForm.effectiveFrom || undefined,
        effectiveUntil: editForm.effectiveUntil || undefined,
        tierMultipliers: Object.keys(tierMultipliers).length > 0 ? tierMultipliers : undefined,
      },
    }, {
      onSuccess: () => { setShowEditModal(false); setEditingConfigId(null); },
    });
  };

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
    <>
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25">
              <FiGift className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887]">Reward Configuration</h1>
              <p className="text-gray-500 text-sm">Manage reward percentages, tier multipliers, and expiry settings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/rewards')}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 transition-all text-sm font-medium flex items-center gap-2"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Rewards
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 transition-all disabled:opacity-50"
              title="Refresh"
            >
              <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card) => (
            <div key={card.label} className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg ${card.shadow}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Active Configuration */}
        {activeConfigData && (
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                    <FiZap className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">Active Configuration</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Version {activeConfigData.version}</p>
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
                <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiStar className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Reward Percentage</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{activeConfigData.rewardPercentage}%</p>
                  <p className="text-xs text-gray-400 mt-1">Base reward rate on transactions</p>
                </div>

                {/* Effective Period */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Effective Period</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatDate(activeConfigData.effectiveFrom)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Until: {activeConfigData.effectiveUntil ? formatDate(activeConfigData.effectiveUntil) : 'No expiry'}
                  </p>
                </div>

                {/* Tier Multipliers */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiTrendingUp className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tier Multipliers</p>
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
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tier Expiry Days (points validity)</p>
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
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-700/20 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">All Configurations</h2>
              <p className="text-xs text-gray-400 mt-0.5">{totalConfigs} configuration{totalConfigs !== 1 ? 's' : ''} total</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
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
                  <div key={config.id} className={`p-5 transition-colors ${isActive ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : 'hover:bg-gray-50/60 dark:hover:bg-gray-700/20'}`}>
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
                            <p className="font-semibold text-gray-900 dark:text-gray-100">Version {config.version}</p>
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
                          onClick={() => openEditModal(config)}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
                          title="Edit"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
                        <p className="text-[10px] font-medium text-gray-400 uppercase">Reward %</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">{config.rewardPercentage}%</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
                        <p className="text-[10px] font-medium text-gray-400 uppercase">From</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">{formatDate(config.effectiveFrom)}</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
                        <p className="text-[10px] font-medium text-gray-400 uppercase">Until</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                          {config.effectiveUntil ? formatDate(config.effectiveUntil) : 'No expiry'}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
                        <p className="text-[10px] font-medium text-gray-400 uppercase">Multipliers</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {Object.entries(multipliers).length > 0 ? (
                            Object.entries(multipliers).map(([tier, val]: [string, any]) => {
                              const tc = tierColors[tier.toLowerCase() as keyof typeof tierColors] || tierColors.bronze;
                              return (
                                <span key={tier} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${tc.bg} ${tc.darkBg} ${tc.text}`}>
                                  {tier.charAt(0).toUpperCase()}: {val}x
                                </span>
                              );
                            })
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
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiGift className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 dark:text-gray-100 font-semibold mb-1">No configurations found</p>
              <p className="text-sm text-gray-400">Create your first reward configuration to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Configuration Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25">
                  <FiGift className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">New Configuration</h2>
                  <p className="text-xs text-gray-400">Set reward rules for this configuration</p>
                </div>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setCreateForm(emptyCreateForm()); }}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              {/* Reward Percentage */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Reward Percentage <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    placeholder="e.g. 2.5"
                    value={createForm.rewardPercentage}
                    onChange={(e) => setCreateForm(f => ({ ...f, rewardPercentage: e.target.value }))}
                    required
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-gray-900 dark:text-gray-100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Percentage of transaction amount awarded as loyalty points</p>
              </div>

              {/* Tier Multipliers */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tier Multipliers
                  <span className="text-xs text-gray-400 font-normal ml-2">(optional — leave blank to skip a tier)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['bronze', 'silver', 'gold', 'platinum'] as const).map((tier) => {
                    const tc = tierColors[tier];
                    return (
                      <div key={tier}>
                        <label className={`text-xs font-semibold uppercase tracking-wide mb-1 block ${tc.text}`}>
                          {tier}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="e.g. 1.5"
                            value={createForm.tierMultipliers[tier]}
                            onChange={(e) => setCreateForm(f => ({
                              ...f,
                              tierMultipliers: { ...f.tierMultipliers, [tier]: e.target.value },
                            }))}
                            className={`w-full pl-3 pr-8 py-2 rounded-xl text-sm border outline-none transition-all ${tc.bg} ${tc.darkBg} ${tc.ring} ring-1 ring-inset focus:ring-2 focus:border-primary text-gray-900 dark:text-gray-100 placeholder:text-gray-400`}
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">×</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Effective Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Effective From</label>
                  <input
                    type="date"
                    value={createForm.effectiveFrom}
                    onChange={(e) => setCreateForm(f => ({ ...f, effectiveFrom: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Effective Until
                    <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={createForm.effectiveUntil}
                    onChange={(e) => setCreateForm(f => ({ ...f, effectiveUntil: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setCreateForm(emptyCreateForm()); }}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-pink-500/25 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {createMutation.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      Create Config
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Configuration Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary-light text-white shadow-lg shadow-primary/25">
                  <FiEdit className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Edit Configuration</h2>
                  <p className="text-xs text-gray-400">Update reward rules for this configuration</p>
                </div>
              </div>
              <button
                onClick={() => { setShowEditModal(false); setEditingConfigId(null); }}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              {/* Reward Percentage */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Reward Percentage <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    placeholder="e.g. 2.5"
                    value={editForm.rewardPercentage}
                    onChange={(e) => setEditForm(f => ({ ...f, rewardPercentage: e.target.value }))}
                    required
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-gray-900 dark:text-gray-100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
                </div>
              </div>

              {/* Tier Multipliers */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tier Multipliers
                  <span className="text-xs text-gray-400 font-normal ml-2">(optional — leave blank to skip a tier)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['bronze', 'silver', 'gold', 'platinum'] as const).map((tier) => {
                    const tc = tierColors[tier];
                    return (
                      <div key={tier}>
                        <label className={`text-xs font-semibold uppercase tracking-wide mb-1 block ${tc.text}`}>{tier}</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="e.g. 1.5"
                            value={editForm.tierMultipliers[tier]}
                            onChange={(e) => setEditForm(f => ({
                              ...f,
                              tierMultipliers: { ...f.tierMultipliers, [tier]: e.target.value },
                            }))}
                            className={`w-full pl-3 pr-8 py-2 rounded-xl text-sm border outline-none transition-all ${tc.bg} ${tc.darkBg} ${tc.ring} ring-1 ring-inset focus:ring-2 focus:border-primary text-gray-900 dark:text-gray-100 placeholder:text-gray-400`}
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">×</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Effective Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Effective From</label>
                  <input
                    type="date"
                    value={editForm.effectiveFrom}
                    onChange={(e) => setEditForm(f => ({ ...f, effectiveFrom: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Effective Until
                    <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={editForm.effectiveUntil}
                    onChange={(e) => setEditForm(f => ({ ...f, effectiveUntil: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingConfigId(null); }}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {updateMutation.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
