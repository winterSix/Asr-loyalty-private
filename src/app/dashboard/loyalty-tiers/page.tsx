'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { loyaltyService, LoyaltyTierConfig } from '@/services/loyalty.service';
import {
  FiStar,
  FiEdit,
  FiUsers,
  FiRefreshCw,
  FiDollarSign,
  FiTarget,
  FiAward,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiZap,
  FiArrowRight,
} from '@/utils/icons';

const tierMeta: Record<string, { gradient: string; shadow: string; bg: string; text: string; ring: string; icon: string; label: string }> = {
  BRONZE: {
    gradient: 'from-amber-600 to-amber-800',
    shadow: 'shadow-amber-600/25',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-600/20',
    icon: '🥉',
    label: 'Starter tier',
  },
  SILVER: {
    gradient: 'from-gray-400 to-gray-600',
    shadow: 'shadow-gray-400/25',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    ring: 'ring-gray-500/20',
    icon: '🥈',
    label: 'Regular tier',
  },
  GOLD: {
    gradient: 'from-yellow-400 to-amber-500',
    shadow: 'shadow-yellow-500/25',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    ring: 'ring-yellow-600/20',
    icon: '🥇',
    label: 'Premium tier',
  },
  PLATINUM: {
    gradient: 'from-violet-500 to-indigo-700',
    shadow: 'shadow-violet-500/25',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    ring: 'ring-violet-600/20',
    icon: '💎',
    label: 'Elite tier',
  },
};

const getTierStyle = (tier: string) => tierMeta[tier] || tierMeta.BRONZE;

export default function LoyaltyTiersPage() {
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

  const { data: tiersRaw, isLoading: tiersLoading } = useQuery({
    queryKey: ['loyalty-tier-configs'],
    queryFn: () => loyaltyService.getAllTierConfigs(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'LOYALTY_MANAGER'),
  });

  const { data: tierStats } = useQuery({
    queryKey: ['loyalty-tier-stats'],
    queryFn: () => loyaltyService.getTierStats(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'LOYALTY_MANAGER'),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['loyalty-tier-configs'] }),
      queryClient.invalidateQueries({ queryKey: ['loyalty-tier-stats'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const initializeMutation = useMutation({
    mutationFn: () => loyaltyService.initializeDefaultTiers(),
    onSuccess: () => {
      toast.success('Default tier configurations created!');
      queryClient.invalidateQueries({ queryKey: ['loyalty-tier-configs'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-tier-stats'] });
    },
    onError: () => {
      toast.error('Failed to initialize tiers');
    },
  });

  // Safely extract array from response — backend returns { success, tiers: [...] }
  const orderedTiers = useMemo(() => {
    if (!tiersRaw) return [];
    if (Array.isArray(tiersRaw)) {
      const order = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
      return [...tiersRaw].sort((a: any, b: any) => order.indexOf(a.tier) - order.indexOf(b.tier));
    }
    const raw = tiersRaw as any;
    let configs = raw?.tiers || raw?.data || raw?.configs || null;
    if (!configs && typeof raw === 'object') {
      for (const key of Object.keys(raw)) {
        if (Array.isArray(raw[key])) { configs = raw[key]; break; }
      }
    }
    if (!Array.isArray(configs)) return [];
    const order = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    return [...configs].sort((a: any, b: any) => order.indexOf(a.tier) - order.indexOf(b.tier));
  }, [tiersRaw]);

  // Parse tier stats — backend returns { success, stats: { distribution: [{ currentTier, _count: { currentTier: N } }] } }
  const tierDistribution = useMemo(() => {
    if (!tierStats) return {};
    const statsObj = (tierStats as any)?.stats || tierStats;
    const dist = statsObj?.distribution || statsObj?.tierDistribution || [];
    const map: Record<string, number> = {};
    if (Array.isArray(dist)) {
      dist.forEach((d: any) => {
        const tier = d.tier || d.currentTier;
        const count = d.count || d._count?.currentTier || d._count || 0;
        if (tier) map[tier] = Number(count);
      });
    } else if (typeof dist === 'object') {
      Object.entries(dist).forEach(([tier, count]) => { map[tier] = Number(count) || 0; });
    }
    return map;
  }, [tierStats]);

  const totalUsersInTiers = Object.values(tierDistribution).reduce((sum: number, c) => sum + (Number(c) || 0), 0);
  const activeTiers = orderedTiers.filter(t => t.isActive).length;

  if (isLoading || tiersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';
  const canEdit = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'LOYALTY_MANAGER';

  const benefitLabels: Record<string, string> = {
    cashback: 'Cashback',
    prioritySupport: 'Priority Support',
    exclusiveOffers: 'Exclusive Offers',
    freeTransfers: 'Free Transfers',
    personalManager: 'Personal Manager',
  };

  const parseBenefits = (benefits: any): { label: string; value: string; active: boolean }[] => {
    if (!benefits || typeof benefits !== 'object' || Array.isArray(benefits)) return [];
    return Object.entries(benefits).map(([k, v]) => {
      const label = benefitLabels[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      if (typeof v === 'boolean') return { label, value: '', active: v };
      if (typeof v === 'number') return { label, value: v > 0 ? `${v}/mo` : '', active: v > 0 };
      return { label, value: String(v), active: true };
    });
  };

  return (
    <DashboardLayout role={role}>
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
              <FiAward className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Loyalty Tiers</h1>
              <p className="text-gray-500 text-sm">Manage tier configurations, requirements, and benefits</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/rewards')}
              className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium flex items-center gap-2"
            >
              <FiStar className="w-4 h-4" />
              Rewards
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
              <FiAward className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Total Tiers</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{orderedTiers.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Active Tiers</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{activeTiers}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <FiUsers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Total Users in Tiers</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{totalUsersInTiers.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
              <FiTrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Highest Multiplier</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">
                {orderedTiers.length > 0
                  ? `${Math.max(...orderedTiers.map(t => parseFloat(t.rewardMultiplier))).toFixed(1)}x`
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Tier Cards */}
        {orderedTiers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orderedTiers.map((tier) => {
              const style = getTierStyle(tier.tier);
              const userCount = Number(tierDistribution[tier.tier]) || 0;
              const percentage = totalUsersInTiers > 0 ? Math.round((userCount / totalUsersInTiers) * 100) : 0;
              const benefits = parseBenefits(tier.benefits);

              return (
                <div
                  key={tier.id || tier.tier}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
                >
                  {/* Tier Header */}
                  <div className={`bg-gradient-to-br ${style.gradient} p-6 relative overflow-hidden`}>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative z-10 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="text-3xl">{style.icon}</span>
                          <div>
                            <h3 className="text-2xl font-bold text-white">{tier.tier}</h3>
                            <p className="text-white/70 text-sm">{style.label}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                          <div className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                            <p className="text-white/80 text-xs">Multiplier</p>
                            <p className="text-white font-bold text-lg">{parseFloat(tier.rewardMultiplier).toFixed(1)}x</p>
                          </div>
                          <div className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                            <p className="text-white/80 text-xs">Users</p>
                            <p className="text-white font-bold text-lg">{userCount}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          tier.isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-black/20 text-white/70'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tier.isActive ? 'bg-green-300' : 'bg-white/40'}`}></span>
                          {tier.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {canEdit && (
                          <button
                            onClick={() => router.push(`/dashboard/loyalty-tiers/${tier.tier}`)}
                            className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-all"
                            title="Edit tier"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tier Body */}
                  <div className="p-6">
                    {/* User Distribution Bar */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-gray-500">User Distribution</p>
                        <p className="text-xs font-semibold text-gray-700">{percentage}%</p>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${style.gradient} transition-all duration-700`}
                          style={{ width: `${Math.max(percentage, 3)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="p-3.5 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-1">
                          <FiDollarSign className="w-3.5 h-3.5 text-gray-400" />
                          <p className="text-xs font-medium text-gray-500">Min Spend</p>
                        </div>
                        <p className="font-bold text-gray-900">₦{parseFloat(tier.minSpend).toLocaleString()}</p>
                      </div>
                      <div className="p-3.5 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-1">
                          <FiTarget className="w-3.5 h-3.5 text-gray-400" />
                          <p className="text-xs font-medium text-gray-500">Min Transactions</p>
                        </div>
                        <p className="font-bold text-gray-900">{tier.minTransactions}</p>
                      </div>
                    </div>

                    {/* Benefits */}
                    {benefits.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Benefits</p>
                        <div className="flex flex-wrap gap-2">
                          {benefits.map((b, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
                                b.active
                                  ? `${style.bg} ${style.text} ${style.ring}`
                                  : 'bg-gray-50 text-gray-400 ring-gray-200'
                              }`}
                            >
                              {b.active ? <FiCheckCircle className="w-3 h-3" /> : <FiXCircle className="w-3 h-3" />}
                              {b.label}{b.value ? ` ${b.value}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1">
                        <p className="text-xs text-gray-400 italic">No benefits configured for this tier</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiAward className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold text-lg mb-1">No loyalty tiers configured</p>
              <p className="text-sm text-gray-400 mb-5">Initialize the default BRONZE, SILVER, GOLD, and PLATINUM tiers to get started</p>
              {canEdit && (
                <button
                  onClick={() => initializeMutation.mutate()}
                  disabled={initializeMutation.isPending}
                  className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {initializeMutation.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Initializing...
                    </>
                  ) : (
                    <>
                      <FiAward className="w-4 h-4" />
                      Initialize Default Tiers
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
