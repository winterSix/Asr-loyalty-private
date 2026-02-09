'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { loyaltyService } from '@/services/loyalty.service';
import {
  FiStar,
  FiEdit,
  FiPlus,
} from '@/utils/icons';

export default function LoyaltyTiersPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  const { data: tiers, isLoading: tiersLoading } = useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: () => loyaltyService.getAllTierConfigs(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'LOYALTY_MANAGER'),
  });

  if (isLoading || tiersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  const tierColors: Record<string, string> = {
    BRONZE: 'from-amber-600 to-amber-800',
    SILVER: 'from-gray-400 to-gray-600',
    GOLD: 'from-yellow-400 to-yellow-600',
    PLATINUM: 'from-purple-400 to-purple-600',
  };

  return (
    <DashboardLayout role={role}>
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Loyalty Tiers</h1>
            <p className="text-gray-600">Manage loyalty tier configurations and benefits</p>
          </div>
          {(role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'LOYALTY_MANAGER') && (
            <button className="btn-primary flex items-center gap-2">
              <FiPlus className="w-5 h-5" />
              Add Tier
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers && tiers.length > 0 ? (
            tiers.map((tier) => (
              <div
                key={tier.id}
                className={`card border-2 ${
                  tier.isActive
                    ? `border-${tier.tier.toLowerCase()}-500`
                    : 'border-gray-200'
                }`}
              >
                <div className={`bg-gradient-to-br ${tierColors[tier.tier] || 'from-gray-400 to-gray-600'} text-white p-6 rounded-xl mb-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{tier.tier}</h3>
                      <p className="text-white/80 text-sm mt-1">
                        {parseFloat(tier.rewardMultiplier).toFixed(1)}x Multiplier
                      </p>
                    </div>
                    <FiStar className="w-8 h-8 text-white/50" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Minimum Spend</p>
                    <p className="font-bold text-lg text-gray-900">
                      ₦{parseFloat(tier.minSpend).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Minimum Transactions</p>
                    <p className="font-bold text-lg text-gray-900">{tier.minTransactions}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tier.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {tier.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {(role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'LOYALTY_MANAGER') && (
                      <button
                        onClick={() => router.push(`/dashboard/loyalty-tiers/${tier.id}`)}
                        className="text-primary hover:text-primary-light"
                      >
                        <FiEdit className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FiStar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No loyalty tiers configured</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

