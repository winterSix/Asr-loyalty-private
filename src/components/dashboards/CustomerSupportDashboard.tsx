'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { transactionService } from '@/services/transaction.service';
import { disputeService } from '@/services/dispute.service';
import { refundService } from '@/services/refund.service';
import {
  FiUsers,
  FiCreditCard,
  FiShield,
  FiDollarSign,
  FiCheckCircle,
  FiArrowRight,
} from '@/utils/icons';

export default function CustomerSupportDashboard() {
  const router = useRouter();

  const { data: disputes } = useQuery({
    queryKey: ['disputes', 'support'],
    queryFn: () => disputeService.getDisputes({ page: 1, limit: 10 }),
  });

  const { data: refunds } = useQuery({
    queryKey: ['refunds', 'support'],
    queryFn: () => refundService.getRefunds({ page: 1, limit: 10 }),
  });

  const statCards = [
    {
      label: 'Open Disputes',
      value: disputes?.data?.filter((d) => d.status === 'OPEN').length || 0,
      icon: <FiShield className="w-6 h-6" />,
      color: 'bg-yellow-500',
      action: () => router.push('/dashboard/disputes?status=OPEN'),
    },
    {
      label: 'Pending Refunds',
      value: refunds?.data?.filter((r) => r.status === 'PENDING').length || 0,
      icon: <FiDollarSign className="w-6 h-6" />,
      color: 'bg-red-500',
      action: () => router.push('/dashboard/refunds?status=PENDING'),
    },
    {
      label: 'Resolved Today',
      value: '12',
      icon: <FiCheckCircle className="w-6 h-6" />,
      color: 'bg-green-500',
      action: () => router.push('/dashboard/disputes?status=RESOLVED'),
    },
    {
      label: 'Total Tickets',
      value: (disputes?.total || 0) + (refunds?.total || 0),
      icon: <FiCreditCard className="w-6 h-6" />,
      color: 'bg-blue-500',
      action: () => router.push('/dashboard/disputes'),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-[#E5B887] mb-2">Customer Support Dashboard</h1>
        <p className="text-gray-600">Manage customer disputes, refunds, and support tickets</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            onClick={card.action}
            className="card card-hover cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 ${card.color} text-white rounded-xl`}>
                {card.icon}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Disputes */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Disputes</h2>
              <button
                onClick={() => router.push('/dashboard/disputes')}
                className="text-primary hover:text-primary-light font-medium flex items-center gap-2"
              >
                View All <FiArrowRight className="w-4 h-4" />
              </button>
            </div>
            {disputes?.data && disputes.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Transaction</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Reason</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.data.slice(0, 10).map((dispute) => (
                      <tr key={dispute.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <p className="font-mono text-xs text-gray-900">
                            {dispute.transactionId.substring(0, 12)}...
                          </p>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-700">{dispute.reason}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            dispute.status === 'RESOLVED'
                              ? 'bg-green-100 text-green-700'
                              : dispute.status === 'REJECTED'
                              ? 'bg-red-100 text-red-700'
                              : dispute.status === 'OPEN'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {dispute.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {new Date(dispute.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => router.push(`/dashboard/disputes/${dispute.id}`)}
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
                <p className="text-gray-500">No disputes found</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {refunds?.data && refunds.data.filter((r) => r.status === 'PENDING').length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Pending Refunds</h2>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                  {refunds.data.filter((r) => r.status === 'PENDING').length}
                </span>
              </div>
              <div className="space-y-3">
                {refunds.data
                  .filter((r) => r.status === 'PENDING')
                  .slice(0, 5)
                  .map((refund) => (
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
                onClick={() => router.push('/dashboard/disputes')}
                className="w-full btn-primary text-sm flex items-center justify-center gap-2"
              >
                <FiShield className="w-4 h-4" />
                Manage Disputes
              </button>
              <button
                onClick={() => router.push('/dashboard/refunds')}
                className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
              >
                <FiDollarSign className="w-4 h-4" />
                Process Refunds
              </button>
              <button
                onClick={() => router.push('/dashboard/users')}
                className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
              >
                <FiUsers className="w-4 h-4" />
                View Users
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
