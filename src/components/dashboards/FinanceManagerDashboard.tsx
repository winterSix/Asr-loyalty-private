'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { transactionService } from '@/services/transaction.service';
import { refundService } from '@/services/refund.service';
import { disputeService } from '@/services/dispute.service';
import {
  FiWallet,
  FiCreditCard,
  FiDollarSign,
  FiShield,
  FiTrendingUp,
  FiArrowRight,
} from '@/utils/icons';

export default function FinanceManagerDashboard() {
  const router = useRouter();

  const { data: transactions } = useQuery({
    queryKey: ['transactions', 'finance'],
    queryFn: () => transactionService.getTransactions({ page: 1, limit: 10 }),
  });

  const { data: refunds } = useQuery({
    queryKey: ['refunds', 'finance'],
    queryFn: () => refundService.getRefunds({ page: 1, limit: 10 }),
  });

  const { data: disputes } = useQuery({
    queryKey: ['disputes', 'finance'],
    queryFn: () => disputeService.getDisputes({ page: 1, limit: 5 }),
  });

  const statCards = [
    {
      label: 'Total Revenue',
      value: '₦2,450,000',
      icon: <FiWallet className="w-6 h-6" />,
      color: 'bg-green-500',
      change: '+12.5%',
    },
    {
      label: 'Pending Refunds',
      value: refunds?.total || 0,
      icon: <FiDollarSign className="w-6 h-6" />,
      color: 'bg-yellow-500',
      change: '+3',
    },
    {
      label: 'Active Disputes',
      value: disputes?.total || 0,
      icon: <FiShield className="w-6 h-6" />,
      color: 'bg-red-500',
      change: '-2',
    },
    {
      label: 'Transactions',
      value: transactions?.total || 0,
      icon: <FiCreditCard className="w-6 h-6" />,
      color: 'bg-blue-500',
      change: '+15%',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-[#E5B887] mb-2">Finance Dashboard</h1>
        <p className="text-gray-600">Financial overview and transaction management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="card card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 ${card.color} text-white rounded-xl`}>
                {card.icon}
              </div>
              <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                <FiTrendingUp className="w-3 h-3" />
                {card.change}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
              <button
                onClick={() => router.push('/dashboard/transactions')}
                className="text-primary hover:text-primary-light font-medium flex items-center gap-2"
              >
                View All <FiArrowRight className="w-4 h-4" />
              </button>
            </div>
            {transactions?.data && transactions.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Reference</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.data.slice(0, 10).map((tx) => (
                      <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <p className="font-mono text-xs text-gray-900">
                            {tx.reference.substring(0, 12)}...
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-gray-900">
                            ₦{parseFloat(tx.amount).toLocaleString()}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            tx.status === 'SUCCESSFUL'
                              ? 'bg-green-100 text-green-700'
                              : tx.status === 'FAILED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => router.push(`/dashboard/transactions/${tx.id}`)}
                            className="text-primary hover:text-primary-light text-sm"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No transactions found</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {refunds?.data && refunds.data.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Pending Refunds</h2>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                  {refunds.total}
                </span>
              </div>
              <div className="space-y-3">
                {refunds.data.slice(0, 5).map((refund) => (
                  <div
                    key={refund.id}
                    onClick={() => router.push(`/dashboard/refunds/${refund.id}`)}
                    className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">
                          ₦{parseFloat(refund.amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(refund.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        {refund.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push('/dashboard/refunds')}
                className="w-full mt-4 btn-secondary text-sm"
              >
                View All Refunds
              </button>
            </div>
          )}

          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/dashboard/reports')}
                className="w-full btn-primary text-sm flex items-center justify-center gap-2"
              >
                <FiTrendingUp className="w-4 h-4" />
                View Reports
              </button>
              <button
                onClick={() => router.push('/dashboard/refunds')}
                className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
              >
                <FiDollarSign className="w-4 h-4" />
                Manage Refunds
              </button>
              <button
                onClick={() => router.push('/dashboard/disputes')}
                className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
              >
                <FiShield className="w-4 h-4" />
                Review Disputes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
