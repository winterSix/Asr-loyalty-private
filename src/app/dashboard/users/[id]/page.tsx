'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { walletService } from '@/services/wallet.service';
import toast from 'react-hot-toast';
import {
  FiUsers,
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiShield,
  FiCreditCard,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiX,
  FiLock,
  FiUnlock,
} from '@/utils/icons';

export default function UserDetailPage() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const queryClient = useQueryClient();

  // Modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [statusAction, setStatusAction] = useState<'ACTIVE' | 'SUSPENDED'>('SUSPENDED');
  const [suspendReason, setSuspendReason] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Wallet freeze modal state
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeAction, setFreezeAction] = useState<'freeze' | 'unfreeze'>('freeze');
  const [freezeWalletType, setFreezeWalletType] = useState<'MAIN' | 'REWARDS'>('MAIN');
  const [freezeReason, setFreezeReason] = useState('');

  // Fetch user data using admin service (no UUID validation on admin routes)
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => adminService.getUserById(userId),
    enabled: !!userId && !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  // Fetch user's wallets
  const { data: userWallets } = useQuery({
    queryKey: ['admin', 'user', userId, 'wallets'],
    queryFn: () => adminService.getUserWallets(userId),
    enabled: !!userId && !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  // Fetch user's transactions
  const { data: userTransactions } = useQuery({
    queryKey: ['admin', 'user', userId, 'transactions'],
    queryFn: () => adminService.getUserTransactions(userId, { page: 1, limit: 5 }),
    enabled: !!userId && !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'),
  });

  // Update user status mutation
  const statusMutation = useMutation({
    mutationFn: (data: { status: string; reason?: string }) =>
      adminService.updateUserStatus(userId, data),
    onSuccess: () => {
      toast.success(`User ${statusAction === 'ACTIVE' ? 'activated' : 'suspended'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowStatusModal(false);
      setSuspendReason('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update user status');
    },
  });

  // Update user role mutation
  const roleMutation = useMutation({
    mutationFn: (data: { role: string }) =>
      adminService.updateUserRole(userId, data),
    onSuccess: () => {
      toast.success('User role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowRoleModal(false);
      setSelectedRole('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update user role');
    },
  });

  // Freeze / unfreeze wallet mutation
  const freezeMutation = useMutation({
    mutationFn: () =>
      freezeAction === 'freeze'
        ? walletService.freezeWallet(userId, freezeWalletType, freezeReason)
        : walletService.unfreezeWallet(userId, freezeWalletType),
    onSuccess: () => {
      toast.success(`Wallet ${freezeAction === 'freeze' ? 'frozen' : 'unfrozen'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId, 'wallets'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
      setShowFreezeModal(false);
      setFreezeReason('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || `Failed to ${freezeAction} wallet`);
    },
  });

  const openFreezeModal = (action: 'freeze' | 'unfreeze', walletType: 'MAIN' | 'REWARDS') => {
    setFreezeAction(action);
    setFreezeWalletType(walletType);
    setFreezeReason('');
    setShowFreezeModal(true);
  };

  const handleStatusChange = () => {
    statusMutation.mutate({
      status: statusAction,
      ...(statusAction === 'SUSPENDED' && suspendReason ? { reason: suspendReason } : {}),
    });
  };

  const handleRoleChange = () => {
    if (!selectedRole) return;
    roleMutation.mutate({ role: selectedRole });
  };

  const openStatusModal = (action: 'ACTIVE' | 'SUSPENDED') => {
    setStatusAction(action);
    setSuspendReason('');
    setShowStatusModal(true);
  };

  if (isLoading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Combine wallets from user data and dedicated wallet endpoint
  const wallets = userWallets || userData?.wallets || [];
  // Use dedicated transactions endpoint or fallback to user's recent transactions
  const recentTx = userTransactions?.data || userData?.recentTransactions || [];

  return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/users')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Users
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">User Details</h1>
              <p className="text-gray-600">View and manage user information</p>
            </div>
            {/* Action Buttons */}
            {userData && (
              <div className="flex items-center gap-3">
                {userData.status === 'ACTIVE' ? (
                  <button
                    onClick={() => openStatusModal('SUSPENDED')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors font-medium text-sm"
                  >
                    <FiXCircle className="w-4 h-4" />
                    Suspend User
                  </button>
                ) : (
                  <button
                    onClick={() => openStatusModal('ACTIVE')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors font-medium text-sm"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    Activate User
                  </button>
                )}
                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setSelectedRole(userData.role || '');
                      setShowRoleModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors font-medium text-sm"
                  >
                    <FiShield className="w-4 h-4" />
                    Change Role
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {!userData ? (
          <div className="card text-center py-12">
            <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">User not found or access denied</p>
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-semibold text-gray-700 mb-2">User ID:</p>
              <p className="text-xs font-mono text-gray-600">{userId}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* User Information */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">User Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-500">Full Name</label>
                    <p className="text-gray-900 mt-1 font-medium">
                      {userData.firstName} {userData.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500">Email</label>
                    <div className="flex items-center gap-2 mt-1">
                      <FiMail className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{userData.email || '—'}</p>
                      {userData.emailVerified && (
                        <FiCheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500">Phone</label>
                    <div className="flex items-center gap-2 mt-1">
                      <FiPhone className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{userData.phoneNumber}</p>
                      {userData.phoneVerified && (
                        <FiCheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500">Role</label>
                    <p className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        userData.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' :
                        userData.role === 'ADMIN' ? 'bg-yellow-100 text-yellow-700' :
                        userData.role === 'CASHIER' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {userData.role?.replace('_', ' ')}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500">Status</label>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        userData.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : userData.status === 'SUSPENDED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {userData.status}
                      </span>
                      {userData.mustChangePassword && (
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200"
                          title="This user is using a temporary password and has not yet changed it"
                        >
                          Temporary Password Active
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500">Loyalty Tier</label>
                    <p className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        (userData.tier || userData.currentTier)?.toUpperCase() === 'PLATINUM' ? 'bg-indigo-100 text-indigo-700' :
                        (userData.tier || userData.currentTier)?.toUpperCase() === 'GOLD' ? 'bg-amber-100 text-amber-700' :
                        (userData.tier || userData.currentTier)?.toUpperCase() === 'SILVER' ? 'bg-slate-200 text-slate-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {userData.tier || userData.currentTier || 'BRONZE'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500">Member Since</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(userData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                  {userData.lastLoginAt && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Last Login</label>
                      <p className="text-gray-900 mt-1">
                        {new Date(userData.lastLoginAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Wallets */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Wallets</h2>
                {wallets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {wallets.map((wallet: any) => {
                      const wType: 'MAIN' | 'REWARDS' = wallet.type === 'MAIN' ? 'MAIN' : 'REWARDS';
                      const isFrozen = wallet.isActive === false;
                      return (
                        <div key={wallet.id} className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FiCreditCard className="w-4 h-4 text-gray-500" />
                              <p className="font-semibold text-gray-700 text-sm">
                                {wallet.type || wallet.currency} Wallet
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              isFrozen ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {isFrozen ? 'Frozen' : 'Active'}
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {wallet.currency === 'NGN' ? '₦' : ''}{parseFloat(wallet.balance).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 mb-3">{wallet.currency}</p>
                          {isFrozen ? (
                            <button
                              onClick={() => openFreezeModal('unfreeze', wType)}
                              className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <FiUnlock className="w-3.5 h-3.5" /> Unfreeze Wallet
                            </button>
                          ) : (
                            <button
                              onClick={() => openFreezeModal('freeze', wType)}
                              className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <FiLock className="w-3.5 h-3.5" /> Freeze Wallet
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FiCreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No wallets found</p>
                  </div>
                )}
              </div>

              {/* Recent Transactions */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
                  {recentTx.length > 0 && (
                    <button
                      onClick={() => router.push(`/dashboard/transactions?userId=${userId}`)}
                      className="text-primary hover:text-primary-light text-sm font-medium transition-colors"
                    >
                      View All
                    </button>
                  )}
                </div>
                {recentTx.length > 0 ? (
                  <div className="space-y-3">
                    {recentTx.map((tx: any) => (
                      <div
                        key={tx.id}
                        onClick={() => router.push(`/dashboard/transactions/${tx.id}`)}
                        className="p-3 rounded-xl bg-gray-50 flex justify-between items-center hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{(tx.type || '').replace(/_/g, ' ')}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            ₦{parseFloat(tx.amount).toLocaleString()}
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            tx.status === 'COMPLETED' || tx.status === 'SUCCESS' || tx.status === 'SUCCESSFUL'
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
                ) : (
                  <div className="text-center py-6">
                    <FiCreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No transactions yet</p>
                  </div>
                )}
              </div>
              {/* Loyalty History */}
              {userData.loyaltyHistory && userData.loyaltyHistory.length > 0 && (
                <div className="card">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Loyalty History</h2>
                  <div className="space-y-3">
                    {userData.loyaltyHistory.map((entry: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-gray-50 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {entry.action || entry.type || 'Loyalty Event'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {entry.points != null && (
                            <p className="font-bold text-indigo-600 text-sm">
                              {entry.points > 0 ? '+' : ''}{entry.points} pts
                            </p>
                          )}
                          {entry.tier && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700">
                              {entry.tier}
                            </span>
                          )}
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
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Transactions</span>
                    <span className="font-bold text-lg">
                      {userData._count?.transactions ?? userData.totalTransactions ?? 0}
                    </span>
                  </div>
                  {userData.totalSpent != null && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Total Spent</span>
                      <span className="font-bold text-lg">₦{Number(userData.totalSpent).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Disputes</span>
                    <span className="font-bold text-lg">{userData._count?.disputes ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Refunds</span>
                    <span className="font-bold text-lg">{userData._count?.refunds ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Verification</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Phone</span>
                    {userData.phoneVerified ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <FiCheckCircle className="w-4 h-4" /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400 text-sm">
                        <FiXCircle className="w-4 h-4" /> Not verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Email</span>
                    {userData.emailVerified ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <FiCheckCircle className="w-4 h-4" /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400 text-sm">
                        <FiXCircle className="w-4 h-4" /> Not verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Devices */}
              {userData.devices && userData.devices.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Devices</h3>
                  <div className="space-y-2">
                    {userData.devices.map((device: any) => (
                      <div key={device.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{device.deviceName || 'Unknown Device'}</p>
                          {device.lastSeenAt && (
                            <p className="text-xs text-gray-500">
                              Last seen: {new Date(device.lastSeenAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          device.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {device.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User ID Card */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">User ID</h3>
                <p className="text-xs font-mono text-gray-600 break-all bg-gray-50 p-3 rounded-lg">
                  {userData.id}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Last updated: {new Date(userData.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Change Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {statusAction === 'SUSPENDED' ? 'Suspend User' : 'Activate User'}
                </h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className={`p-4 rounded-xl mb-4 ${
                statusAction === 'SUSPENDED' ? 'bg-red-50' : 'bg-green-50'
              }`}>
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className={`w-5 h-5 mt-0.5 ${
                    statusAction === 'SUSPENDED' ? 'text-red-500' : 'text-green-500'
                  }`} />
                  <p className={`text-sm ${
                    statusAction === 'SUSPENDED' ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {statusAction === 'SUSPENDED'
                      ? `Are you sure you want to suspend ${userData?.firstName} ${userData?.lastName}? They will lose access to their account.`
                      : `Are you sure you want to reactivate ${userData?.firstName} ${userData?.lastName}'s account?`
                    }
                  </p>
                </div>
              </div>

              {statusAction === 'SUSPENDED' && (
                <div className="mb-4">
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Reason (optional)
                  </label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Enter reason for suspension..."
                    className="input-field resize-none h-20"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusChange}
                  disabled={statusMutation.isPending}
                  className={`px-4 py-2 rounded-xl font-medium text-sm text-white transition-colors disabled:opacity-50 ${
                    statusAction === 'SUSPENDED'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {statusMutation.isPending
                    ? 'Processing...'
                    : statusAction === 'SUSPENDED' ? 'Suspend User' : 'Activate User'
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Freeze / Unfreeze Modal */}
        {showFreezeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {freezeAction === 'freeze' ? 'Freeze' : 'Unfreeze'} {freezeWalletType} Wallet
                </h3>
                <button
                  onClick={() => setShowFreezeModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className={`p-4 rounded-xl mb-4 ${freezeAction === 'freeze' ? 'bg-blue-50' : 'bg-green-50'}`}>
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className={`w-5 h-5 mt-0.5 ${freezeAction === 'freeze' ? 'text-blue-500' : 'text-green-500'}`} />
                  <p className={`text-sm ${freezeAction === 'freeze' ? 'text-blue-700' : 'text-green-700'}`}>
                    {freezeAction === 'freeze'
                      ? `This will freeze ${userData?.firstName}'s ${freezeWalletType} wallet. They will not be able to use it until unfrozen.`
                      : `This will restore ${userData?.firstName}'s ${freezeWalletType} wallet to active status.`}
                  </p>
                </div>
              </div>
              {freezeAction === 'freeze' && (
                <div className="mb-4">
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={freezeReason}
                    onChange={(e) => setFreezeReason(e.target.value)}
                    placeholder="Enter reason for freezing..."
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                  />
                </div>
              )}
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowFreezeModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => freezeMutation.mutate()}
                  disabled={freezeMutation.isPending || (freezeAction === 'freeze' && !freezeReason.trim())}
                  className={`px-4 py-2 rounded-xl font-medium text-sm text-white transition-colors disabled:opacity-50 ${
                    freezeAction === 'freeze' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {freezeMutation.isPending
                    ? 'Processing...'
                    : freezeAction === 'freeze' ? 'Freeze Wallet' : 'Unfreeze Wallet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role Change Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Change User Role</h3>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-indigo-50 p-4 rounded-xl mb-4">
                <div className="flex items-start gap-3">
                  <FiShield className="w-5 h-5 mt-0.5 text-indigo-500" />
                  <p className="text-sm text-indigo-700">
                    Changing the role for <strong>{userData?.firstName} {userData?.lastName}</strong>.
                    Current role: <strong>{userData?.role?.replace('_', ' ')}</strong>
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  New Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select role...</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="CASHIER">Cashier</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleChange}
                  disabled={roleMutation.isPending || !selectedRole || selectedRole === userData?.role}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
                >
                  {roleMutation.isPending ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
