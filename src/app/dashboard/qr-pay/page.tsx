'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  FiQrCode,
  FiPlus,
} from '@/utils/icons';

export default function QRPayPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  return (
      <div>
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-[#E5B887] mb-2">QR Pay</h1>
            <p className="text-gray-600">Generate QR codes for payments</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/qr-codes/generate')}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Generate QR Code
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card text-center py-12">
            <FiQrCode className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Generate Payment QR</h3>
            <p className="text-gray-600 mb-6">Create a QR code for receiving payments</p>
            <button
              onClick={() => router.push('/dashboard/qr-codes/generate')}
              className="btn-primary"
            >
              Generate QR Code
            </button>
          </div>

          <div className="card text-center py-12">
            <FiQrCode className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Scan to Pay</h3>
            <p className="text-gray-600 mb-6">Scan a QR code to make a payment</p>
            <button
              onClick={() => router.push('/dashboard/qr-scanner')}
              className="btn-primary"
            >
              Open Scanner
            </button>
          </div>
        </div>
      </div>
  );
}

