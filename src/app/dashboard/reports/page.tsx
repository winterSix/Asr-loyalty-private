'use client';

import { useState } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import {
  FiBarChart,
  FiDollarSign,
  FiUsers,
  FiCreditCard,
  FiTrendingUp,
} from '@/utils/icons';

type ReportTab = 'revenue' | 'transactions' | 'users';

export default function ReportsPage() {
  const { user, isLoading } = useAuthGuard();
  const [activeTab, setActiveTab] = useState<ReportTab>('revenue');

  // Date range for revenue report
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Revenue report
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin', 'revenue', startDate, endDate, groupBy],
    queryFn: () => adminService.getRevenueReport({ startDate, endDate, groupBy }),
    enabled: !!user && isAdmin && activeTab === 'revenue',
  });

  // Transaction stats
  const { data: txStats, isLoading: txStatsLoading } = useQuery({
    queryKey: ['admin', 'transaction-stats'],
    queryFn: () => adminService.getTransactionStats(),
    enabled: !!user && isAdmin && activeTab === 'transactions',
  });

  // User stats
  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ['admin', 'user-stats'],
    queryFn: () => adminService.getUserStats(),
    enabled: !!user && isAdmin && activeTab === 'users',
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  const tabs = [
    { key: 'revenue' as const, label: 'Revenue Report', icon: <FiDollarSign className="w-4 h-4" /> },
    { key: 'transactions' as const, label: 'Transaction Stats', icon: <FiCreditCard className="w-4 h-4" /> },
    { key: 'users' as const, label: 'User Stats', icon: <FiUsers className="w-4 h-4" /> },
  ];

  return (
    <>
      <div>
        <div className="mb-8 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
            <FiBarChart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-500 text-sm">Generate and view system reports</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Revenue Report Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            {/* Date Filters */}
            <div className="card">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="select-field text-sm !py-2.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="select-field text-sm !py-2.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Group By</label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
                    className="select-field text-sm !py-2.5"
                  >
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            {revenueLoading ? (
              <div className="card flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : revenueData ? (
              <>
                {/* Revenue Totals */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 rounded-xl">
                        <FiDollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500">Total Revenue</p>
                        <p className="text-xl font-bold text-gray-900">
                          ₦{Number(revenueData.totals?.totalRevenue ?? 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <FiCreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500">Total Fees</p>
                        <p className="text-xl font-bold text-gray-900">
                          ₦{Number(revenueData.totals?.totalFees ?? 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <FiTrendingUp className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500">Total Rewards</p>
                        <p className="text-xl font-bold text-gray-900">
                          ₦{Number(revenueData.totals?.totalRewardsGiven ?? 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-100 rounded-xl">
                        <FiBarChart className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500">Transactions</p>
                        <p className="text-xl font-bold text-gray-900">
                          {(revenueData.totals?.transactionCount ?? 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue Breakdown Table */}
                <div className="card">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Breakdown</h3>
                  {revenueData.breakdown && revenueData.breakdown.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 min-w-[120px]">Period</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 min-w-[140px]">Revenue</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 min-w-[130px]">Fees</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 min-w-[130px]">Rewards</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 min-w-[80px]">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {revenueData.breakdown.map((row, i) => (
                            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 text-sm font-medium text-gray-900 whitespace-nowrap">{row.period}</td>
                              <td className="py-3 px-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                                ₦{Number(row.revenue ?? 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                                ₦{Number(row.fees ?? 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-sm text-purple-600 whitespace-nowrap">
                                ₦{Number(row.rewards ?? 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                                {row.count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No revenue data for this period</p>
                  )}
                </div>
              </>
            ) : (
              <div className="card text-center py-12">
                <FiBarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a date range to view revenue report</p>
              </div>
            )}
          </div>
        )}

        {/* Transaction Stats Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {txStatsLoading ? (
              <div className="card flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : txStats ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{txStats.totalCount?.toLocaleString()}</p>
                  </div>
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Total Volume</p>
                    <p className="text-2xl font-bold text-gray-900">₦{Number(txStats.totalVolume ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">{txStats.successRate?.toFixed(1)}%</p>
                  </div>
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Total Rewards Given</p>
                    <p className="text-2xl font-bold text-purple-600">₦{Number(txStats.totalRewardsGiven ?? 0).toLocaleString()}</p>
                  </div>
                </div>

                {/* By Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">By Status</h3>
                    <div className="space-y-3">
                      {txStats.byStatus && Object.entries(txStats.byStatus).map(([status, count]) => {
                        const percentage = txStats.totalCount ? ((count as number) / txStats.totalCount * 100) : 0;
                        const color = status === 'SUCCESSFUL' || status === 'COMPLETED' ? 'bg-green-500'
                          : status === 'FAILED' ? 'bg-red-500'
                          : status === 'PENDING' ? 'bg-yellow-500'
                          : 'bg-gray-500';
                        return (
                          <div key={status}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700">{status}</span>
                              <span className="text-gray-500">{(count as number).toLocaleString()} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">By Type</h3>
                    <div className="space-y-3">
                      {txStats.byType && Object.entries(txStats.byType).map(([type, value]) => {
                        // Backend byType values can be { count, volume } objects or plain numbers
                        const count = typeof value === 'object' && value !== null ? (value as any).count ?? 0 : (value as number);
                        const percentage = txStats.totalCount ? (count / txStats.totalCount * 100) : 0;
                        const color = type === 'WALLET_FUNDING' ? 'bg-blue-500'
                          : type === 'PAYMENT' ? 'bg-purple-500'
                          : type === 'REWARD_REDEMPTION' ? 'bg-green-500'
                          : type === 'TRANSFER' ? 'bg-indigo-500'
                          : 'bg-gray-500';
                        return (
                          <div key={type}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700">{type.replace(/_/g, ' ')}</span>
                              <span className="text-gray-500">{count.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="card text-center py-12">
                <FiCreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No transaction statistics available</p>
              </div>
            )}
          </div>
        )}

        {/* User Stats Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {userStatsLoading ? (
              <div className="card flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : userStats ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats.total?.toLocaleString()}</p>
                  </div>
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Verified Phones</p>
                    <p className="text-2xl font-bold text-green-600">{userStats.verifiedPhones?.toLocaleString()}</p>
                  </div>
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Recent Signups</p>
                    <p className="text-2xl font-bold text-blue-600">{userStats.recentSignups?.toLocaleString()}</p>
                  </div>
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Verification Rate</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {userStats.total ? ((userStats.verifiedPhones / userStats.total) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>

                {/* Breakdowns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* By Status */}
                  <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">By Status</h3>
                    <div className="space-y-3">
                      {userStats.byStatus && Object.entries(userStats.byStatus).map(([status, count]) => {
                        const percentage = userStats.total ? ((count as number) / userStats.total * 100) : 0;
                        return (
                          <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                status === 'ACTIVE' ? 'bg-green-500' : status === 'SUSPENDED' ? 'bg-red-500' : 'bg-gray-400'
                              }`} />
                              <span className="font-medium text-gray-700 text-sm">{status}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-gray-900">{(count as number).toLocaleString()}</span>
                              <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(1)}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* By Role */}
                  <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">By Role</h3>
                    <div className="space-y-3">
                      {userStats.byRole && Object.entries(userStats.byRole).map(([role, count]) => {
                        const percentage = userStats.total ? ((count as number) / userStats.total * 100) : 0;
                        const color = role === 'SUPER_ADMIN' ? 'bg-red-500'
                          : role === 'ADMIN' ? 'bg-yellow-500'
                          : role === 'CASHIER' ? 'bg-blue-500'
                          : 'bg-gray-400';
                        return (
                          <div key={role} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${color}`} />
                              <span className="font-medium text-gray-700 text-sm">{role.replace('_', ' ')}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-gray-900">{(count as number).toLocaleString()}</span>
                              <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(1)}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* By Tier */}
                  <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">By Tier</h3>
                    <div className="space-y-3">
                      {userStats.byTier && Object.entries(userStats.byTier).map(([tier, count]) => {
                        const percentage = userStats.total ? ((count as number) / userStats.total * 100) : 0;
                        const color = tier === 'PLATINUM' ? 'bg-indigo-500'
                          : tier === 'GOLD' ? 'bg-amber-500'
                          : tier === 'SILVER' ? 'bg-slate-400'
                          : 'bg-orange-400';
                        return (
                          <div key={tier} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${color}`} />
                              <span className="font-medium text-gray-700 text-sm">{tier}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-gray-900">{(count as number).toLocaleString()}</span>
                              <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(1)}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="card text-center py-12">
                <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No user statistics available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
