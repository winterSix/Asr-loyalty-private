'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  FiBarChart,
  FiDownload,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiUsers,
  FiCreditCard,
} from '@/utils/icons';

export default function ReportsPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  const reportCards = [
    {
      title: 'Transaction Report',
      description: 'View all transaction details and analytics',
      icon: <FiCreditCard className="w-8 h-8" />,
      color: 'bg-blue-500',
      action: () => router.push('/dashboard/reports/transactions'),
    },
    {
      title: 'User Report',
      description: 'User statistics and growth metrics',
      icon: <FiUsers className="w-8 h-8" />,
      color: 'bg-green-500',
      action: () => router.push('/dashboard/reports/users'),
    },
    {
      title: 'Revenue Report',
      description: 'Financial overview and revenue analytics',
      icon: <FiDollarSign className="w-8 h-8" />,
      color: 'bg-purple-500',
      action: () => router.push('/dashboard/reports/revenue'),
    },
    {
      title: 'Loyalty Report',
      description: 'Loyalty program performance and metrics',
      icon: <FiTrendingUp className="w-8 h-8" />,
      color: 'bg-yellow-500',
      action: () => router.push('/dashboard/reports/loyalty'),
    },
  ];

  return (
    <DashboardLayout role={role}>
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-600">Generate and view system reports</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportCards.map((report, index) => (
            <div
              key={index}
              onClick={report.action}
              className="card card-hover cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className={`p-4 ${report.color} text-white rounded-xl`}>
                  {report.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{report.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{report.description}</p>
                  <button className="btn-secondary text-sm flex items-center gap-2">
                    <FiDownload className="w-4 h-4" />
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

