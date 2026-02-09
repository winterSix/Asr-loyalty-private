'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { walletService } from '@/services/wallet.service';
import { userService } from '@/services/user.service';
import {
  FiWallet,
  FiEye,
  FiSearch,
} from '@/utils/icons';

export default function WalletsPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  // Note: getAllUsers endpoint doesn't exist yet
  const users = { data: [] as any[] };

  if (isLoading) {
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Wallets Management</h1>
          <p className="text-gray-600">View and manage all user wallets</p>
        </div>

        {/* Search */}
        <div className="card mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Wallets List */}
        <div className="card">
          {users.data && users.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Main Wallet</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Reward Wallet</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total Balance</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.map((u: any) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-gray-900">₦0.00</p>
                        <p className="text-xs text-gray-500">Loading...</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-gray-900">0 pts</p>
                        <p className="text-xs text-gray-500">Loading...</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-lg text-gray-900">₦0.00</p>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => router.push(`/dashboard/wallets/${u.id}`)}
                          className="text-primary hover:text-primary-light"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FiWallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">User management endpoint not available yet</p>
              <p className="text-xs text-gray-400 mt-2">Backend endpoint needs to be added</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

