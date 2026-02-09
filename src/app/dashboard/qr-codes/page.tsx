'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { qrService } from '@/services/qr.service';
import {
  FiQrCode,
  FiPlus,
  FiSearch,
  FiEye,
  FiX,
} from '@/utils/icons';

export default function QRCodesPage() {
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

  // QR codes list endpoint doesn't exist in backend, so we'll show empty state
  const qrCodes = { data: [] as any[], total: 0 };
  const qrLoading = false;

  if (isLoading || qrLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'USED':
        return 'bg-blue-100 text-blue-700';
      case 'EXPIRED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <DashboardLayout role={role}>
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">QR Codes</h1>
            <p className="text-gray-600">Manage QR codes for payments</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/qr-codes/generate')}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Generate QR Code
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search QR codes..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="USED">Used</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* QR Codes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodes?.data && qrCodes.data.length > 0 ? (
            qrCodes.data.map((qr) => (
              <div key={qr.id} className="card card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-primary rounded-xl text-white">
                    <FiQrCode className="w-6 h-6" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(qr.status)}`}>
                    {qr.status}
                  </span>
                </div>
                <div className="space-y-2">
                  {qr.amount && (
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-bold text-lg text-gray-900">
                        ₦{parseFloat(qr.amount).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {qr.description && (
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="text-sm text-gray-900">{qr.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Reference</p>
                    <p className="text-xs font-mono text-gray-500">{qr.reference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expires</p>
                    <p className="text-sm text-gray-900">
                      {new Date(qr.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => router.push(`/dashboard/qr-codes/${qr.id}`)}
                    className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2"
                  >
                    <FiEye className="w-4 h-4" />
                    View
                  </button>
                  {qr.status === 'ACTIVE' && (
                    <button
                      onClick={async () => {
                        await qrService.cancelQRCode(qr.id);
                      }}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FiQrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No QR codes found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

