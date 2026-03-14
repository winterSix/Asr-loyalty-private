'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useQuery } from '@tanstack/react-query';
import { adminService, TransactionFilters, TransactionExportFilters } from '@/services/admin.service';
import { transactionService } from '@/services/transaction.service';
import {
  FiCreditCard,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiDownload,
} from '@/utils/icons';
import CustomSelect from '@/components/ui/CustomSelect';
import { paymentService } from '@/services/payment.service';
import toast from 'react-hot-toast';

type PeriodFilter = 'daily' | 'weekly' | 'monthly' | 'yearly' | '';

export default function TransactionsPage() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const limit = 20;

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Admin query
  const adminFilters: TransactionFilters = {
    ...(debouncedSearch && { reference: debouncedSearch }),
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { type: typeFilter }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    page,
    limit,
  };

  const { data: adminTxData, isLoading: adminTxLoading, isFetching: adminTxFetching, refetch } = useQuery({
    queryKey: ['admin', 'transactions', adminFilters],
    queryFn: () => adminService.getTransactions(adminFilters),
    enabled: !!user && isAdmin,
  });

  // Customer query (fallback for non-admin users)
  const { data: customerTxData, isLoading: customerTxLoading, isFetching: customerTxFetching, refetch: customerRefetch } = useQuery({
    queryKey: ['transactions', 'customer', statusFilter, periodFilter, page],
    queryFn: () => transactionService.getTransactions({
      status: statusFilter || undefined,
      period: periodFilter || undefined,
      page,
      limit,
    }),
    enabled: !!user && !isAdmin,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';
  const txLoading = isAdmin ? adminTxLoading : customerTxLoading;
  const txFetching = isAdmin ? adminTxFetching : customerTxFetching;
  const transactions = isAdmin ? (adminTxData?.data || []) : (customerTxData?.data || []);
  const total = isAdmin ? (adminTxData?.total || 0) : (customerTxData?.total || 0);
  const totalPages = Math.ceil(total / limit);

  const hasActiveFilters = !!(debouncedSearch || statusFilter || typeFilter || startDate || endDate || periodFilter);

  const clearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setPeriodFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      let blob: Blob;
      if (isAdmin) {
        const filters: TransactionExportFilters = {
          ...(typeFilter && { type: typeFilter }),
          ...(statusFilter && { status: statusFilter }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        };
        blob = await adminService.exportTransactions(filters);
      } else {
        blob = await paymentService.exportTransactionHistory({
          period: periodFilter || undefined,
          status: statusFilter || undefined,
        });
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const period = periodFilter || 'all';
      a.href = url;
      a.download = `transactions_${period}_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const periodOptions: { value: PeriodFilter; label: string }[] = [
    { value: '', label: 'All Time' },
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
    { value: 'yearly', label: 'This Year' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESSFUL':
      case 'COMPLETED':
      case 'SUCCESS':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
      case 'FAILED':
        return 'bg-red-50 text-red-700 ring-1 ring-red-600/20';
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
      default:
        return 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESSFUL':
      case 'COMPLETED':
      case 'SUCCESS':
        return <FiCheckCircle className="w-3.5 h-3.5" />;
      case 'FAILED':
        return <FiXCircle className="w-3.5 h-3.5" />;
      default:
        return <FiClock className="w-3.5 h-3.5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'WALLET_FUNDING': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
      case 'PAYMENT': return 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20';
      case 'REWARD_REDEMPTION': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
      case 'TRANSFER': return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20';
      case 'REFUND': return 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20';
      default: return 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20';
    }
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
              <FiCreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887]">Transactions</h1>
              <p className="text-gray-500 text-sm">
                {isAdmin ? 'Manage all transactions' : 'View your transaction history'}
                {total > 0 && <span className="text-gray-400"> &middot; {total.toLocaleString()} total</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start">
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
              title="Export as PDF"
            >
              <FiDownload className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
            </button>
            <button
              onClick={() => isAdmin ? refetch?.() : customerRefetch?.()}
              className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              title="Refresh transactions"
            >
              <FiRefreshCw className={`w-5 h-5 ${txFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={isAdmin ? 'Search by reference...' : 'Search transactions...'}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
              <div className="flex items-center gap-2 text-gray-400 sm:pb-2.5">
                <FiFilter className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 w-full sm:w-auto flex-1">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Status</label>
                  <CustomSelect
                    value={statusFilter}
                    onChange={(v) => { setStatusFilter(v); setPage(1); }}
                    options={[
                      { value: '', label: 'All Status' },
                      { value: 'SUCCESSFUL', label: 'Successful' },
                      { value: 'PENDING', label: 'Pending' },
                      { value: 'PROCESSING', label: 'Processing' },
                      { value: 'FAILED', label: 'Failed' },
                    ]}
                  />
                </div>
                {!isAdmin && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">Period</label>
                    <CustomSelect
                      value={periodFilter}
                      onChange={(v) => { setPeriodFilter(v as PeriodFilter); setPage(1); }}
                      options={periodOptions}
                    />
                  </div>
                )}
                {isAdmin && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1.5">Type</label>
                      <CustomSelect
                        value={typeFilter}
                        onChange={(v) => { setTypeFilter(v); setPage(1); }}
                        options={[
                          { value: '', label: 'All Types' },
                          { value: 'WALLET_FUNDING', label: 'Wallet Funding' },
                          { value: 'PAYMENT', label: 'Payment' },
                          { value: 'REWARD_REDEMPTION', label: 'Reward Redemption' },
                          { value: 'TRANSFER', label: 'Transfer' },
                          { value: 'REFUND', label: 'Refund' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1.5">From</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                        className="select-field text-sm !py-2.5"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1.5">To</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                        className="select-field text-sm !py-2.5"
                      />
                    </div>
                  </>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:text-primary-light font-semibold whitespace-nowrap pb-2.5"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm flex flex-col">
          {txLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : transactions.length > 0 ? (
            <>
              <div className="overflow-x-auto min-w-0">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/5">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#94A3B8] whitespace-nowrap min-w-[180px]">Reference</th>
                      {isAdmin && (
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#94A3B8] whitespace-nowrap min-w-[180px]">User</th>
                      )}
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#94A3B8] whitespace-nowrap min-w-[160px]">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#94A3B8] whitespace-nowrap min-w-[140px]">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#94A3B8] whitespace-nowrap min-w-[140px]">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-[#94A3B8] whitespace-nowrap min-w-[130px]">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {transactions.map((tx: any) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-gray-50/60 dark:hover:bg-white/[0.04] transition-colors cursor-pointer group"
                        onClick={() => router.push(`/dashboard/transactions/${tx.id}`)}
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-mono text-sm text-gray-900 font-medium whitespace-nowrap">
                            {tx.reference?.substring(0, 22)}...
                          </p>
                        </td>
                        {isAdmin && (
                          <td className="py-3.5 px-4">
                            {tx.user ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/users/${tx.user.id || tx.userId}`); }}
                                className="text-left hover:text-primary transition-colors"
                              >
                                <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                                  {tx.user.firstName} {tx.user.lastName}
                                </p>
                                <p className="text-xs text-gray-400 whitespace-nowrap">{tx.user.phoneNumber || tx.user.email}</p>
                              </button>
                            ) : (
                              <span className="text-gray-300 text-sm">&mdash;</span>
                            )}
                          </td>
                        )}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold ${getTypeColor(tx.type)}`}>
                            {tx.type?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-bold text-gray-900 text-sm">
                            ₦{parseFloat(tx.amount).toLocaleString()}
                          </p>
                          {tx.fee && parseFloat(tx.fee) > 0 && (
                            <p className="text-[11px] text-gray-400 mt-0.5 whitespace-nowrap">
                              Fee: ₦{parseFloat(tx.fee).toLocaleString()}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(tx.status)}`}>
                            {getStatusIcon(tx.status)}
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="text-sm text-gray-700">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {transactions.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 gap-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{(page - 1) * limit + 1}</span>–<span className="font-semibold text-gray-700 dark:text-gray-300">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-gray-700 dark:text-gray-300">{total}</span>
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 px-3 min-w-[100px] text-center">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiCreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold mb-1">No transactions found</p>
              <p className="text-sm text-gray-400">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'No transactions have been recorded yet'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm text-primary hover:text-primary-light font-semibold"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
  );
}
