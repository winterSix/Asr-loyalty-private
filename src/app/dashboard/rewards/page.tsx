'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rewardService } from '@/services/reward.service';
import { rewardConfigurationService } from '@/services/reward-configuration.service';
import { loyaltyService, LoyaltyTierConfig } from '@/services/loyalty.service';
import { adminService } from '@/services/admin.service';
import {
  FiGift,
  FiRedeem,
  FiStar,
  FiUsers,
  FiTrendingUp,
  FiRefreshCw,
  FiSettings,
  FiArrowRight,
  FiCheckCircle,
  FiDollarSign,
  FiAward,
  FiEye,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiTarget,
  FiZap,
} from '@/utils/icons';

// ─── Tier color/icon map ────────────────────────────────────────────────
const tierMeta: Record<string, { gradient: string; shadow: string; bg: string; text: string; ring: string; icon: string }> = {
  BRONZE: {
    gradient: 'from-amber-600 to-amber-800',
    shadow: 'shadow-amber-600/25',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    ring: 'ring-amber-600/20 dark:ring-amber-400/20',
    icon: '🥉',
  },
  SILVER: {
    gradient: 'from-gray-400 to-gray-600',
    shadow: 'shadow-gray-400/25',
    bg: 'bg-gray-100 dark:bg-gray-700/50',
    text: 'text-gray-700 dark:text-gray-300',
    ring: 'ring-gray-500/20 dark:ring-gray-400/20',
    icon: '🥈',
  },
  GOLD: {
    gradient: 'from-yellow-400 to-amber-500',
    shadow: 'shadow-yellow-500/25',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-400',
    ring: 'ring-yellow-600/20 dark:ring-yellow-400/20',
    icon: '🥇',
  },
  PLATINUM: {
    gradient: 'from-violet-500 to-indigo-700',
    shadow: 'shadow-violet-500/25',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    text: 'text-violet-700 dark:text-violet-400',
    ring: 'ring-violet-600/20 dark:ring-violet-400/20',
    icon: '💎',
  },
};

const getTierStyle = (tier: string) => tierMeta[tier] || tierMeta.BRONZE;

// ─── Admin View ─────────────────────────────────────────────────────────
function AdminRewardsView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const usersLimit = 10;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(usersSearch);
      setUsersPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [usersSearch]);

  // Queries
  const { data: activeConfig } = useQuery({
    queryKey: ['reward-config', 'active'],
    queryFn: () => rewardConfigurationService.getActiveRewardConfiguration(),
  });

  const { data: tierConfigs } = useQuery({
    queryKey: ['loyalty-tier-configs'],
    queryFn: () => loyaltyService.getAllTierConfigs(),
  });

  const { data: tierStats } = useQuery({
    queryKey: ['loyalty-tier-stats'],
    queryFn: () => loyaltyService.getTierStats(),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', 'rewards', { page: usersPage, limit: usersLimit, search: debouncedSearch }],
    queryFn: () => adminService.getUsers({
      page: usersPage,
      limit: usersLimit,
      ...(debouncedSearch && { search: debouncedSearch }),
    }),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['reward-config'] }),
      queryClient.invalidateQueries({ queryKey: ['loyalty-tier'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'rewards'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const users = usersData?.data || [];
  const usersTotal = usersData?.total || 0;
  const usersTotalPages = Math.ceil(usersTotal / usersLimit);

  // Parse tier stats — backend returns { success, stats: { distribution: [{ currentTier, _count: { currentTier: N } }] } }
  const tierDistribution = useMemo(() => {
    if (!tierStats) return [];
    const statsObj = (tierStats as any)?.stats || tierStats;
    const dist = statsObj?.distribution || statsObj?.tierDistribution || [];
    if (Array.isArray(dist)) {
      return dist.map((d: any) => ({
        tier: d.tier || d.currentTier,
        count: d.count || d._count?.currentTier || d._count || 0,
      }));
    }
    if (typeof dist === 'object') {
      return Object.entries(dist).map(([tier, count]) => ({ tier, count: Number(count) || 0 }));
    }
    return [];
  }, [tierStats]);

  const totalUsersInTiers = tierDistribution.reduce((sum: number, d: any) => sum + (Number(d.count) || 0), 0);

  // Sort tier configs — backend returns { success, tiers: [...] }
  const orderedTiers = useMemo(() => {
    if (!tierConfigs) return [];
    const configs = Array.isArray(tierConfigs)
      ? tierConfigs
      : (tierConfigs as any)?.tiers || (tierConfigs as any)?.data || (tierConfigs as any)?.configs || [];
    if (!Array.isArray(configs)) return [];
    const order = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    return [...configs].sort((a: LoyaltyTierConfig, b: LoyaltyTierConfig) => order.indexOf(a.tier) - order.indexOf(b.tier));
  }, [tierConfigs]);

  const getRewardBalance = (wallets?: Array<{ balance: string; currency: string; type?: string }>) => {
    if (!wallets || wallets.length === 0) return 0;
    const reward = wallets.find(w => w.type === 'REWARD');
    return parseFloat(reward?.balance || '0');
  };

  const getMainBalance = (wallets?: Array<{ balance: string; currency: string; type?: string }>) => {
    if (!wallets || wallets.length === 0) return 0;
    const main = wallets.find(w => w.type !== 'REWARD') || wallets[0];
    return parseFloat(main?.balance || '0');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
            <FiGift className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887]">Rewards Overview</h1>
            <p className="text-gray-500 text-sm">Manage reward configurations and track loyalty performance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/dashboard/reward-config')}
            className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium flex items-center gap-2 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/50"
          >
            <FiSettings className="w-4 h-4" />
            Reward Config
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/50"
            title="Refresh"
          >
            <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 dark:bg-gray-800/50 dark:border-gray-700/50">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
            <FiZap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Reward Rate</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {activeConfig ? `${parseFloat(activeConfig.rewardPercentage)}%` : '—'}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 dark:bg-gray-800/50 dark:border-gray-700/50">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <FiUsers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Users in Tiers</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{totalUsersInTiers.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 dark:bg-gray-800/50 dark:border-gray-700/50">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
            <FiAward className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tier Levels</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{orderedTiers.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 dark:bg-gray-800/50 dark:border-gray-700/50">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Config Status</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{activeConfig ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Active Configuration */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-800/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FiSettings className="w-5 h-5 text-primary" />
              Active Configuration
            </h2>
            {activeConfig && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active
              </span>
            )}
          </div>
          {activeConfig ? (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/10">
                <p className="text-xs font-medium text-gray-500 mb-1">Base Reward Percentage</p>
                <p className="text-3xl font-bold text-primary">{parseFloat(activeConfig.rewardPercentage)}%</p>
                <p className="text-xs text-gray-500 mt-1">of each transaction value</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl dark:bg-gray-700/50">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Tier Multipliers</p>
                {activeConfig.tierMultipliers && typeof activeConfig.tierMultipliers === 'object' ? (
                  <div className="space-y-2">
                    {Object.entries(activeConfig.tierMultipliers).map(([tier, multiplier]) => {
                      const style = getTierStyle(tier);
                      return (
                        <div key={tier} className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text} ring-1 ring-inset ${style.ring}`}>
                            {style.icon} {tier}
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{parseFloat(String(multiplier))}x</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No multipliers configured</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl dark:bg-gray-700/50">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Effective From</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                    {new Date(activeConfig.effectiveFrom).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl dark:bg-gray-700/50">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Version</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">v{activeConfig.version}</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/dashboard/reward-config')}
                className="w-full text-sm text-primary hover:text-primary-light font-semibold flex items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-primary/5 transition-all"
              >
                Manage Configurations <FiArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 dark:bg-gray-700">
                <FiSettings className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold text-sm mb-1 dark:text-gray-100">No active configuration</p>
              <p className="text-xs text-gray-400 mb-3">Set up reward rules to get started</p>
              <button
                onClick={() => router.push('/dashboard/reward-config')}
                className="text-sm text-primary font-semibold hover:text-primary-light transition-colors"
              >
                Create Configuration
              </button>
            </div>
          )}
        </div>

        {/* Tier Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-800/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FiAward className="w-5 h-5 text-primary" />
              Loyalty Tiers
            </h2>
            <button
              onClick={() => router.push('/dashboard/loyalty-tiers')}
              className="text-sm text-primary hover:text-primary-light font-semibold flex items-center gap-1 transition-colors"
            >
              Manage <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {orderedTiers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {orderedTiers.map((config) => {
                const style = getTierStyle(config.tier);
                const dist = tierDistribution.find((d: any) => d.tier === config.tier);
                const count = dist?.count || (dist as any)?._count || 0;
                const percentage = totalUsersInTiers > 0 ? Math.round((count / totalUsersInTiers) * 100) : 0;

                return (
                  <div key={config.tier} className="p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.gradient} ${style.shadow} shadow-lg flex items-center justify-center text-lg`}>
                          {style.icon}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100">{config.tier}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{parseFloat(config.rewardMultiplier)}x multiplier</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text} ring-1 ring-inset ${style.ring}`}>
                        {count} users
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-700">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${style.gradient} transition-all duration-500`}
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{percentage}% of users</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <FiDollarSign className="w-3 h-3" />
                        <span>Min ₦{parseFloat(config.minSpend).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiTarget className="w-3 h-3" />
                        <span>{config.minTransactions} txns</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 dark:bg-gray-700">
                <FiAward className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold mb-1 dark:text-gray-100">No tier configurations</p>
              <p className="text-sm text-gray-400">Set up loyalty tiers to categorize users</p>
            </div>
          )}
        </div>
      </div>

      {/* User Reward Balances Table */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiStar className="w-5 h-5 text-primary" />
            User Reward Balances
          </h2>
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={usersSearch}
              onChange={(e) => setUsersSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        {usersLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : users.length > 0 ? (
          <>
            <div className="overflow-x-auto min-w-0">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap min-w-[180px]">User</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap min-w-[110px]">Status</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap min-w-[130px]">Main Wallet</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap min-w-[140px]">Reward Points</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap min-w-[100px]">Tier</th>
                    <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider whitespace-nowrap min-w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {users.map((u: any) => {
                    const rewardBal = getRewardBalance(u.wallets);
                    const mainBal = getMainBalance(u.wallets);
                    const tier = u.loyaltyTier || 'BRONZE';
                    const style = getTierStyle(tier);

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.04] transition-colors group">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0">
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-[#F1F5F9] whitespace-nowrap">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-gray-500 whitespace-nowrap">{u.email || u.phoneNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                              : u.status === 'SUSPENDED'
                              ? 'bg-red-50 text-red-700 ring-red-600/20'
                              : 'bg-gray-50 text-gray-700 ring-gray-600/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'ACTIVE' ? 'bg-emerald-500' : u.status === 'SUSPENDED' ? 'bg-red-500' : 'bg-gray-500'
                            }`}></span>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <p className="font-bold text-gray-900 whitespace-nowrap">₦{mainBal.toLocaleString()}</p>
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <p className="font-bold text-amber-600">₦{rewardBal.toLocaleString()}</p>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${style.bg} ${style.text} ring-1 ring-inset ${style.ring}`}>
                            {style.icon} {tier}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <button
                            onClick={() => router.push(`/dashboard/users/${u.id}`)}
                            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
                            title="View user"
                          >
                            <FiEye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {users.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing <span className="font-medium text-gray-700">{(usersPage - 1) * usersLimit + 1}</span>–<span className="font-medium text-gray-700">{Math.min(usersPage * usersLimit, usersTotal)}</span> of <span className="font-medium text-gray-700">{usersTotal}</span> users
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                    disabled={usersPage === 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 px-3 min-w-[100px] text-center">
                    Page {usersPage} of {usersTotalPages}
                  </span>
                  <button
                    onClick={() => setUsersPage(p => Math.min(usersTotalPages, p + 1))}
                    disabled={usersPage === usersTotalPages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiUsers className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold mb-1">No users found</p>
            <p className="text-sm text-gray-400">
              {debouncedSearch ? 'Try adjusting your search query' : 'No users in the system yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Customer View ──────────────────────────────────────────────────────
function CustomerRewardsView({ userId }: { userId: string }) {
  const router = useRouter();

  const { data: rewardDetails, isLoading: rewardsLoading } = useQuery({
    queryKey: ['reward-details', userId],
    queryFn: () => rewardService.getUserRewardDetails(userId),
    enabled: !!userId,
  });

  if (rewardsLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalRewards = parseFloat(rewardDetails?.totalRewards || '0');
  const availableRewards = parseFloat(rewardDetails?.availableRewards || '0');
  const redeemedRewards = parseFloat(rewardDetails?.redeemedRewards || '0');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3.5 mb-6">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
          <FiGift className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887]">My Rewards</h1>
          <p className="text-gray-500 text-sm">View and redeem your reward points</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm mb-1">Total Rewards</p>
              <p className="text-3xl font-bold">{totalRewards.toLocaleString()} pts</p>
            </div>
            <div className="p-3 rounded-xl bg-white/20">
              <FiGift className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500">Available Rewards</p>
            <div className="p-2 rounded-lg bg-emerald-50">
              <FiStar className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{availableRewards.toLocaleString()} pts</p>
          <p className="text-xs text-gray-400 mt-1">Ready to redeem</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500">Redeemed Rewards</p>
            <div className="p-2 rounded-lg bg-primary/10">
              <FiRedeem className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold text-primary">{redeemedRewards.toLocaleString()} pts</p>
          <p className="text-xs text-gray-400 mt-1">Already used</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reward Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiTrendingUp className="w-5 h-5 text-primary" />
                Reward Details
              </h2>
              {rewardDetails?.currentTier && (
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getTierStyle(rewardDetails.currentTier).bg} ${getTierStyle(rewardDetails.currentTier).text} ring-1 ring-inset ${getTierStyle(rewardDetails.currentTier).ring}`}>
                  {getTierStyle(rewardDetails.currentTier).icon} {rewardDetails.currentTier}
                </span>
              )}
            </div>
            {rewardDetails ? (
              <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {availableRewards.toLocaleString()} pts Available
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Tier: {rewardDetails.currentTier} &bull; Multiplier: {parseFloat(rewardDetails.tierMultiplier).toFixed(1)}x
                    </p>
                    {rewardDetails.benefits && typeof rewardDetails.benefits === 'object' && Object.keys(rewardDetails.benefits).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {Object.entries(rewardDetails.benefits).map(([key, val]) => (
                          <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            <FiCheckCircle className="w-3 h-3" />
                            {key}: {String(val)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/rewards/redeem')}
                    className="btn-primary flex items-center gap-2 whitespace-nowrap"
                  >
                    <FiRedeem className="w-4 h-4" />
                    Redeem
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FiGift className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-900 font-semibold mb-1">No reward details available</p>
                <p className="text-sm text-gray-400">Start earning rewards by making transactions</p>
              </div>
            )}
          </div>
        </div>

        {/* Reward Summary */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiGift className="w-5 h-5 text-primary" />
              Summary
            </h2>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Total Rewards</p>
                    <p className="text-xs text-gray-500 mt-0.5">All time earned</p>
                  </div>
                  <p className="font-bold text-lg text-gray-900">{totalRewards.toLocaleString()}</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Available</p>
                    <p className="text-xs text-gray-500 mt-0.5">Ready to redeem</p>
                  </div>
                  <p className="font-bold text-lg text-emerald-600">{availableRewards.toLocaleString()}</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Redeemed</p>
                    <p className="text-xs text-gray-500 mt-0.5">Already used</p>
                  </div>
                  <p className="font-bold text-lg text-primary">{redeemedRewards.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────
export default function RewardsPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'LOYALTY_MANAGER' || role === 'FINANCE_MANAGER';

  return isAdmin ? (
    <AdminRewardsView />
  ) : (
    <CustomerRewardsView userId={user?.id || ''} />
  );
}
