'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { loyaltyService } from '@/services/loyalty.service';
import {
  FiStar,
  FiTrendingUp,
  FiAward,
} from '@/utils/icons';

export default function LoyaltyPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const { data: tiers } = useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: () => loyaltyService.getAllTierConfigs(),
    enabled: !isLoading && !!user,
  });

  const { data: progress } = useQuery({
    queryKey: ['loyalty-progress'],
    queryFn: () => loyaltyService.getMyProgress(),
    enabled: !isLoading && !!user,
  });

  const { data: history } = useQuery({
    queryKey: ['loyalty-history'],
    queryFn: () => loyaltyService.getMyHistory({ page: 1, limit: 10 }),
    enabled: !isLoading && !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';
  const currentTier = tiers?.find((t) => t.tier === user?.currentTier);

  const tierColors: Record<string, string> = {
    BRONZE: 'from-amber-600 to-amber-800',
    SILVER: 'from-gray-400 to-gray-600',
    GOLD: 'from-yellow-400 to-yellow-600',
    PLATINUM: 'from-purple-400 to-purple-600',
  };

  return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-[#E5B887] mb-2">Loyalty Program</h1>
          <p className="text-gray-600">Your loyalty tier and benefits</p>
        </div>

        {/* Current Tier */}
        {progress && (
          <div className={`card mb-8 bg-gradient-to-br ${tierColors[progress.currentTier] || 'from-gray-400 to-gray-600'} text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-sm mb-2">Current Tier</p>
                <h2 className="text-4xl font-bold mb-2">{progress.currentTier}</h2>
                {progress.nextTier && (
                  <p className="text-white/80">
                    Progress to {progress.nextTier}: {Math.round(progress.progress.overallProgress)}%
                  </p>
                )}
              </div>
              <FiStar className="w-20 h-20 opacity-30" />
            </div>
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Progress to Next Tier</h2>
            {progress.nextTier ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold bg-gradient-to-br ${tierColors[progress.currentTier] || 'from-gray-400 to-gray-600'} text-white`}>
                        {progress.currentTier[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{progress.currentTier}</p>
                        <p className="text-xs text-gray-500">Current Tier</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary text-white">
                      Current
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-primary h-3 rounded-full transition-all"
                      style={{ width: `${progress.progress.overallProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Spend: {Math.round(progress.progress.spendProgress)}%</span>
                    <span>Transactions: {Math.round(progress.progress.transactionProgress)}%</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold bg-gray-200 text-gray-600`}>
                      {progress.nextTier[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{progress.nextTier}</p>
                      <p className="text-xs text-gray-500">
                        Min: ₦{parseFloat(progress.requirements.next?.minSpend || '0').toLocaleString()} • {progress.requirements.next?.minTransactions || 0} transactions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">You&apos;ve reached the highest tier!</p>
              </div>
            )}
          </div>
        )}

        {/* Tier History */}
        {history?.data && history.data.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tier History</h2>
            <div className="space-y-3">
              {history.data.map((entry) => (
                <div key={entry.id} className="p-4 rounded-xl bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiAward className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {entry.fromTier || 'None'} → {entry.toTier}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <FiTrendingUp className="w-5 h-5 text-green-500" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
  );
}

