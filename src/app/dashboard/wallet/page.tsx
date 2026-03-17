'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { walletService } from '@/services/wallet.service';
import {
  FiWallet,
  FiPlus,
  FiTrendingUp,
  FiTrendingDown,
  FiArrowRight,
} from '@/utils/icons';

export default function WalletPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const { data: walletBalance, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletService.getBalance(),
    enabled: !!user,
  });

  const { data: ledger } = useQuery({
    queryKey: ['wallet-ledger', 'MAIN'],
    queryFn: () => walletService.getLedger('MAIN', { page: 1, limit: 20 }),
    enabled: !!user,
  });

  if (isLoading || walletsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-[#E5B887] mb-2">My Wallets</h1>
          <p className="text-gray-600">Manage your wallet balances and transactions</p>
        </div>

        {/* Wallet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Main Wallet */}
          <div className="bg-gradient-primary text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/90 text-sm mb-2">Main Wallet</p>
                <h2 className="text-4xl font-bold">
                  ₦{walletBalance ? parseFloat(walletBalance.main.balance).toLocaleString() : '0.00'}
                </h2>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <FiWallet className="w-8 h-8" />
              </div>
            </div>
            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/20">
              <div>
                <p className="text-white/70 text-xs mb-1">Available</p>
                <p className="text-lg font-semibold">
                  ₦{walletBalance ? parseFloat(walletBalance.main.availableBalance).toLocaleString() : '0.00'}
                </p>
              </div>
              <div>
                <p className="text-white/70 text-xs mb-1">Pending</p>
                <p className="text-lg font-semibold">
                  ₦{walletBalance ? parseFloat(walletBalance.main.pendingBalance).toLocaleString() : '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Reward Wallet */}
          <div className="bg-gradient-warm text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/90 text-sm mb-2">Reward Wallet</p>
                <h2 className="text-4xl font-bold">
                  {walletBalance ? parseFloat(walletBalance.reward.balance).toLocaleString() : '0'} pts
                </h2>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <FiWallet className="w-8 h-8" />
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/rewards')}
              className="mt-6 bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold 
                       hover:bg-white/90 transition-all"
            >
              View Rewards
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
            <button
              onClick={() => router.push('/dashboard/wallet/fund')}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              Fund Wallet
            </button>
          </div>

          {ledger?.data && ledger.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Balance After</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.data.map((entry) => {
                    const isCredit = entry.type.includes('FUNDING') || entry.type.includes('CREDIT');
                    return (
                      <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isCredit
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {entry.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-700">{entry.description}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {isCredit ? (
                              <FiTrendingUp className="w-4 h-4 text-green-500" />
                            ) : (
                              <FiTrendingDown className="w-4 h-4 text-red-500" />
                            )}
                            <span
                              className={`font-bold ${
                                isCredit ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {isCredit ? '+' : '-'}₦{parseFloat(entry.amount).toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-gray-900">
                            ₦{parseFloat(entry.balanceAfter).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No transaction history</p>
            </div>
          )}
        </div>
      </div>
  );
}
