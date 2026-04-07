'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { disputeService } from '@/services/dispute.service';
import {
  FiShield,
  FiSearch,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiAlertTriangle,
  FiActivity,
  FiTrendingUp,
} from '@/utils/icons';
import CustomSelect from '@/components/ui/CustomSelect';

export default function DisputesPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const limit = 10;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'OTHERS';

  const { data: disputesRaw, isLoading: disputesLoading } = useQuery({
    queryKey: ['disputes', statusFilter, page, limit, isAdmin],
    queryFn: () => {
      if (isAdmin) {
        return disputeService.getDisputes({ status: statusFilter || undefined, page, limit });
      }
      return disputeService.getMyDisputes({ page, limit });
    },
    enabled: !isLoading && !!user,
  });

  const { data: statsRaw } = useQuery({
    queryKey: ['dispute-stats'],
    queryFn: () => disputeService.getStats(),
    enabled: !isLoading && !!user && isAdmin,
  });

  // Safely extract disputes array
  const disputes = useMemo(() => {
    if (!disputesRaw) return [];
    if (Array.isArray(disputesRaw)) return disputesRaw;
    const raw = disputesRaw as any;
    return raw?.data || [];
  }, [disputesRaw]);

  // Filter by search locally
  const filteredDisputes = useMemo(() => {
    if (!debouncedSearch) return disputes;
    const q = debouncedSearch.toLowerCase();
    return disputes.filter((d: any) =>
      d.reason?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.transactionId?.toLowerCase().includes(q) ||
      d.user?.firstName?.toLowerCase().includes(q) ||
      d.user?.lastName?.toLowerCase().includes(q) ||
      d.user?.email?.toLowerCase().includes(q)
    );
  }, [disputes, debouncedSearch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['disputes'] }),
      queryClient.invalidateQueries({ queryKey: ['dispute-stats'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';
  const total = (disputesRaw as any)?.total || disputes.length;
  const totalPages = Math.ceil(total / limit);

  // Parse stats
  const stats = statsRaw as any;
  const statCards = [
    {
      label: 'Total Disputes',
      value: stats?.total || stats?.totalDisputes || total || 0,
      icon: FiShield,
      color: 'from-rose-500 to-red-600',
      shadow: 'shadow-rose-500/25',
    },
    {
      label: 'Open',
      value: stats?.open || stats?.byStatus?.OPEN || 0,
      icon: FiAlertTriangle,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
    },
    {
      label: 'Investigating',
      value: stats?.investigating || stats?.byStatus?.INVESTIGATING || 0,
      icon: FiActivity,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
    },
    {
      label: 'Resolved',
      value: stats?.resolved || stats?.byStatus?.RESOLVED || 0,
      icon: FiCheckCircle,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
    },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'RESOLVED': return { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-600/20', dot: 'bg-emerald-500' };
      case 'REJECTED': return { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-600/20', dot: 'bg-red-500' };
      case 'OPEN': return { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-600/20', dot: 'bg-amber-500' };
      case 'INVESTIGATING': return { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-600/20', dot: 'bg-blue-500' };
      case 'ESCALATED': return { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-600/20', dot: 'bg-violet-500' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-700', ring: 'ring-gray-500/20', dot: 'bg-gray-500' };
    }
  };

  return (
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/25">
              <FiShield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887]">Disputes</h1>
              <p className="text-gray-500 text-sm">Manage and resolve transaction disputes</p>
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
        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {statCards.map((card) => (
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
        )}

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by reason, user, or transaction ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
            <CustomSelect
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={[
                { value: '', label: 'All Status' },
                { value: 'OPEN', label: 'Open' },
                { value: 'INVESTIGATING', label: 'Investigating' },
                { value: 'RESOLVED', label: 'Resolved' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'ESCALATED', label: 'Escalated' },
              ]}
              className="min-w-[160px]"
            />
          </div>
        </div>

        {/* Disputes Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          {disputesLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredDisputes.length > 0 ? (
            <>
              <div className="overflow-x-auto min-w-0">
                <table className="w-full min-w-[750px]">
                  <thead>
                    <tr className="bg-gray-50/80">
                      {isAdmin && <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">User</th>}
                      <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Reason</th>
                      <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Transaction</th>
                      <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Created</th>
                      <th className="text-center py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDisputes.map((dispute: any) => {
                      const ss = getStatusStyle(dispute.status);
                      return (
                        <tr key={dispute.id} className="hover:bg-gray-50/60 transition-colors group">
                          {isAdmin && (
                            <td className="py-4 px-5">
                              {dispute.user ? (
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                                    {dispute.user.firstName?.[0]}{dispute.user.lastName?.[0]}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 text-sm group-hover:text-primary transition-colors">
                                      {dispute.user.firstName} {dispute.user.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">{dispute.user.email}</p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 font-mono">{dispute.userId?.substring(0, 12)}...</span>
                              )}
                            </td>
                          )}
                          <td className="py-4 px-5">
                            <p className="font-medium text-gray-900 text-sm">{dispute.reason}</p>
                            {dispute.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{dispute.description}</p>
                            )}
                          </td>
                          <td className="py-4 px-5">
                            <p className="font-mono text-xs text-gray-500">
                              {dispute.transactionId?.substring(0, 16)}...
                            </p>
                            {dispute.transaction?.amount && (
                              <p className="text-xs font-semibold text-gray-700 mt-0.5">
                                ₦{parseFloat(dispute.transaction.amount).toLocaleString()}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${ss.bg} ${ss.text} ${ss.ring}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`}></span>
                              {dispute.status}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <p className="text-xs text-gray-500">{new Date(dispute.createdAt).toLocaleDateString()}</p>
                            <p className="text-[10px] text-gray-400">{new Date(dispute.createdAt).toLocaleTimeString()}</p>
                          </td>
                          <td className="py-4 px-5 text-center">
                            <button
                              onClick={() => router.push(`/dashboard/disputes/${dispute.id}`)}
                              className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
                              title="View details"
                            >
                              <FiEye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {disputes.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50 gap-3">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-700">{(page - 1) * limit + 1}</span>–<span className="font-medium text-gray-700">{Math.min(page * limit, total)}</span> of <span className="font-medium text-gray-700">{total}</span>
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
                <FiShield className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold mb-1">No disputes found</p>
              <p className="text-sm text-gray-400">
                {statusFilter ? 'Try adjusting your filter' : debouncedSearch ? 'Try adjusting your search' : 'No disputes have been filed yet'}
              </p>
            </div>
          )}
        </div>
      </div>
  );
}
