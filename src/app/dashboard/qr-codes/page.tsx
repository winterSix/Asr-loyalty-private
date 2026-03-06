'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { qrService } from '@/services/qr.service';
import {
  FiQrCode,
  FiSearch,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiSmartphone,
  FiCreditCard,
  FiUsers,
  FiShield,
  FiZap,
  FiActivity,
} from '@/utils/icons';
import toast from 'react-hot-toast';

export default function QRCodesPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [qrLookupId, setQrLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  const handleLookup = async () => {
    if (!qrLookupId.trim()) {
      toast.error('Please enter a QR code ID');
      return;
    }
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const result = await qrService.getQrStatus(qrLookupId.trim());
      setLookupResult(result);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'QR code not found');
      setLookupResult(null);
    } finally {
      setLookupLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      case 'USED': return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case 'EXPIRED': return 'bg-red-50 text-red-700 ring-red-600/20';
      case 'CANCELLED': return 'bg-gray-100 text-gray-600 ring-gray-500/20';
      default: return 'bg-gray-100 text-gray-600 ring-gray-500/20';
    }
  };

  const flowSteps = [
    {
      icon: FiSmartphone,
      title: 'Customer Generates QR',
      desc: 'Customer creates a payment QR code from the mobile app with the desired amount',
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
    },
    {
      icon: FiQrCode,
      title: 'Cashier Scans QR',
      desc: 'Cashier at the point of sale scans the QR code using the mobile scanner',
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
    },
    {
      icon: FiCheckCircle,
      title: 'Payment Processed',
      desc: 'Amount is deducted from customer wallet and credited to cashier. Rewards are earned.',
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
    },
  ];

  return (
    <>
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25">
              <FiQrCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887]">QR Payments</h1>
              <p className="text-gray-500 text-sm">Overview of the QR-based payment system</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/transactions')}
            className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium flex items-center gap-2"
          >
            <FiCreditCard className="w-4 h-4" />
            View Transactions
          </button>
        </div>

        {/* Payment Flow */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FiActivity className="w-4 h-4 text-gray-500" />
              How QR Payments Work
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">End-to-end payment flow via QR codes</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {flowSteps.map((step, i) => (
                <div key={i} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className={`p-4 rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-lg ${step.shadow}`}>
                        <step.icon className="w-7 h-7" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600">{i + 1}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1.5">{step.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                  {i < flowSteps.length - 1 && (
                    <div className="hidden md:flex absolute top-10 -right-3 z-10">
                      <FiArrowRight className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* QR Code Status Lookup */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FiSearch className="w-4 h-4 text-gray-500" />
              QR Code Lookup
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Check the status of any QR code by its ID</p>
          </div>
          <div className="p-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter QR code ID or reference..."
                  value={qrLookupId}
                  onChange={(e) => setQrLookupId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
              </div>
              <button
                onClick={handleLookup}
                disabled={lookupLoading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {lookupLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <FiSearch className="w-4 h-4" />
                )}
                Lookup
              </button>
            </div>

            {/* Lookup Result */}
            {lookupResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">QR Code Details</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{lookupResult.id || lookupResult.qrCodeId || qrLookupId}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${getStatusStyle(lookupResult.status)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      lookupResult.status === 'ACTIVE' ? 'bg-emerald-500' :
                      lookupResult.status === 'USED' ? 'bg-blue-500' :
                      lookupResult.status === 'EXPIRED' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></span>
                    {lookupResult.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {lookupResult.amount && (
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-[10px] font-medium text-gray-400 uppercase">Amount</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">₦{parseFloat(lookupResult.amount).toLocaleString()}</p>
                    </div>
                  )}
                  {lookupResult.reference && (
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-[10px] font-medium text-gray-400 uppercase">Reference</p>
                      <p className="text-xs font-mono text-gray-700 mt-0.5 truncate">{lookupResult.reference}</p>
                    </div>
                  )}
                  {lookupResult.expiresAt && (
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-[10px] font-medium text-gray-400 uppercase">Expires</p>
                      <p className="text-xs font-semibold text-gray-900 mt-0.5">{new Date(lookupResult.expiresAt).toLocaleString()}</p>
                    </div>
                  )}
                  {lookupResult.createdAt && (
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-[10px] font-medium text-gray-400 uppercase">Created</p>
                      <p className="text-xs font-semibold text-gray-900 mt-0.5">{new Date(lookupResult.createdAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 w-fit mb-4">
              <FiShield className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1.5">Encrypted & Signed</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              QR codes are AES encrypted and HMAC-SHA256 signed. Each code is verified for authenticity before processing.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 w-fit mb-4">
              <FiClock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1.5">Time-Limited</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              QR codes expire after a set duration. Expired codes are automatically invalidated and cannot be reused.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 w-fit mb-4">
              <FiZap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1.5">Instant Rewards</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Customers earn loyalty points automatically on every QR payment, multiplied by their tier level.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
