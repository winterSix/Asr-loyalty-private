'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { disputeService } from '@/services/dispute.service';
import {
  FiShield,
  FiSearch,
  FiFilter,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from '@/utils/icons';

export default function DisputesPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  const { data: disputes, isLoading: disputesLoading } = useQuery({
    queryKey: ['disputes', statusFilter, user?.role],
    queryFn: () => {
      // Use different endpoint based on role
      if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'CUSTOMER_SUPPORT') {
        return disputeService.getDisputes({ status: statusFilter || undefined, page: 1, limit: 50 });
      } else {
        return disputeService.getMyDisputes({ page: 1, limit: 50 });
      }
    },
    enabled: !!user,
  });

  if (isLoading || disputesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-700';
      case 'INVESTIGATING':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <FiCheckCircle className="w-4 h-4" />;
      case 'REJECTED':
        return <FiXCircle className="w-4 h-4" />;
      default:
        return <FiClock className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout role={role}>
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Disputes</h1>
          <p className="text-gray-600">Manage and resolve transaction disputes</p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search disputes..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Status</option>
                <option value="OPEN">Open</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ESCALATED">Escalated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Disputes Table */}
        <div className="card">
          {disputes?.data && disputes.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Transaction ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Reason</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.data.map((dispute) => (
                    <tr key={dispute.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <p className="font-mono text-sm text-gray-900">
                          {dispute.transactionId.substring(0, 16)}...
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-gray-900">{dispute.reason}</p>
                        {dispute.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {dispute.description}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
                          {getStatusIcon(dispute.status)}
                          {dispute.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => router.push(`/dashboard/disputes/${dispute.id}`)}
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
              <FiShield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No disputes found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

