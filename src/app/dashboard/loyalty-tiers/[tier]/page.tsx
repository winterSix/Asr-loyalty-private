'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { loyaltyService } from '@/services/loyalty.service';
import {
  FiArrowLeft,
  FiSave,
  FiAward,
  FiDollarSign,
  FiTarget,
  FiStar,
  FiCheckCircle,
  FiToggleLeft,
  FiToggleRight,
  FiZap,
  FiRefreshCw,
} from '@/utils/icons';

const tierMeta: Record<string, { gradient: string; shadow: string; bg: string; text: string; icon: string; label: string }> = {
  BRONZE: { gradient: 'from-amber-600 to-amber-800', shadow: 'shadow-amber-600/25', bg: 'bg-amber-50', text: 'text-amber-700', icon: '🥉', label: 'Starter tier' },
  SILVER: { gradient: 'from-gray-400 to-gray-600', shadow: 'shadow-gray-400/25', bg: 'bg-gray-100', text: 'text-gray-700', icon: '🥈', label: 'Regular tier' },
  GOLD: { gradient: 'from-yellow-400 to-amber-500', shadow: 'shadow-yellow-500/25', bg: 'bg-yellow-50', text: 'text-yellow-700', icon: '🥇', label: 'Premium tier' },
  PLATINUM: { gradient: 'from-violet-500 to-indigo-700', shadow: 'shadow-violet-500/25', bg: 'bg-violet-50', text: 'text-violet-700', icon: '💎', label: 'Elite tier' },
};

export default function EditTierPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const tierName = (params.tier as string)?.toUpperCase();

  const [minSpend, setMinSpend] = useState('');
  const [minTransactions, setMinTransactions] = useState('');
  const [rewardMultiplier, setRewardMultiplier] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [color, setColor] = useState('');

  // Benefits
  const [cashback, setCashback] = useState('');
  const [freeTransfers, setFreeTransfers] = useState('');
  const [prioritySupport, setPrioritySupport] = useState(false);
  const [exclusiveOffers, setExclusiveOffers] = useState(false);
  const [personalManager, setPersonalManager] = useState(false);

  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const { data: tierRaw, isLoading: tierLoading } = useQuery({
    queryKey: ['loyalty-tier-config', tierName],
    queryFn: () => loyaltyService.getTierConfig(tierName),
    enabled: !isLoading && !!user && !!tierName && ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].includes(tierName),
  });

  // Extract tier config from response
  const tierConfig = (() => {
    if (!tierRaw) return null;
    const raw = tierRaw as any;
    if (raw.tier && raw.minSpend !== undefined) return raw;
    return raw?.tierConfig || raw?.data || raw?.config || null;
  })();

  // Populate form when data loads
  useEffect(() => {
    if (tierConfig && !hasLoaded) {
      setMinSpend(String(parseFloat(tierConfig.minSpend || '0')));
      setMinTransactions(String(tierConfig.minTransactions || 0));
      setRewardMultiplier(String(parseFloat(tierConfig.rewardMultiplier || '1')));
      setIsActive(tierConfig.isActive !== false);
      setColor(tierConfig.color || '');

      const b = tierConfig.benefits || {};
      setCashback(typeof b.cashback === 'string' ? b.cashback : b.cashback ? String(b.cashback) : '');
      setFreeTransfers(String(b.freeTransfers || 0));
      setPrioritySupport(!!b.prioritySupport);
      setExclusiveOffers(!!b.exclusiveOffers);
      setPersonalManager(!!b.personalManager);

      setHasLoaded(true);
    }
  }, [tierConfig, hasLoaded]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => loyaltyService.updateTierConfig(tierName, data),
    onSuccess: () => {
      toast.success('Tier configuration updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['loyalty-tier-configs'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-tier-config', tierName] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-tier-stats'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update tier configuration');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      minSpend: parseFloat(minSpend) || 0,
      minTransactions: parseInt(minTransactions) || 0,
      rewardMultiplier: parseFloat(rewardMultiplier) || 1,
      isActive,
      color: color || undefined,
      benefits: {
        cashback: cashback || '0%',
        freeTransfers: parseInt(freeTransfers) || 0,
        prioritySupport,
        exclusiveOffers,
        personalManager,
      },
    };

    updateMutation.mutate(data);
  };

  if (isLoading || tierLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';
  const style = tierMeta[tierName] || tierMeta.BRONZE;

  if (!tierConfig && !tierLoading) {
    return (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 dark:bg-gray-700">
            <FiAward className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold text-lg mb-1 dark:text-gray-100">Tier not found</p>
          <p className="text-sm text-gray-400 mb-5">The tier &quot;{tierName}&quot; does not exist</p>
          <button
            onClick={() => router.push('/dashboard/loyalty-tiers')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Tiers
          </button>
        </div>
    );
  }

  return (
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => router.push('/dashboard/loyalty-tiers')}
              className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/50"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${style.gradient} text-white shadow-lg ${style.shadow}`}>
              <FiAward className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{style.icon}</span>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887]">Edit {tierName} Tier</h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{style.label} — Configure requirements and benefits</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Requirements Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden dark:bg-gray-800/50 dark:border-gray-700/50">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 dark:border-gray-700/50 dark:bg-gray-700/30">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FiTarget className="w-4 h-4 text-gray-500" />
                    Tier Requirements
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Set the minimum thresholds to qualify for this tier</p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <FiDollarSign className="w-3.5 h-3.5 text-gray-400" />
                          Minimum Spend (NGN)
                        </span>
                      </label>
                      <input
                        type="number"
                        value={minSpend}
                        onChange={(e) => setMinSpend(e.target.value)}
                        min="0"
                        step="1000"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-700 dark:placeholder:text-gray-500"
                        placeholder="e.g. 50000"
                      />
                      <p className="text-xs text-gray-400 mt-1">Total spending required to reach this tier</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <FiTarget className="w-3.5 h-3.5 text-gray-400" />
                          Minimum Transactions
                        </span>
                      </label>
                      <input
                        type="number"
                        value={minTransactions}
                        onChange={(e) => setMinTransactions(e.target.value)}
                        min="0"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-700 dark:placeholder:text-gray-500"
                        placeholder="e.g. 10"
                      />
                      <p className="text-xs text-gray-400 mt-1">Number of transactions to qualify</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <FiStar className="w-3.5 h-3.5 text-gray-400" />
                        Reward Multiplier
                      </span>
                    </label>
                    <input
                      type="number"
                      value={rewardMultiplier}
                      onChange={(e) => setRewardMultiplier(e.target.value)}
                      min="1"
                      step="0.05"
                      className="w-full sm:w-1/2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-700 dark:placeholder:text-gray-500"
                      placeholder="e.g. 1.5"
                    />
                    <p className="text-xs text-gray-400 mt-1">Points earned = base points x multiplier (min 1.0)</p>
                  </div>
                </div>
              </div>

              {/* Benefits Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden dark:bg-gray-800/50 dark:border-gray-700/50">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 dark:border-gray-700/50 dark:bg-gray-700/30">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FiZap className="w-4 h-4 text-gray-500" />
                    Tier Benefits
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Configure the perks and rewards for this tier</p>
                </div>
                <div className="p-6 space-y-5">
                  {/* Cashback */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cashback Rate</label>
                    <input
                      type="text"
                      value={cashback}
                      onChange={(e) => setCashback(e.target.value)}
                      className="w-full sm:w-1/2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-700 dark:placeholder:text-gray-500"
                      placeholder="e.g. 2%"
                    />
                    <p className="text-xs text-gray-400 mt-1">Percentage cashback on transactions (e.g. &quot;1.5%&quot;)</p>
                  </div>

                  {/* Free Transfers */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Free Transfers per Month</label>
                    <input
                      type="number"
                      value={freeTransfers}
                      onChange={(e) => setFreeTransfers(e.target.value)}
                      min="0"
                      className="w-full sm:w-1/2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-700 dark:placeholder:text-gray-500"
                      placeholder="e.g. 5"
                    />
                    <p className="text-xs text-gray-400 mt-1">Number of free transfers included monthly</p>
                  </div>

                  {/* Toggle Benefits */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl dark:bg-gray-700/50">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Priority Support</p>
                        <p className="text-xs text-gray-400">Fast-tracked customer support for this tier</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPrioritySupport(!prioritySupport)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          prioritySupport ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          prioritySupport ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl dark:bg-gray-700/50">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Exclusive Offers</p>
                        <p className="text-xs text-gray-400">Access to tier-exclusive deals and promotions</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExclusiveOffers(!exclusiveOffers)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          exclusiveOffers ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          exclusiveOffers ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl dark:bg-gray-700/50">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Personal Manager</p>
                        <p className="text-xs text-gray-400">Dedicated account manager for VIP users</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPersonalManager(!personalManager)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          personalManager ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          personalManager ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Tier Preview */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden dark:bg-gray-800/50 dark:border-gray-700/50">
                <div className={`bg-gradient-to-br ${style.gradient} p-6 relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="text-3xl">{style.icon}</span>
                      <div>
                        <h3 className="text-xl font-bold text-white">{tierName}</h3>
                        <p className="text-white/70 text-xs">{style.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                        <p className="text-white/80 text-xs">Multiplier</p>
                        <p className="text-white font-bold text-lg">{parseFloat(rewardMultiplier || '1').toFixed(1)}x</p>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                        <p className="text-white/80 text-xs">Min Spend</p>
                        <p className="text-white font-bold text-lg">₦{parseInt(minSpend || '0').toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Preview</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Cashback</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{cashback || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Free Transfers</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{freeTransfers || '0'}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Priority Support</span>
                      <span className={`font-medium ${prioritySupport ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {prioritySupport ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Exclusive Offers</span>
                      <span className={`font-medium ${exclusiveOffers ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {exclusiveOffers ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Personal Manager</span>
                      <span className={`font-medium ${personalManager ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {personalManager ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Color */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-800/50 dark:border-gray-700/50">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-gray-500" />
                  Status & Appearance
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl dark:bg-gray-700/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Active</p>
                      <p className="text-xs text-gray-400">Enable or disable this tier</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isActive ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                        isActive ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tier Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={color || '#CD7F32'}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer dark:border-gray-600"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 dark:focus:bg-gray-700"
                        placeholder="#CD7F32"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
  );
}
