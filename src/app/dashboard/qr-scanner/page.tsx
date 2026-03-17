'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  FiQrCode,
  FiSmartphone,
  FiArrowRight,
  FiCreditCard,
  FiUsers,
  FiCheckCircle,
  FiShield,
  FiActivity,
  FiExternalLink,
} from '@/utils/icons';

export default function QRScannerPage() {
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

  const scannerFeatures = [
    {
      icon: FiQrCode,
      title: 'Camera Scanning',
      desc: 'Cashiers point their device camera at the customer QR code for instant detection',
    },
    {
      icon: FiShield,
      title: 'Verification',
      desc: 'The system verifies the QR signature, checks expiry, and validates the payment amount',
    },
    {
      icon: FiCheckCircle,
      title: 'Instant Settlement',
      desc: 'Funds transfer immediately from customer wallet to cashier upon successful scan',
    },
  ];

  return (
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
              <FiQrCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887]">QR Scanner</h1>
              <p className="text-gray-500 text-sm">How the cashier QR scanning process works</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/qr-codes')}
              className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium flex items-center gap-2"
            >
              <FiQrCode className="w-4 h-4" />
              QR Payments
            </button>
            <button
              onClick={() => router.push('/dashboard/transactions')}
              className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium flex items-center gap-2"
            >
              <FiCreditCard className="w-4 h-4" />
              Transactions
            </button>
          </div>
        </div>

        {/* Cashier-Only Notice */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 flex-shrink-0">
              <FiSmartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-lg mb-1">Mobile App Feature</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                QR code scanning is performed by <strong>cashiers</strong> using the ASR Loyalty mobile app.
                When a customer presents their payment QR code, the cashier scans it directly from their device to process the payment.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Admin users can monitor QR payment transactions from the Transactions page.
              </p>
            </div>
          </div>
        </div>

        {/* Scanner Process */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FiActivity className="w-4 h-4 text-gray-500" />
              Scanner Process
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">How the cashier scanner works step by step</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {scannerFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
                        <feature.icon className="w-5 h-5" />
                      </div>
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full border border-gray-200 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-gray-600">{i + 1}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{feature.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/dashboard/transactions')}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left hover:shadow-md hover:border-gray-200 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                  <FiCreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">View QR Transactions</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Monitor all QR payment transactions</p>
                </div>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/users')}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left hover:shadow-md hover:border-gray-200 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
                  <FiUsers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">Manage Cashiers</h3>
                  <p className="text-xs text-gray-500 mt-0.5">View and manage cashier accounts</p>
                </div>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        </div>
      </div>
  );
}
