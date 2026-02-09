'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { roleService } from '@/services/role.service';
import { adminService } from '@/services/admin.service';
import {
  FiUsers,
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiShield,
  FiStar,
  FiCreditCard,
} from '@/utils/icons';

export default function UserDetailPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  // Fetch user data using admin service
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => adminService.getUserById(userId),
    enabled: !!userId && !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  // Get user roles if available
  const { data: userRoles } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: () => roleService.getUserRoles(userId),
    enabled: !!userId && !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  // Get user permissions if available
  const { data: userPermissions } = useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: () => roleService.getUserPermissions(userId),
    enabled: !!userId && !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  if (isLoading || userLoading) {
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
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Users
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">User Details</h1>
          <p className="text-gray-600">View user information and manage roles</p>
        </div>

        {!userData ? (
          <div className="card text-center py-12">
            <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">User not found or access denied</p>
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-semibold text-gray-700 mb-2">User ID:</p>
              <p className="text-xs font-mono text-gray-600">{userId}</p>
            </div>
            {userRoles && userRoles.length > 0 && (
              <div className="mt-6 text-left">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Assigned Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {userRoles.map((r) => (
                    <span
                      key={r.id}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-primary text-white"
                    >
                      {r.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {userPermissions && userPermissions.length > 0 && (
              <div className="mt-6 text-left">
                <h3 className="text-lg font-bold text-gray-900 mb-3">User Permissions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {userPermissions.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                    >
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-gray-500">{p.resource}:{p.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">User Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Name</label>
                    <p className="text-gray-900 mt-1">
                      {userData.firstName} {userData.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <p className="text-gray-900 mt-1">{userData.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Phone</label>
                    <p className="text-gray-900 mt-1">{userData.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Role</label>
                    <p className="text-gray-900 mt-1">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {userData.role?.replace('_', ' ')}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Status</label>
                    <p className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        userData.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : userData.status === 'SUSPENDED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {userData.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Phone Verified</label>
                    <p className="text-gray-900 mt-1">{userData.phoneVerified ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Member Since</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(userData.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallets */}
              {userData.wallets && userData.wallets.length > 0 && (
                <div className="card">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Wallets</h2>
                  <div className="space-y-3">
                    {userData.wallets.map((wallet) => (
                      <div key={wallet.id} className="p-4 rounded-xl bg-gray-50 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {wallet.currency} Wallet
                          </p>
                          <p className="text-xs text-gray-500 font-mono">{wallet.id}</p>
                        </div>
                        <p className="text-xl font-bold text-gray-900">
                          ₦{parseFloat(wallet.balance).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              {userData.recentTransactions && userData.recentTransactions.length > 0 && (
                <div className="card">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
                  <div className="space-y-3">
                    {userData.recentTransactions.map((tx: { id: string; type: string; amount: string; status: string; createdAt: string }) => (
                      <div key={tx.id} className="p-3 rounded-xl bg-gray-50 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900">{tx.type}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            ₦{parseFloat(tx.amount).toLocaleString()}
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            tx.status === 'COMPLETED' || tx.status === 'SUCCESS'
                              ? 'bg-green-100 text-green-700'
                              : tx.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Stats */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transactions</span>
                    <span className="font-bold">{userData.transactionCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Disputes</span>
                    <span className="font-bold">{userData.disputeCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refunds</span>
                    <span className="font-bold">{userData.refundCount || 0}</span>
                  </div>
                </div>
              </div>

              {/* Roles & Permissions */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Roles & Permissions</h3>
                {userRoles && userRoles.length > 0 ? (
                  <div className="space-y-2">
                    {userRoles.map((r) => (
                      <div key={r.id} className="p-3 rounded-lg bg-gray-50">
                        <p className="font-semibold text-gray-900">{r.name}</p>
                        {r.description && (
                          <p className="text-xs text-gray-500 mt-1">{r.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No roles assigned</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
