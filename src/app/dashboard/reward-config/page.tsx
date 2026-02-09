'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardConfigurationService } from '@/services/reward-configuration.service';
import {
  FiGift,
  FiEdit,
  FiPlus,
  FiCheck,
  FiX,
} from '@/utils/icons';
import toast from 'react-hot-toast';

export default function RewardConfigPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  const { data: configs, isLoading: configsLoading } = useQuery({
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
      toast.success('Reward configuration updated successfully');
      setEditingId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update configuration');
    },
  });

  if (isLoading || configsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  return (
    <DashboardLayout role={role}>
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reward Configuration</h1>
            <p className="text-gray-600">Manage reward percentages and tier multipliers</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            New Configuration
          </button>
        </div>

        {/* Active Configuration */}
        {activeConfig && (
          <div className="card mb-6 border-2 border-primary">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <FiGift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Active Configuration</h3>
                  <p className="text-sm text-gray-500">Version {activeConfig.version}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                Active
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Reward Percentage</p>
                <p className="text-2xl font-bold text-primary">{activeConfig.rewardPercentage}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Effective From</p>
                <p className="text-lg font-semibold">{new Date(activeConfig.effectiveFrom).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Tier Multipliers</p>
                <div className="flex gap-2">
                  {Object.entries(activeConfig.tierMultipliers || {}).map(([tier, multiplier]: [string, any]) => (
                    <span key={tier} className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {tier}: {multiplier}x
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Configurations */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Configurations</h2>
          <div className="space-y-4">
            {configs?.data?.map((config) => (
              <div
                key={config.id}
                className={`p-4 rounded-xl border ${
                  config.isActive ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-600">Version {config.version}</span>
                    {config.isActive && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!config.isActive && (
                      <button
                        onClick={() => updateMutation.mutate({ id: config.id, data: { isActive: true } })}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Activate"
                      >
                        <FiCheck className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingId(config.id)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <FiEdit className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Reward %</p>
                    <p className="font-semibold">{config.rewardPercentage}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">From</p>
                    <p className="font-semibold">{new Date(config.effectiveFrom).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Until</p>
                    <p className="font-semibold">
                      {config.effectiveUntil ? new Date(config.effectiveUntil).toLocaleDateString() : 'No expiry'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-semibold">{new Date(config.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!configs?.data || configs.data.length === 0) && (
              <div className="text-center py-12 text-gray-500">
                <FiGift className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No reward configurations found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

