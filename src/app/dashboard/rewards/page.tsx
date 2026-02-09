'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { rewardService } from '@/services/reward.service';
import {
  FiGift,
  FiRedeem,
} from '@/utils/icons';

export default function RewardsPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  const { data: rewardDetails, isLoading: rewardsLoading } = useQuery({
    queryKey: ['reward-details', user?.id],
    queryFn: () => rewardService.getUserRewardDetails(user!.id),
    enabled: !!user?.id,
  });

  if (isLoading || rewardsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';
  const totalRewards = parseFloat(rewardDetails?.totalRewards || '0');
  const availableRewards = parseFloat(rewardDetails?.availableRewards || '0');
  const redeemedRewards = parseFloat(rewardDetails?.redeemedRewards || '0');

  return (
    <DashboardLayout role={role}>
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Rewards</h1>
          <p className="text-gray-600">View and redeem your reward points</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-warm text-white rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/90 text-sm mb-2">Total Rewards</p>
                <p className="text-3xl font-bold">{totalRewards.toLocaleString()} pts</p>
              </div>
              <FiGift className="w-10 h-10 opacity-30" />
            </div>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-2">Available Rewards</p>
            <p className="text-3xl font-bold text-green-600">{availableRewards.toLocaleString()} pts</p>
            <p className="text-xs text-gray-500 mt-1">Ready to redeem</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-2">Redeemed Rewards</p>
            <p className="text-3xl font-bold text-primary">{redeemedRewards.toLocaleString()} pts</p>
            <p className="text-xs text-gray-500 mt-1">Already used</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reward Details */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Reward Details</h2>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  {rewardDetails?.currentTier || 'BRONZE'}
                </span>
              </div>
              {rewardDetails ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-gray-900">
                          {availableRewards.toLocaleString()} pts Available
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Tier: {rewardDetails.currentTier} • Multiplier: {parseFloat(rewardDetails.tierMultiplier).toFixed(1)}x
                        </p>
                        {rewardDetails.benefits && (
                          <p className="text-xs text-gray-500 mt-2">
                            Benefits: {JSON.stringify(rewardDetails.benefits)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => router.push('/dashboard/rewards/redeem')}
                        className="btn-primary flex items-center gap-2"
                      >
                        <FiRedeem className="w-4 h-4" />
                        Redeem
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiGift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No reward details available</p>
                </div>
              )}
            </div>
          </div>

          {/* Reward Summary */}
          <div>
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Reward Summary</h2>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">Total Rewards</p>
                      <p className="text-xs text-gray-500 mt-1">All time</p>
                    </div>
                    <p className="font-bold text-lg text-gray-900">{totalRewards.toLocaleString()} pts</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">Available</p>
                      <p className="text-xs text-gray-500 mt-1">Ready to redeem</p>
                    </div>
                    <p className="font-bold text-lg text-green-600">{availableRewards.toLocaleString()} pts</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">Redeemed</p>
                      <p className="text-xs text-gray-500 mt-1">Already used</p>
                    </div>
                    <p className="font-bold text-lg text-primary">{redeemedRewards.toLocaleString()} pts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
