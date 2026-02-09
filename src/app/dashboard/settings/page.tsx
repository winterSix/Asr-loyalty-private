'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  FiSettings,
  FiLock,
  FiBell,
  FiShield,
  FiDatabase,
  FiMail,
} from '@/utils/icons';

export default function SettingsPage() {
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

  const settingsCategories = [
    {
      title: 'Security',
      description: 'Password, 2FA, and security settings',
      icon: <FiShield className="w-6 h-6" />,
      color: 'bg-red-500',
      items: ['Change Password', 'Two-Factor Authentication', 'Payment PIN', 'Active Sessions'],
    },
    {
      title: 'Notifications',
      description: 'Manage notification preferences',
      icon: <FiBell className="w-6 h-6" />,
      color: 'bg-blue-500',
      items: ['Email Notifications', 'SMS Notifications', 'Push Notifications', 'Transaction Alerts'],
    },
    {
      title: 'Account',
      description: 'Account and profile settings',
      icon: <FiSettings className="w-6 h-6" />,
      color: 'bg-green-500',
      items: ['Profile Information', 'Privacy Settings', 'Account Preferences'],
    },
  ];

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    settingsCategories.push({
      title: 'System',
      description: 'System configuration and settings',
      icon: <FiDatabase className="w-6 h-6" />,
      color: 'bg-purple-500',
      items: ['System Configuration', 'Feature Flags', 'Email Templates', 'API Keys'],
    });
  }

  return (
    <DashboardLayout role={role}>
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and system settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCategories.map((category, index) => (
            <div key={index} className="card card-hover">
              <div className={`w-12 h-12 ${category.color} text-white rounded-xl flex items-center justify-center mb-4`}>
                {category.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{category.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{category.description}</p>
              <ul className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push(`/dashboard/settings/${category.title.toLowerCase()}`)}
                className="w-full mt-4 btn-secondary text-sm"
              >
                Manage {category.title}
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

