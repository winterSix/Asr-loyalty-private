'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiQrCode,
  FiCreditCard,
  FiWallet,
  FiDollarSign,
} from '@/utils/icons';

export default function CashierDashboard() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState('');
  const [amount, setAmount] = useState('');

  const handleScan = () => {
    console.log('Scanning QR code...');
  };

  const handleCreateSession = () => {
    if (amount) {
      router.push(`/dashboard/qr-scanner?amount=${amount}`);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Cashier Dashboard</h1>
        <p className="text-gray-600">Process payments and manage transactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner */}
        <div className="bg-gradient-primary text-white rounded-2xl p-8 min-h-[400px] flex flex-col">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">QR Code Scanner</h2>
            <p className="text-white/90">Scan customer QR code to process payment</p>
          </div>

          <div className="flex-1 flex items-center justify-center bg-white/10 rounded-2xl border-2 border-dashed border-white/30 mb-6">
            <div className="text-center">
              <FiQrCode className="w-20 h-20 mx-auto mb-4 opacity-50" />
              <button
                onClick={handleScan}
                className="bg-white text-primary px-8 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors"
              >
                Start Scanner
              </button>
            </div>
          </div>

          <input
            type="text"
            placeholder="Or Enter QR Code"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Create Session */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Payment Session</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="input-field"
                />
              </div>
              <button
                onClick={handleCreateSession}
                disabled={!amount}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Session
              </button>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Payment #001</p>
                    <p className="text-xs text-gray-500">Today, 10:30 AM</p>
                  </div>
                  <p className="font-bold text-gray-900">₦12,500</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Payment #002</p>
                    <p className="text-xs text-gray-500">Today, 09:15 AM</p>
                  </div>
                  <p className="font-bold text-gray-900">₦8,300</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/transactions')}
              className="w-full mt-4 btn-secondary text-sm flex items-center justify-center gap-2"
            >
              <FiCreditCard className="w-4 h-4" />
              View All Transactions
            </button>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-primary text-white p-4 rounded-xl text-center">
                <p className="text-3xl font-bold">24</p>
                <p className="text-sm opacity-90">Today</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-400 text-white p-4 rounded-xl text-center">
                <p className="text-3xl font-bold">₦245K</p>
                <p className="text-sm opacity-90">Total</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
