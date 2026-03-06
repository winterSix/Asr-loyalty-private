'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { loyaltyService } from '@/services/loyalty.service';
import { rewardService } from '@/services/reward.service';
import { userService } from '@/services/user.service';
import {
  FiStar,
  FiGift,
  FiUsers,
  FiTrendingUp,
  FiSettings,
} from '@/utils/icons';

export default function LoyaltyManagerDashboard() {
  const router = useRouter();

  const { data: tiers } = useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: () => loyaltyService.getTiers(),
  });

  // Note: getAllUsers endpoint doesn't exist yet
  const users = { total: 0 };

  const { data: rewards } = useQuery({
    queryKey: ['reward-configurations'],
    queryFn: () => rewardService.getRewardConfigurations({ page: 1, limit: 10 }),
  });

  const statCards = [
    {
      label: 'Total Users',
      value: users?.total || 0,
      icon: <FiUsers className="w-6 h-6" />,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      label: 'Active Tiers',
      value: tiers?.length || 0,
      icon: <FiStar className="w-6 h-6" />,
      color: 'bg-yellow-500',
      change: '4 tiers',
    },
    {
      label: 'Reward Configs',
      value: rewards?.data?.length || rewards?.total || 0,
      icon: <FiGift className="w-6 h-6" />,
      color: 'bg-green-500',
      change: 'Active',
    },
    {
      label: 'Growth Rate',
      value: '+24%',
      icon: <FiTrendingUp className="w-6 h-6" />,
      color: 'bg-purple-500',
      change: 'This month',
    },
  ];

  const tierColors: Record<string, string> = {
    BRONZE: 'from-amber-600 to-amber-800',
    SILVER: 'from-gray-400 to-gray-600',
    GOLD: 'from-yellow-400 to-yellow-600',
    PLATINUM: 'from-purple-400 to-purple-600',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-[#E5B887] mb-2">Loyalty Management Dashboard</h1>
        <p className="text-gray-600">Manage loyalty tiers, rewards, and user engagement</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="card card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 ${card.color} text-white rounded-xl`}>
                {card.icon}
              </div>
              <span className="text-xs font-medium text-green-600">{card.change}</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loyalty Tiers */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Loyalty Tiers</h2>
              <button
                onClick={() => router.push('/dashboard/loyalty-tiers')}
                className="text-primary hover:text-primary-light text-sm"
              >
                Manage Tiers
              </button>
            </div>
            {tiers && tiers.length > 0 ? (
              <div className="space-y-4">
                {tiers.map((tier: any) => (
                  <div
                    key={tier.id}
                    className={`p-4 rounded-xl border-2 ${
                      tierColors[tier.tier] ? `border-${tier.tier.toLowerCase()}-500` : 'border-gray-200'
                    } bg-gradient-to-br ${tierColors[tier.tier] || 'from-gray-400 to-gray-600'} bg-opacity-10`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${tierColors[tier.tier] || 'from-gray-400 to-gray-600'} rounded-xl flex items-center justify-center text-white font-bold`}>
                          {tier.tier[0]}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{tier.tier}</h3>
                          <p className="text-sm text-gray-600">
                            Min: ₦{parseFloat(tier.minSpend).toLocaleString()} • {tier.minTransactions} transactions
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary text-white">
                        {parseFloat(tier.rewardMultiplier).toFixed(1)}x Multiplier
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tier.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {tier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No loyalty tiers configured</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Reward Configuration</h2>
            {rewards?.data && rewards.data.length > 0 ? (
              <div className="space-y-3">
                {rewards.data.map((config) => (
                  <div key={config.id} className="p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">Version {config.version}</p>
                        <p className="text-xs text-gray-500">
                          {parseFloat(config.rewardPercentage).toFixed(2)}% reward
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        config.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {config.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No reward configurations</p>
            )}
            <button
              onClick={() => router.push('/dashboard/reward-config')}
              className="w-full mt-4 btn-secondary text-sm flex items-center justify-center gap-2"
            >
              <FiSettings className="w-4 h-4" />
              Manage Configurations
            </button>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/dashboard/loyalty-tiers')}
                className="w-full btn-primary text-sm flex items-center justify-center gap-2"
              >
                <FiStar className="w-4 h-4" />
                Manage Tiers
              </button>
              <button
                onClick={() => router.push('/dashboard/reward-config')}
                className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
              >
                <FiGift className="w-4 h-4" />
                Configure Rewards
              </button>
              <button
                onClick={() => router.push('/dashboard/users')}
                className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
              >
                <FiUsers className="w-4 h-4" />
                View Users
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
