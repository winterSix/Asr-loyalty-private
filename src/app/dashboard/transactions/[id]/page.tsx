'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { paymentService } from '@/services/payment.service';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiCreditCard,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUser,
  FiWallet,
  FiAlertTriangle,
  FiX,
  FiRefreshCw,
} from '@/utils/icons';

export default function TransactionDetailPage() {
  const { user, isLoading } = useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;
  const queryClient = useQueryClient();

  const [showReverseModal, setShowReverseModal] = useState(false);
  const [reverseReason, setReverseReason] = useState('');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'OTHERS';

  const reverseMutation = useMutation({
    mutationFn: () => paymentService.reversePayment(transactionId, reverseReason),
    onSuccess: () => {
      toast.success('Payment reversed successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'transaction', transactionId] });
      setShowReverseModal(false);
      setReverseReason('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to reverse payment');
    },
  });

  const { data: transaction, isLoading: txLoading } = useQuery({
    queryKey: ['admin', 'transaction', transactionId],
    queryFn: () => adminService.getTransactionById(transactionId),
    enabled: !!transactionId && !!user && isAdmin,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESSFUL':
      case 'COMPLETED':
      case 'SUCCESS':
        return 'bg-green-100 text-green-700';
      case 'FAILED':
        return 'bg-red-100 text-red-700';
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESSFUL':
      case 'COMPLETED':
      case 'SUCCESS':
        return <FiCheckCircle className="w-5 h-5 text-green-600" />;
      case 'FAILED':
        return <FiXCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FiClock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'WALLET_FUNDING': return 'bg-blue-100 text-blue-700';
      case 'PAYMENT': return 'bg-purple-100 text-purple-700';
      case 'REWARD_REDEMPTION': return 'bg-green-100 text-green-700';
      case 'TRANSFER': return 'bg-indigo-100 text-indigo-700';
      case 'REFUND': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <div>
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:hover:text-[#F1F5F9] transition-colors mb-4"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Transactions
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-[#E5B887] mb-2">Transaction Details</h1>
            {isAdmin && transaction?.status === 'SUCCESSFUL' && (
              <button
                onClick={() => setShowReverseModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors font-medium text-sm"
              >
                <FiRefreshCw className="w-4 h-4" />
                Reverse Payment
              </button>
            )}
          </div>
        </div>

        {txLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !transaction ? (
          <div className="card text-center py-12">
            <FiCreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Transaction not found</p>
            <p className="text-xs text-gray-400 mt-2">This transaction may not exist or you may not have access</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Transaction Info Card */}
              <div className="card">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white flex-shrink-0">
                      <FiCreditCard className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap">
                        ₦{parseFloat(transaction.amount).toLocaleString()}
                      </h2>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getTypeColor(transaction.type)}`}>
                        {transaction.type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                    {getStatusIcon(transaction.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Reference</p>
                    <p className="font-mono text-sm text-gray-900 break-all">{transaction.reference}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Currency</p>
                    <p className="font-semibold text-gray-900">{transaction.currency || 'NGN'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Created</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(transaction.updatedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Fee & Reward */}
                {(transaction.fee || transaction.rewardAmount) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {transaction.fee && parseFloat(transaction.fee) > 0 && (
                      <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <p className="text-xs text-orange-600 mb-1">Transaction Fee</p>
                        <p className="font-bold text-orange-700">
                          ₦{parseFloat(transaction.fee).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {transaction.rewardAmount && parseFloat(transaction.rewardAmount) > 0 && (
                      <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <p className="text-xs text-green-600 mb-1">Reward Earned</p>
                        <p className="font-bold text-green-700">
                          +{parseFloat(transaction.rewardAmount).toLocaleString()} pts
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {transaction.description && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-gray-900">{transaction.description}</p>
                  </div>
                )}
              </div>

              {/* Ledger Entries */}
              {transaction.ledgerEntries && transaction.ledgerEntries.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Ledger Entries</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaction.ledgerEntries.map((entry: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                entry.type === 'CREDIT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {entry.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-900">
                              ₦{parseFloat(entry.amount).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {entry.description || '—'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Rewards */}
              {transaction.rewards && transaction.rewards.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Rewards</h3>
                  <div className="space-y-3">
                    {transaction.rewards.map((reward: any, idx: number) => (
                      <div key={idx} className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-green-700">
                              +{parseFloat(reward.points || reward.amount || '0').toLocaleString()} pts
                            </p>
                            <p className="text-xs text-green-600 mt-1">{reward.description || reward.type}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            reward.status === 'CREDITED' ? 'bg-green-200 text-green-800' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {reward.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* User Info */}
              {transaction.user && (
                <div className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <FiUser className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold text-gray-900">User</h3>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {transaction.user.firstName?.[0]}{transaction.user.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {transaction.user.firstName} {transaction.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{transaction.user.email}</p>
                    </div>
                  </div>
                  {transaction.user.phoneNumber && (
                    <p className="text-sm text-gray-600 mb-3">{transaction.user.phoneNumber}</p>
                  )}
                  <button
                    onClick={() => router.push(`/dashboard/users/${transaction.user!.id || transaction.userId}`)}
                    className="btn-primary w-full text-sm py-2"
                  >
                    View User Profile
                  </button>
                </div>
              )}

              {/* Wallet Info */}
              {transaction.wallet && (
                <div className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <FiWallet className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold text-gray-900">Wallet</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Currency</p>
                      <p className="font-semibold text-gray-900">{transaction.wallet.currency}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Current Balance</p>
                      <p className="font-bold text-gray-900">
                        ₦{parseFloat(transaction.wallet.balance).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction ID */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-3">Transaction ID</h3>
                <p className="font-mono text-xs text-gray-600 break-all bg-gray-50 p-3 rounded-xl">
                  {transaction.id}
                </p>
              </div>

              {/* Dispute */}
              {transaction.dispute && (
                <div className="card border-l-4 border-amber-400">
                  <h3 className="font-bold text-gray-900 mb-3">Dispute</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.dispute.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                        transaction.dispute.status === 'OPEN' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {transaction.dispute.status}
                      </span>
                    </div>
                    {transaction.dispute.reason && (
                      <p className="text-sm text-gray-600">{transaction.dispute.reason}</p>
                    )}
                    <button
                      onClick={() => router.push(`/dashboard/disputes/${transaction.dispute.id}`)}
                      className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                    >
                      View Dispute
                    </button>
                  </div>
                </div>
              )}

              {/* Refund */}
              {transaction.refund && (
                <div className="card border-l-4 border-rose-400">
                  <h3 className="font-bold text-gray-900 mb-3">Refund</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Amount</span>
                      <span className="font-bold text-gray-900">
                        ₦{parseFloat(transaction.refund.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.refund.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        transaction.refund.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {transaction.refund.status}
                      </span>
                    </div>
                    <button
                      onClick={() => router.push(`/dashboard/refunds/${transaction.refund.id}`)}
                      className="text-rose-600 hover:text-rose-700 text-sm font-medium"
                    >
                      View Refund
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Reverse Payment Modal */}
      {showReverseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Reverse Payment</h3>
              <button
                onClick={() => { setShowReverseModal(false); setReverseReason(''); }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl mb-4">
              <div className="flex items-start gap-3">
                <FiAlertTriangle className="w-5 h-5 mt-0.5 text-orange-500" />
                <p className="text-sm text-orange-700">
                  This will reverse the payment of <strong>₦{parseFloat(transaction?.amount || '0').toLocaleString()}</strong> and return funds to the user&apos;s wallet. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-700 block mb-2">Reason <span className="text-red-500">*</span></label>
              <textarea
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                placeholder="Enter reason for reversal..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
              />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => { setShowReverseModal(false); setReverseReason(''); }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => reverseMutation.mutate()}
                disabled={reverseMutation.isPending || !reverseReason.trim()}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
              >
                {reverseMutation.isPending ? 'Reversing...' : 'Confirm Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
