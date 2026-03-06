'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService, UserFilters } from '@/services/admin.service';
import {
  FiWallet,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiRefreshCw,
  FiDollarSign,
  FiStar,
  FiUsers,
  FiTrendingUp,
} from '@/utils/icons';

export default function WalletsPage() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const limit = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters: UserFilters = {
    ...(debouncedSearch && { search: debouncedSearch }),
    page,
    limit,
  };

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', 'wallets', filters],
    queryFn: () => adminService.getUsers(filters),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  // Fetch all users (first page, no search) for summary stats
  const { data: allUsersData } = useQuery({
    queryKey: ['admin', 'users', 'wallets-summary'],
    queryFn: () => adminService.getUsers({ page: 1, limit: 100 }),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'wallets'] });
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Compute summary stats from all users
  const stats = useMemo(() => {
    const allUsers = allUsersData?.data || [];
    let totalMainBalance = 0;
    let totalRewardPoints = 0;
    let totalWallets = 0;
    let activeWallets = 0;

    allUsers.forEach((u: any) => {
      const wallets = u.wallets || [];
      totalWallets += wallets.length;
      wallets.forEach((w: any) => {
        const bal = parseFloat(w.balance || '0');
        if (w.type === 'REWARD') {
          totalRewardPoints += bal;
        } else {
          totalMainBalance += bal;
        }
        if (w.isActive !== false) activeWallets++;
      });
    });

    return {
      totalMainBalance,
      totalRewardPoints,
      totalWallets,
      activeWallets,
      totalUsers: allUsersData?.total || 0,
    };
  }, [allUsersData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';
  const users = usersData?.data || [];
  const total = usersData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const getMainBalance = (wallets?: Array<{ balance: string; currency: string; type?: string }>) => {
    if (!wallets || wallets.length === 0) return 0;
    const main = wallets.find(w => w.type !== 'REWARD') || wallets[0];
    return parseFloat(main?.balance || '0');
  };

  const getRewardBalance = (wallets?: Array<{ balance: string; currency: string; type?: string }>) => {
    if (!wallets || wallets.length === 0) return 0;
    const reward = wallets.find(w => w.type === 'REWARD');
    return parseFloat(reward?.balance || '0');
  };

  const getTotalBalance = (wallets?: Array<{ balance: string; currency: string; type?: string }>) => {
    if (!wallets || wallets.length === 0) return 0;
    return wallets.reduce((sum, w) => {
      if (w.type === 'REWARD') return sum;
      return sum + parseFloat(w.balance || '0');
    }, 0);
  };

  const summaryCards = [
    {
      label: 'Total Balance (NGN)',
      value: `₦${stats.totalMainBalance.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
    },
    {
      label: 'Total Reward Points',
      value: stats.totalRewardPoints.toLocaleString(),
      icon: FiStar,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
    },
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: FiUsers,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    },
    {
      label: 'Active Wallets',
      value: stats.activeWallets.toLocaleString(),
      icon: FiTrendingUp,
      color: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/25',
      bg: 'bg-violet-50',
      text: 'text-violet-700',
    },
  ];

  return (
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
              <FiWallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887]">Wallets Management</h1>
              <p className="text-gray-500 text-sm">View and manage all user wallets</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="self-start p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg ${card.shadow}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* Wallets Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          {usersLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="overflow-x-auto min-w-0">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">User</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[140px]">Main Wallet</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[140px]">Reward Points</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[140px]">Total Balance</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[90px]">Wallets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => {
                      const mainBalance = getMainBalance(u.wallets);
                      const rewardBalance = getRewardBalance(u.wallets);
                      const totalBalance = getTotalBalance(u.wallets);
                      const walletCount = u.wallets?.length || 0;

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-gray-50/60 transition-colors cursor-pointer group"
                          onClick={() => router.push(`/dashboard/users/${u.id}`)}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0">
                                {u.firstName?.[0]}{u.lastName?.[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors whitespace-nowrap">
                                  {u.firstName} {u.lastName}
                                </p>
                                <p className="text-xs text-gray-500 whitespace-nowrap">{u.email || u.phoneNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                : u.status === 'SUSPENDED'
                                ? 'bg-red-50 text-red-700 ring-red-600/20'
                                : 'bg-gray-50 text-gray-700 ring-gray-600/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                u.status === 'ACTIVE' ? 'bg-emerald-500' : u.status === 'SUSPENDED' ? 'bg-red-500' : 'bg-gray-500'
                              }`}></span>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <p className="font-bold text-gray-900">
                              ₦{mainBalance.toLocaleString()}
                            </p>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <p className="font-bold text-amber-600">
                              ₦{rewardBalance.toLocaleString()}
                            </p>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <p className="font-bold text-gray-900">
                              ₦{totalBalance.toLocaleString()}
                            </p>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
                              <FiCreditCard className="w-3 h-3" />
                              {walletCount}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50 gap-3">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-700">{(page - 1) * limit + 1}</span>–<span className="font-medium text-gray-700">{Math.min(page * limit, total)}</span> of <span className="font-medium text-gray-700">{total}</span> users
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-gray-600 px-3 min-w-[100px] text-center">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiWallet className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold mb-1">No users found</p>
              <p className="text-sm text-gray-400">
                {debouncedSearch ? 'Try adjusting your search query' : 'No users in the system yet'}
              </p>
            </div>
          )}
        </div>
      </div>
  );
}
