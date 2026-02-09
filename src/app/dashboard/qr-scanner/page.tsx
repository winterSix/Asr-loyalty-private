'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  FiQrCode,
  FiX,
} from '@/utils/icons';

function QRScannerContent() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const amount = searchParams?.get('amount');

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

  return (
    <DashboardLayout role={role}>
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">QR Code Scanner</h1>
            <p className="text-gray-600">Scan QR code to process payment</p>
          </div>
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center mb-6 border-4 border-dashed border-gray-300">
              <div className="text-center">
                <FiQrCode className="w-32 h-32 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Camera will activate here</p>
                <p className="text-sm text-gray-500 mt-2">Point camera at QR code</p>
              </div>
            </div>

            {amount && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Expected Amount</p>
                <p className="text-2xl font-bold text-gray-900">₦{parseFloat(amount || '0').toLocaleString()}</p>
              </div>
            )}

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Or enter QR code manually"
                className="input-field"
              />
              <button className="w-full btn-primary">
                Process Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function QRScannerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <QRScannerContent />
    </Suspense>
  );
}

