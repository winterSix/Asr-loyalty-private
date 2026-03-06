'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { walletService } from '@/services/wallet.service';
import { transactionService } from '@/services/transaction.service';
import { rewardService } from '@/services/reward.service';
import { useAuthStore } from '@/store/auth.store';
import {
  FiWallet,
  FiGift,
  FiTrendingUp,
  FiStar,
  FiQrCode,
  FiArrowRight,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from '@/utils/icons';

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({
    walletBalance: '0.00',
    rewardBalance: '0.00',
    totalSpent: '0.00',
    rewardsEarned: '0.00',
  });

  const { data: walletBalance } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletService.getBalance(),
    enabled: !!user,
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => transactionService.getTransactions({ page: 1, limit: 5 }),
    enabled: !!user,
  });

  const { data: rewardDetails } = useQuery({
    queryKey: ['reward-details', user?.id],
    queryFn: () => rewardService.getUserRewardDetails(user!.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (walletBalance && walletBalance.main && walletBalance.reward) {
      setStats({
        walletBalance: walletBalance.main.balance || '0.00',
        rewardBalance: walletBalance.reward.balance || '0.00',
        totalSpent: user?.totalSpent || '0.00',
        rewardsEarned: rewardDetails?.availableRewards || '0.00',
      });
    } else if (walletBalance) {
      // If walletBalance exists but structure is different, set defaults
      setStats({
        walletBalance: '0.00',
        rewardBalance: '0.00',
        totalSpent: user?.totalSpent || '0.00',
        rewardsEarned: rewardDetails?.availableRewards || '0.00',
      });
    }
  }, [walletBalance, user, rewardDetails]);

  const statCards = [
    {
      label: 'Wallet Balance',
      value: `₦${parseFloat(stats.walletBalance).toLocaleString()}`,
      icon: <FiWallet className="w-8 h-8" />,
      gradient: 'bg-gradient-primary',
      action: () => router.push('/dashboard/wallet'),
    },
    {
      label: 'Reward Points',
      value: `${parseFloat(stats.rewardBalance).toLocaleString()} pts`,
      icon: <FiGift className="w-8 h-8" />,
      gradient: 'bg-gradient-warm',
      action: () => router.push('/dashboard/rewards'),
    },
    {
      label: 'Total Spent',
      value: `₦${parseFloat(stats.totalSpent).toLocaleString()}`,
      icon: <FiTrendingUp className="w-8 h-8" />,
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-400',
      action: () => router.push('/dashboard/transactions'),
    },
    {
      label: 'Loyalty Tier',
      value: user?.currentTier || 'BRONZE',
      icon: <FiStar className="w-8 h-8" />,
      gradient: 'bg-gradient-purple',
      action: () => router.push('/dashboard/loyalty'),
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESSFUL':
        return <FiCheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <FiXCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FiClock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESSFUL':
        return 'bg-green-100 text-green-700';
      case 'FAILED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-[#E5B887] mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600">Here&apos;s your account overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            onClick={card.action}
            className={`${card.gradient} text-white rounded-2xl p-6 cursor-pointer 
                       transform transition-all duration-200 hover:scale-105 hover:shadow-xl`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-xl">{card.icon}</div>
            </div>
            <p className="text-white/90 text-sm mb-2">{card.label}</p>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
              <button
                onClick={() => router.push('/dashboard/transactions')}
                className="text-primary hover:text-primary-light font-medium flex items-center gap-2"
              >
                View All <FiArrowRight className="w-4 h-4" />
              </button>
            </div>

            {transactions?.data && transactions.data.length > 0 ? (
              <div className="space-y-3">
                {transactions.data.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 
                             hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {tx.description || tx.type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                      <p className="font-bold text-gray-900">
                        {tx.type === 'WALLET_FUNDING' || tx.type === 'REWARD_CREDIT' ? '+' : '-'}
                        ₦{parseFloat(tx.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No transactions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Rewards */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard/qr-pay')}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <FiQrCode className="w-5 h-5" />
                Scan & Pay
              </button>
              <button
                onClick={() => router.push('/dashboard/wallet')}
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <FiWallet className="w-5 h-5" />
                Fund Wallet
              </button>
              <button
                onClick={() => router.push('/dashboard/rewards')}
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <FiGift className="w-5 h-5" />
                View Rewards
              </button>
            </div>
          </div>

          {/* Available Rewards */}
          {rewardDetails && parseFloat(rewardDetails.availableRewards) > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Available Rewards</h2>
              <div className="p-4 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg text-gray-900">
                      {parseFloat(rewardDetails.availableRewards).toLocaleString()} pts
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Current Tier: {rewardDetails.currentTier} ({parseFloat(rewardDetails.tierMultiplier).toFixed(1)}x)
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Available
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
