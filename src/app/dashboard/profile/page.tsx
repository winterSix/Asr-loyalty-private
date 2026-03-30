'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import {
  FiUser,
  FiEdit,
  FiSave,
  FiX,
  FiLock,
  FiShield,
  FiBell,
  FiCheckCircle,
  FiXCircle,
  FiPhone,
  FiMail,
  FiStar,
  FiActivity,
  FiCalendar,
  FiCopy,
  FiSmartphone,
  FiRefreshCw,
  FiKey,
  FiArrowRight,
  FiTrendingUp,
  FiAward,
  FiGift,
  FiCreditCard,
  FiZap,
} from '@/utils/icons';
import toast from 'react-hot-toast';

function SecurityTab({ user, queryClient, router }: { user: any; queryClient: any; router: any }) {
  const twoFAMutation = useMutation({
    mutationFn: (enabled: boolean) => userService.toggle2FA(enabled),
    onSuccess: (data) => {
      toast.success(data.message || (data.twoFactorEnabled ? '2FA enabled' : '2FA disabled'));
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: () => toast.error('Failed to update 2FA setting'),
  });

  const securityLinks = [
    {
      label: 'Change Password',
      desc: 'Update your account password for better security',
      icon: FiLock,
      gradient: 'from-rose-500 to-pink-600',
      shadow: 'shadow-rose-500/20',
      path: '/dashboard/profile/change-password',
    },
    {
      label: 'Payment PIN',
      desc: 'Set or update your transaction PIN',
      icon: FiKey,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/20',
      path: '/dashboard/profile/payment-pin',
    },
  ];

  return (
    <div className="p-5 sm:p-6 space-y-3">
      {securityLinks.map((item) => (
        <button
          key={item.label}
          onClick={() => router.push(item.path)}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:border-gray-200 hover:bg-gray-50/50 dark:hover:bg-white/[0.04] transition-all group"
        >
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center shadow-md ${item.shadow} shrink-0`}>
            <item.icon className="w-4.5 h-4.5" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{item.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
          </div>
          <FiArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>
      ))}

      {/* 2FA toggle — only for CUSTOMER role */}
      {user?.role === 'CUSTOMER' && (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <FiShield className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Two-Factor Authentication</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {user?.twoFactorEnabled ? 'Enabled — extra security on every login' : 'Add an extra layer of login security'}
            </p>
          </div>
          <button
            onClick={() => twoFAMutation.mutate(!user?.twoFactorEnabled)}
            disabled={twoFAMutation.isPending}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${user?.twoFactorEnabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${user?.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'notifications'>('info');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const { data: preferences } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: () => userService.getPreferences(),
    enabled: !!user,
  });

  const { data: devices } = useQuery({
    queryKey: ['user-devices'],
    queryFn: () => userService.getDevices(),
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof formData) => userService.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully');
      setIsEditing(false);
      checkAuth();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    },
  });

  const updatePrefsMutation = useMutation({
    mutationFn: (data: Record<string, boolean>) =>
      userService.updatePreferences(data),
    onSuccess: () => {
      toast.success('Preference updated');
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
    onError: () => {
      toast.error('Failed to update preference');
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      checkAuth(),
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] }),
      queryClient.invalidateQueries({ queryKey: ['user-devices'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-[3px] border-gray-200" />
            <div className="absolute inset-0 rounded-full border-[3px] border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-gray-400 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';
  const isCustomerRole = role === 'CUSTOMER';

  const getTierConfig = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'PLATINUM':
        return { gradient: 'from-slate-600 to-slate-800', badge: 'bg-slate-100 text-slate-800', accent: 'bg-slate-500', progress: 100, nextTier: null };
      case 'GOLD':
        return { gradient: 'from-amber-500 to-yellow-600', badge: 'bg-amber-50 text-amber-800', accent: 'bg-amber-500', progress: 75, nextTier: 'PLATINUM' };
      case 'SILVER':
        return { gradient: 'from-gray-400 to-gray-500', badge: 'bg-gray-100 text-gray-700', accent: 'bg-gray-400', progress: 50, nextTier: 'GOLD' };
      default:
        return { gradient: 'from-primary to-primary-lighter', badge: 'bg-primary/5 text-primary', accent: 'bg-primary', progress: 25, nextTier: 'SILVER' };
    }
  };

  const tierConfig = getTierConfig(user?.currentTier || 'BRONZE');
  const devicesArray = Array.isArray(devices) ? devices : (devices as any)?.data || [];

  const VerifiedBadge = ({ verified }: { verified?: boolean }) =>
    verified ? (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
        <FiCheckCircle className="w-3 h-3" /> Verified
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
        <FiXCircle className="w-3 h-3" /> Unverified
      </span>
    );

  return (
      <div className="w-full space-y-6 animate-fade-in">

        {/* ─── Profile Card with Banner ─── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/70 dark:border-white/10 overflow-hidden">
          {/* Banner */}
          <div className={`relative h-32 sm:h-40 bg-gradient-to-r ${isCustomerRole ? tierConfig.gradient : 'from-primary to-primary-lighter'}`}>
            <svg className="absolute inset-0 w-full h-full opacity-[0.08]" viewBox="0 0 800 200" preserveAspectRatio="none">
              <circle cx="700" cy="40" r="120" fill="white" />
              <circle cx="650" cy="80" r="60" fill="white" />
              <circle cx="100" cy="160" r="80" fill="white" />
            </svg>

            {/* Top Actions */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-9 w-9 rounded-lg bg-white/90 hover:bg-white text-gray-600 flex items-center justify-center shadow-sm transition-all disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="h-9 px-4 rounded-lg bg-white text-gray-700 text-xs font-semibold shadow-sm hover:shadow-md flex items-center gap-1.5 transition-all"
                >
                  <FiEdit className="w-3.5 h-3.5" /> Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '' });
                    }}
                    className="h-9 px-3 rounded-lg bg-white/80 text-gray-600 text-xs font-semibold flex items-center gap-1 transition-all hover:bg-white"
                  >
                    <FiX className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button
                    onClick={() => updateProfileMutation.mutate(formData)}
                    disabled={updateProfileMutation.isPending}
                    className="h-9 px-4 rounded-lg bg-white text-primary text-xs font-bold shadow-sm hover:shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <FiSave className="w-3.5 h-3.5" />
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Identity */}
          <div className="px-5 sm:px-8 pb-5 -mt-10 sm:-mt-12 relative z-10">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 sm:items-end">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-lighter flex items-center justify-center text-white text-2xl sm:text-3xl font-bold ring-[3px] ring-white shadow-lg">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                {isCustomerRole && (
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-md ${tierConfig.accent} ring-2 ring-white flex items-center justify-center`}>
                    <FiStar className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Name & Meta */}
              <div className="flex-1 min-w-0 sm:pb-0.5">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-[#E5B887] truncate leading-tight">
                  {user?.firstName} {user?.lastName}
                </h1>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {isCustomerRole && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${tierConfig.badge}`}>
                      <FiAward className="w-3 h-3" /> {user?.currentTier || 'BRONZE'}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/5 text-primary">
                    <FiShield className="w-3 h-3" /> {user?.role?.replace(/_/g, ' ') || 'CUSTOMER'}
                  </span>
                  {user?.status === 'ACTIVE' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Meta - Desktop */}
              <div className="hidden lg:flex items-center gap-6 pb-0.5">
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Member Since</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '\u2014'}
                  </p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total Spent</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">
                    &#x20A6;{user?.totalSpent ? parseFloat(user.totalSpent).toLocaleString() : '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Stats Grid ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Total Spent', value: `\u20A6${user?.totalSpent ? parseFloat(user.totalSpent).toLocaleString() : '0'}`, icon: FiCreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Transactions', value: user?.totalTransactions || 0, icon: FiActivity, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Current Tier', value: user?.currentTier || 'BRONZE', icon: FiAward, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '\u2014', icon: FiCalendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200/70 dark:border-white/10 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className={`w-8 h-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider leading-none">{s.label}</span>
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-gray-900 leading-none">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ─── Main Content Grid ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left: Main Content (3/5) */}
          <div className="xl:col-span-3 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/70 dark:border-white/10 overflow-hidden">
              <div className="flex border-b border-gray-100 dark:border-white/5">
                {[
                  { id: 'info' as const, label: 'Personal Info', icon: FiUser },
                  { id: 'security' as const, label: 'Security', icon: FiLock },
                  { id: 'notifications' as const, label: 'Notifications', icon: FiBell },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs sm:text-sm font-semibold transition-all relative
                      ${activeTab === tab.id
                        ? 'text-primary'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab: Personal Info */}
              {activeTab === 'info' && (
                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    {/* First Name */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full h-11 px-3.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-medium text-gray-900"
                          placeholder="First name"
                        />
                      ) : (
                        <div className="h-11 px-3.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center">
                          <span className="text-sm font-medium text-gray-900">{user?.firstName || '\u2014'}</span>
                        </div>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full h-11 px-3.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-medium text-gray-900"
                          placeholder="Last name"
                        />
                      ) : (
                        <div className="h-11 px-3.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center">
                          <span className="text-sm font-medium text-gray-900">{user?.lastName || '\u2014'}</span>
                        </div>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                      <div className="h-11 px-3.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FiPhone className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{user?.phoneNumber || '\u2014'}</span>
                        </div>
                        <VerifiedBadge verified={user?.phoneVerified} />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full h-11 px-3.5 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-medium text-gray-900"
                          placeholder="Email address"
                        />
                      ) : (
                        <div className="h-11 px-3.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiMail className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 truncate">{user?.email || '\u2014'}</span>
                          </div>
                          <VerifiedBadge verified={user?.emailVerified} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Referral Code inline */}
                  {user?.referralCode && (
                    <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-primary/5 via-primary-light/5 to-accent-cyan/5 border border-primary/10">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FiGift className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Referral Code</p>
                            <p className="text-sm font-bold text-gray-900 font-mono tracking-wider mt-0.5">{user.referralCode}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(user.referralCode || '')}
                          className="h-9 w-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/30 transition-all shrink-0"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Security */}
              {activeTab === 'security' && (
                <SecurityTab user={user} queryClient={queryClient} router={router} />
              )}

              {/* Tab: Notifications */}
              {activeTab === 'notifications' && (
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {[
                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications on your devices', icon: FiSmartphone, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email', icon: FiMail, color: 'text-violet-500', bg: 'bg-violet-50' },
                    { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive notifications via SMS', icon: FiPhone, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { key: 'transactionAlerts', label: 'Transaction Alerts', desc: 'Get notified about every transaction', icon: FiZap, color: 'text-amber-500', bg: 'bg-amber-50' },
                  ].map((pref) => {
                    const isEnabled = (preferences as any)?.[pref.key];
                    return (
                      <div key={pref.key} className="flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-gray-50/40 dark:hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-9 h-9 rounded-lg ${pref.bg} ${pref.color} flex items-center justify-center`}>
                            <pref.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{pref.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{pref.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => updatePrefsMutation.mutate({ [pref.key]: !isEnabled })}
                          disabled={updatePrefsMutation.isPending}
                          className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${isEnabled ? 'bg-primary' : 'bg-gray-200'}`}
                          role="switch"
                          aria-checked={isEnabled}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isEnabled ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Sidebar (2/5) */}
          <div className="xl:col-span-2 space-y-6">
            {/* Account Overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/70 dark:border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FiShield className="w-4 h-4 text-primary" /> Account Overview
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    user?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : user?.status === 'SUSPENDED' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user?.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : user?.status === 'SUSPENDED' ? 'bg-red-500' : 'bg-gray-400'}`} />
                    {user?.status || 'ACTIVE'}
                  </span>
                </div>
                <div className="h-px bg-gray-100 dark:bg-white/5" />

                {/* Verifications */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Phone Verification</span>
                  <VerifiedBadge verified={user?.phoneVerified} />
                </div>
                <div className="h-px bg-gray-100 dark:bg-white/5" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Email Verification</span>
                  <VerifiedBadge verified={user?.emailVerified} />
                </div>
              </div>
            </div>

            {/* Loyalty Tier Card — customers only */}
            {isCustomerRole && <div className="bg-white rounded-2xl shadow-sm border border-gray-200/70 dark:border-white/10 overflow-hidden">
              <div className={`h-1 bg-gradient-to-r ${tierConfig.gradient}`} />
              <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FiStar className="w-4 h-4 text-amber-500" /> Loyalty Progress
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {/* Current tier display */}
                <div className="flex items-center justify-center">
                  <div className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${tierConfig.gradient} text-white text-sm font-bold flex items-center gap-2 shadow-md`}>
                    <FiAward className="w-4 h-4" /> {user?.currentTier || 'BRONZE'}
                  </div>
                </div>

                {/* Progress bar */}
                {tierConfig.nextTier && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-gray-500">{user?.currentTier || 'BRONZE'}</span>
                      <span className="text-gray-400">{tierConfig.nextTier}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${tierConfig.gradient} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${tierConfig.progress}%` }}
                      />
                    </div>
                    <p className="text-center text-[10px] text-gray-400 font-medium">{tierConfig.progress}% to {tierConfig.nextTier}</p>
                  </div>
                )}

                <div className="h-px bg-gray-100 dark:bg-white/5" />

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <p className="text-lg font-extrabold text-gray-900">&#x20A6;{user?.totalSpent ? parseFloat(user.totalSpent).toLocaleString() : '0'}</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Spent</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <p className="text-lg font-extrabold text-gray-900">{user?.totalTransactions || 0}</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Transactions</p>
                  </div>
                </div>
              </div>
            </div>}

            {/* Active Devices */}
            {devicesArray.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200/70 dark:border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FiSmartphone className="w-4 h-4 text-gray-400" /> Devices
                  </h3>
                  <span className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                    {devicesArray.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {devicesArray.slice(0, 3).map((device: any) => (
                    <div key={device.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.04] transition-colors">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                          <FiSmartphone className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        {device.isActive && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{device.deviceName || device.deviceType}</p>
                        <p className="text-[10px] text-gray-400">{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleDateString() : 'Unknown'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Member Info Card - Mobile */}
            <div className="lg:hidden bg-white rounded-2xl shadow-sm border border-gray-200/70 dark:border-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FiCalendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Member Since</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '\u2014'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
