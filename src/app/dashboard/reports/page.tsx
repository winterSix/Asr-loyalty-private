'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { healthService } from '@/services/health.service';
import {
  FiBarChart,
  FiDollarSign,
  FiUsers,
  FiCreditCard,
  FiTrendingUp,
  FiGlobe,
  FiActivity,
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
} from '@/utils/icons';
import CustomSelect from '@/components/ui/CustomSelect';

type ReportTab = 'revenue' | 'transactions' | 'users' | 'gateway' | 'health';

export default function ReportsPage() {
  const { user, isLoading } = useAuthGuard();
  const [activeTab, setActiveTab] = useState<ReportTab>('revenue');

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [breakdownPage, setBreakdownPage] = useState(1);
  const breakdownLimit = 10;

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin', 'revenue', startDate, endDate, groupBy],
    queryFn: () => adminService.getRevenueReport({ startDate, endDate, groupBy }),
    enabled: !!user && isAdmin && activeTab === 'revenue',
  });

  const { data: txStats, isLoading: txStatsLoading } = useQuery({
    queryKey: ['admin', 'transaction-stats'],
    queryFn: () => adminService.getTransactionStats(),
    enabled: !!user && isAdmin && activeTab === 'transactions',
  });

  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ['admin', 'user-stats'],
    queryFn: () => adminService.getUserStats(),
    enabled: !!user && isAdmin && activeTab === 'users',
  });

  const [gwStartDate, setGwStartDate] = useState('');
  const [gwEndDate, setGwEndDate] = useState('');
  const { data: gatewayStats, isLoading: gatewayLoading } = useQuery({
    queryKey: ['admin', 'gateway-stats', gwStartDate, gwEndDate],
    queryFn: () => adminService.getGatewayStats(gwStartDate || undefined, gwEndDate || undefined),
    enabled: !!user && isAdmin && activeTab === 'gateway',
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['admin', 'health-detailed'],
    queryFn: () => healthService.getDetailedHealth(),
    enabled: !!user && isAdmin && activeTab === 'health',
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const tabs = [
    { key: 'revenue' as const, label: 'Revenue Report', icon: <FiDollarSign className="w-4 h-4" /> },
    { key: 'transactions' as const, label: 'Transaction Stats', icon: <FiCreditCard className="w-4 h-4" /> },
    { key: 'users' as const, label: 'User Stats', icon: <FiUsers className="w-4 h-4" /> },
    { key: 'gateway' as const, label: 'Gateway Stats', icon: <FiGlobe className="w-4 h-4" /> },
    { key: 'health' as const, label: 'System Health', icon: <FiActivity className="w-4 h-4" /> },
  ];

  return (
    <>
      <div>
        <div className="mb-8 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
            <FiBarChart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887]">Reports</h1>
            <p className="text-gray-500 dark:text-[#8b949e] text-sm">Generate and view system reports</p>
          </div>
        </div>

        {/* Tabs — horizontally scrollable on mobile */}
        <div className="overflow-x-auto min-w-0 mb-6">
          <div className="flex gap-1 bg-gray-100 dark:bg-[#161b22] rounded-xl p-1 w-max border border-transparent dark:border-[#21262d]">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'text-gray-900 dark:text-[#e6edf3]'
                    : 'text-gray-500 dark:text-[#8b949e] hover:text-gray-700 dark:hover:text-[#c9d1d9]'
                }`}
              >
                {activeTab === tab.key && (
                  <motion.span
                    layoutId="reports-tab-pill"
                    className="absolute inset-0 rounded-lg bg-white dark:bg-[#21262d] shadow-sm dark:border dark:border-[#30363d]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Revenue Report Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            {revenueLoading ? (
              <div className="card flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : revenueData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="card">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-500/15 rounded-xl">
                      <FiDollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e]">Total Revenue</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-[#e6edf3]">
                        ₦{Number(revenueData.totals?.totalRevenue ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-500/15 rounded-xl">
                      <FiCreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e]">Total Fees</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-[#e6edf3]">
                        ₦{Number(revenueData.totals?.totalFees ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 dark:bg-purple-500/15 rounded-xl">
                      <FiTrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e]">Total Rewards</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-[#e6edf3]">
                        ₦{Number(revenueData.totals?.totalRewardsGiven ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 dark:bg-amber-500/15 rounded-xl">
                      <FiBarChart className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e]">Transactions</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-[#e6edf3]">
                        {(revenueData.totals?.transactionCount ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Date Filters */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-[#c9d1d9] mb-3">Filter Report</h3>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] block mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="select-field text-sm !py-2.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] block mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="select-field text-sm !py-2.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] block mb-1.5">Group By</label>
                  <CustomSelect
                    value={groupBy}
                    onChange={(v) => setGroupBy(v as 'day' | 'week' | 'month')}
                    options={[
                      { value: 'day', label: 'Daily' },
                      { value: 'week', label: 'Weekly' },
                      { value: 'month', label: 'Monthly' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Revenue Breakdown Table */}
            {revenueLoading ? (
              <div className="card flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : revenueData ? (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 dark:text-[#e6edf3] mb-4">Revenue Breakdown</h3>
                {revenueData.breakdown && revenueData.breakdown.length > 0 ? (
                  (() => {
                    const pagedBreakdown = revenueData.breakdown.slice((breakdownPage - 1) * breakdownLimit, breakdownPage * breakdownLimit);
                    return (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-white/5">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#c9d1d9] min-w-[120px]">Period</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#c9d1d9] min-w-[140px]">Revenue</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#c9d1d9] min-w-[130px]">Fees</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#c9d1d9] min-w-[130px]">Rewards</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#c9d1d9] min-w-[80px]">Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pagedBreakdown.map((row, i) => (
                                <tr key={i} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-[#e6edf3] whitespace-nowrap">{row.period}</td>
                                  <td className="py-3 px-4 text-sm font-bold text-gray-900 dark:text-[#e6edf3] whitespace-nowrap">
                                    ₦{Number(row.revenue ?? 0).toLocaleString()}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-[#c9d1d9] whitespace-nowrap">
                                    ₦{Number(row.fees ?? 0).toLocaleString()}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-purple-600 dark:text-purple-400 whitespace-nowrap">
                                    ₦{Number(row.rewardsGiven ?? row.rewards ?? 0).toLocaleString()}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-700 dark:text-[#c9d1d9] whitespace-nowrap">
                                    {row.count}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {revenueData.breakdown.length > breakdownLimit && (
                          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] gap-3 mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Showing {(breakdownPage - 1) * breakdownLimit + 1}–{Math.min(breakdownPage * breakdownLimit, revenueData.breakdown.length)} of {revenueData.breakdown.length}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => setBreakdownPage((p) => Math.max(1, p - 1))} disabled={breakdownPage === 1} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                                <FiChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                              <span className="text-sm text-gray-600 dark:text-gray-400 px-3">Page {breakdownPage} of {Math.ceil(revenueData.breakdown.length / breakdownLimit)}</span>
                              <button onClick={() => setBreakdownPage((p) => Math.min(Math.ceil(revenueData.breakdown.length / breakdownLimit), p + 1))} disabled={breakdownPage >= Math.ceil(revenueData.breakdown.length / breakdownLimit)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                                <FiChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <p className="text-gray-500 dark:text-[#8b949e] text-center py-8">No revenue data for this period</p>
                )}
              </div>
            ) : (
              <div className="card text-center py-12">
                <FiBarChart className="w-16 h-16 text-gray-400 dark:text-[#6e7681] mx-auto mb-4" />
                <p className="text-gray-500 dark:text-[#8b949e]">Select a date range to view revenue breakdown</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] mb-1">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-[#e6edf3]">{txStats.totalCount?.toLocaleString()}</p>
                  </div>
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] mb-1">Total Volume</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-[#e6edf3]">₦{Number(txStats.totalVolume ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] mb-1">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{txStats.successRate?.toFixed(1)}%</p>
                  </div>
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] mb-1">Total Rewards Given</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">₦{Number(txStats.totalRewardsGiven ?? 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-[#e6edf3] mb-4">By Status</h3>
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
                              <span className="font-medium text-gray-700 dark:text-[#c9d1d9]">{status}</span>
                              <span className="text-gray-500 dark:text-[#8b949e]">{(count as number).toLocaleString()} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-[#21262d] rounded-full h-2">
                              <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-[#e6edf3] mb-4">By Type</h3>
                    <div className="space-y-3">
                      {txStats.byType && Object.entries(txStats.byType).map(([type, value]) => {
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
                              <span className="font-medium text-gray-700 dark:text-[#c9d1d9]">{type.replace(/_/g, ' ')}</span>
                              <span className="text-gray-500 dark:text-[#8b949e]">{count.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-[#21262d] rounded-full h-2">
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
                <FiCreditCard className="w-16 h-16 text-gray-400 dark:text-[#6e7681] mx-auto mb-4" />
                <p className="text-gray-500 dark:text-[#8b949e]">No transaction statistics available</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] mb-1">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-[#e6edf3]">{userStats.total?.toLocaleString()}</p>
                  </div>
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] mb-1">Verified Phones</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{userStats.verifiedPhones?.toLocaleString()}</p>
                  </div>
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] mb-1">Recent Signups</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userStats.recentSignups?.toLocaleString()}</p>
                  </div>
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] mb-1">Verification Rate</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {userStats.total ? ((userStats.verifiedPhones / userStats.total) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-[#e6edf3] mb-4">By Status</h3>
                    <div className="space-y-3">
                      {userStats.byStatus && Object.entries(userStats.byStatus).map(([status, count]) => {
                        const percentage = userStats.total ? ((count as number) / userStats.total * 100) : 0;
                        return (
                          <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#21262d]">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                status === 'ACTIVE' ? 'bg-green-500' : status === 'SUSPENDED' ? 'bg-red-500' : 'bg-gray-400'
                              }`} />
                              <span className="font-medium text-gray-700 dark:text-[#c9d1d9] text-sm">{status}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-gray-900 dark:text-[#e6edf3]">{(count as number).toLocaleString()}</span>
                              <span className="text-xs text-gray-500 dark:text-[#8b949e] ml-1">({percentage.toFixed(1)}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-[#e6edf3] mb-4">By Role</h3>
                    <div className="space-y-3">
                      {userStats.byRole && Object.entries(userStats.byRole).map(([role, count]) => {
                        const percentage = userStats.total ? ((count as number) / userStats.total * 100) : 0;
                        const color = role === 'SUPER_ADMIN' ? 'bg-red-500'
                          : role === 'ADMIN' ? 'bg-yellow-500'
                          : role === 'CASHIER' ? 'bg-blue-500'
                          : 'bg-gray-400';
                        return (
                          <div key={role} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#21262d]">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${color}`} />
                              <span className="font-medium text-gray-700 dark:text-[#c9d1d9] text-sm">{role.replace('_', ' ')}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-gray-900 dark:text-[#e6edf3]">{(count as number).toLocaleString()}</span>
                              <span className="text-xs text-gray-500 dark:text-[#8b949e] ml-1">({percentage.toFixed(1)}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-[#e6edf3] mb-4">By Tier</h3>
                    <div className="space-y-3">
                      {userStats.byTier && Object.entries(userStats.byTier).map(([tier, count]) => {
                        const percentage = userStats.total ? ((count as number) / userStats.total * 100) : 0;
                        const color = tier === 'PLATINUM' ? 'bg-indigo-500'
                          : tier === 'GOLD' ? 'bg-amber-500'
                          : tier === 'SILVER' ? 'bg-slate-400'
                          : 'bg-orange-400';
                        return (
                          <div key={tier} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#21262d]">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${color}`} />
                              <span className="font-medium text-gray-700 dark:text-[#c9d1d9] text-sm">{tier}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-gray-900 dark:text-[#e6edf3]">{(count as number).toLocaleString()}</span>
                              <span className="text-xs text-gray-500 dark:text-[#8b949e] ml-1">({percentage.toFixed(1)}%)</span>
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
                <FiUsers className="w-16 h-16 text-gray-400 dark:text-[#6e7681] mx-auto mb-4" />
                <p className="text-gray-500 dark:text-[#8b949e]">No user statistics available</p>
              </div>
            )}
          </div>
        )}

        {/* Gateway Stats Tab */}
        {activeTab === 'gateway' && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] block mb-1.5">Start Date</label>
                  <input type="date" value={gwStartDate} onChange={(e) => setGwStartDate(e.target.value)} className="select-field text-sm !py-2.5" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] block mb-1.5">End Date</label>
                  <input type="date" value={gwEndDate} onChange={(e) => setGwEndDate(e.target.value)} className="select-field text-sm !py-2.5" />
                </div>
                {(gwStartDate || gwEndDate) && (
                  <button onClick={() => { setGwStartDate(''); setGwEndDate(''); }} className="text-sm text-primary font-semibold pb-2.5">Clear</button>
                )}
              </div>
            </div>
            {gatewayLoading ? (
              <div className="card flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : gatewayStats?.gateways ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gatewayStats.gateways.map((gw: any) => (
                    <div key={gw.gateway} className="card space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/15 rounded-xl">
                          <FiGlobe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-[#e6edf3]">{gw.gateway}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 dark:bg-[#21262d] rounded-xl">
                          <p className="text-xs text-gray-500 dark:text-[#8b949e] mb-1">Total Transactions</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-[#e6edf3]">{gw.totalTransactions.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-[#21262d] rounded-xl">
                          <p className="text-xs text-gray-500 dark:text-[#8b949e] mb-1">Total Volume</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-[#e6edf3]">₦{Number(gw.totalVolume).toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
                          <p className="text-xs text-green-600 dark:text-green-400 mb-1">Successful</p>
                          <p className="text-xl font-bold text-green-700 dark:text-green-400">{gw.successfulTransactions.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Fees Collected</p>
                          <p className="text-xl font-bold text-blue-700 dark:text-blue-400">₦{Number(gw.totalFees).toLocaleString()}</p>
                        </div>
                      </div>
                      {gw.byStatus && Object.keys(gw.byStatus).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] mb-2">By Status</p>
                          <div className="space-y-1.5">
                            {Object.entries(gw.byStatus).map(([status, val]: [string, any]) => (
                              <div key={status} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-[#c9d1d9]">{status}</span>
                                <span className="font-semibold text-gray-900 dark:text-[#e6edf3]">{val.count.toLocaleString()} &middot; ₦{Number(val.volume).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-[#e6edf3] mb-4">Combined Totals</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-[#21262d] rounded-xl text-center">
                      <p className="text-xs text-gray-500 dark:text-[#8b949e] mb-1">All Transactions</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-[#e6edf3]">{gatewayStats.totals.totalTransactions.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-[#21262d] rounded-xl text-center">
                      <p className="text-xs text-gray-500 dark:text-[#8b949e] mb-1">Total Volume</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-[#e6edf3]">₦{Number(gatewayStats.totals.totalVolume).toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-[#21262d] rounded-xl text-center">
                      <p className="text-xs text-gray-500 dark:text-[#8b949e] mb-1">Total Fees</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-[#e6edf3]">₦{Number(gatewayStats.totals.totalFees).toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-[#21262d] rounded-xl text-center">
                      <p className="text-xs text-gray-500 dark:text-[#8b949e] mb-1">Successful Volume</p>
                      <p className="text-xl font-bold text-green-700 dark:text-green-400">₦{Number(gatewayStats.totals.successfulVolume).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="card text-center py-12">
                <FiGlobe className="w-16 h-16 text-gray-400 dark:text-[#6e7681] mx-auto mb-4" />
                <p className="text-gray-500 dark:text-[#8b949e]">No gateway data available</p>
              </div>
            )}
          </div>
        )}

        {/* System Health Tab */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            {healthLoading ? (
              <div className="card flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : healthData ? (
              <>
                <div className="card flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${(healthData as any).status === 'healthy' ? 'bg-green-100 dark:bg-green-500/15' : 'bg-red-100 dark:bg-red-500/15'}`}>
                    <FiActivity className={`w-6 h-6 ${(healthData as any).status === 'healthy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e]">Overall Status</p>
                    <p className={`text-2xl font-bold capitalize ${(healthData as any).status === 'healthy' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      {(healthData as any).status}
                    </p>
                  </div>
                  {(healthData as any).uptime != null && (
                    <div className="ml-auto text-right">
                      <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e]">Uptime</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-[#e6edf3]">{Math.floor((healthData as any).uptime / 3600)}h {Math.floor(((healthData as any).uptime % 3600) / 60)}m</p>
                    </div>
                  )}
                </div>
                {(healthData as any).checks && (
                  <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-[#e6edf3] mb-4">Service Checks</h3>
                    <div className="space-y-3">
                      {Object.entries((healthData as any).checks).map(([service, check]: [string, any]) => (
                        <div key={service} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#21262d] rounded-xl">
                          <div className="flex items-center gap-3">
                            {check.status === 'up' ? (
                              <FiCheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <FiXCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className="font-medium text-gray-800 dark:text-[#c9d1d9] capitalize">{service}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            {check.responseTime != null && (
                              <span className="text-gray-500 dark:text-[#8b949e]">{check.responseTime}ms</span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              check.status === 'up'
                                ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400'
                            }`}>
                              {check.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="card text-center py-12">
                <FiActivity className="w-16 h-16 text-gray-400 dark:text-[#6e7681] mx-auto mb-4" />
                <p className="text-gray-500 dark:text-[#8b949e]">Health data unavailable</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
