'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import {
  FiUser,
  FiEdit,
  FiSave,
  FiX,
  FiLock,
  FiShield,
  FiBell,
} from '@/utils/icons';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: () => userService.getPreferences(),
    enabled: !!user,
  });

  const handleSave = async () => {
    try {
      await userService.updateProfile(formData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (isLoading || prefsLoading) {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary flex items-center gap-2"
            >
              <FiEdit className="w-5 h-5" />
              Edit Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <FiX className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FiSave className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={user?.phoneNumber || ''}
                    disabled
                    className="input-field bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {user?.phoneVerified ? '✓ Verified' : 'Not verified'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {user?.emailVerified ? '✓ Verified' : 'Not verified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Security Settings</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard/profile/change-password')}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <FiLock className="w-5 h-5" />
                  Change Password
                </button>
                <button
                  onClick={() => router.push('/dashboard/profile/payment-pin')}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <FiShield className="w-5 h-5" />
                  Set Payment PIN
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="card text-center">
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {user?.firstName} {user?.lastName}
              </h3>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">
                {user?.role?.replace('_', ' ') || 'CUSTOMER'}
              </span>
            </div>

            {/* Account Status */}
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Account Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user?.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user?.status || 'ACTIVE'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Phone Verified</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user?.phoneVerified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user?.phoneVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Verified</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user?.emailVerified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user?.emailVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Loyalty Tier</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {user?.currentTier || 'BRONZE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">Total Spent</span>
                    <span className="font-semibold text-gray-900">
                      ₦{user?.totalSpent ? parseFloat(user.totalSpent).toLocaleString() : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            {preferences && (
              <div className="card">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiBell className="w-5 h-5" />
                  Notification Preferences
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-gray-700">Push Notifications</span>
                    <input
                      type="checkbox"
                      checked={preferences.pushNotifications}
                      className="w-5 h-5 text-primary rounded focus:ring-primary"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-gray-700">Email Notifications</span>
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      className="w-5 h-5 text-primary rounded focus:ring-primary"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-gray-700">SMS Notifications</span>
                    <input
                      type="checkbox"
                      checked={preferences.smsNotifications}
                      className="w-5 h-5 text-primary rounded focus:ring-primary"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-gray-700">Transaction Alerts</span>
                    <input
                      type="checkbox"
                      checked={preferences.transactionAlerts}
                      className="w-5 h-5 text-primary rounded focus:ring-primary"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
