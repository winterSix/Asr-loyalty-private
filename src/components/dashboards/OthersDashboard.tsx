'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { roleService } from '@/services/role.service';
import { adminService, getDisplayRole } from '@/services/admin.service';
import { disputeService } from '@/services/dispute.service';
import { refundService } from '@/services/refund.service';
import { useAuthStore } from '@/store/auth.store';
import {
  FiUsers, FiShield, FiDollarSign, FiCreditCard,
  FiArrowRight, FiBarChart, FiGift, FiKey, FiLayers,
  FiBell, FiWallet, FiFileText,
} from '@/utils/icons';

// Quick-link card config keyed by permission
const SECTION_CARDS = [
  { perm: 'user:read',        label: 'Users',        desc: 'View and manage users',           path: '/dashboard/users',        icon: FiUsers,      color: 'bg-teal-500' },
  { perm: 'transaction:read', label: 'Transactions',  desc: 'Browse transaction records',       path: '/dashboard/transactions', icon: FiCreditCard, color: 'bg-indigo-500' },
  { perm: 'wallet:read',      label: 'Wallets',       desc: 'View wallet balances',             path: '/dashboard/wallets',      icon: FiWallet,     color: 'bg-emerald-500' },
  { perm: 'dispute:read',     label: 'Disputes',      desc: 'Manage open disputes',             path: '/dashboard/disputes',     icon: FiShield,     color: 'bg-red-500' },
  { perm: 'refund:read',      label: 'Refunds',       desc: 'Process pending refunds',          path: '/dashboard/refunds',      icon: FiDollarSign, color: 'bg-green-500' },
  { perm: 'report:read',      label: 'Reports',       desc: 'View system reports',              path: '/dashboard/reports',      icon: FiBarChart,   color: 'bg-purple-500' },
  { perm: 'audit:read',       label: 'Audit Logs',    desc: 'Review audit trail',               path: '/dashboard/audit',        icon: FiFileText,   color: 'bg-orange-500' },
  { perm: 'reward:read',      label: 'Rewards',       desc: 'Manage loyalty rewards',           path: '/dashboard/rewards',      icon: FiGift,       color: 'bg-yellow-500' },
  { perm: 'role:read',        label: 'Roles',         desc: 'View role definitions',            path: '/dashboard/roles',        icon: FiLayers,     color: 'bg-violet-500' },
  { perm: 'permission:read',  label: 'Permissions',   desc: 'Browse permission catalogue',      path: '/dashboard/permissions',  icon: FiKey,        color: 'bg-amber-500' },
  { perm: 'notification:send',label: 'Notifications', desc: 'Send system notifications',        path: '/dashboard/notifications',icon: FiBell,       color: 'bg-cyan-500' },
];

export default function OthersDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Fetch own permissions — no special permission required
  const { data: permissions = [], isLoading: permsLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: () => roleService.getMyPermissions(),
    enabled: !!user?.id,
    staleTime: 0,
    gcTime: 0,
  });

  const permSet = new Set(permissions.map((p: any) => `${p.resource}:${p.action}`));
  const has = (perm: string) => permSet.has(perm);

  // Only fetch stats the user actually has permission for
  const { data: userStats } = useQuery({
    queryKey: ['admin', 'users', 'stats'],
    queryFn: () => adminService.getUserStats(),
    enabled: has('user:read'),
    staleTime: 60000,
    retry: false,
  });

  const { data: disputes } = useQuery({
    queryKey: ['disputes', 'pending'],
    queryFn: () => disputeService.getDisputes({ status: 'OPEN', page: 1, limit: 1 }),
    enabled: has('dispute:read'),
    staleTime: 60000,
    retry: false,
  });

  const { data: refunds } = useQuery({
    queryKey: ['refunds', 'pending'],
    queryFn: () => refundService.getRefunds({ status: 'PENDING', page: 1, limit: 1 }),
    enabled: has('refund:read'),
    staleTime: 60000,
    retry: false,
  });

  const displayName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const roleName = user ? getDisplayRole(user) : 'Staff';

  // Summary stat cards — only those the user has access to
  const statCards = [
    has('user:read') && {
      label: 'Total Users',
      value: userStats?.total ?? '—',
      sub: userStats ? `+${userStats.recentSignups ?? 0} recent signups` : '',
      icon: FiUsers,
      color: 'text-teal-500',
      bg: 'bg-teal-50 dark:bg-teal-900/20',
    },
    has('dispute:read') && {
      label: 'Open Disputes',
      value: disputes?.total ?? '—',
      sub: 'Requires attention',
      icon: FiShield,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    has('refund:read') && {
      label: 'Pending Refunds',
      value: refunds?.total ?? '—',
      sub: 'Awaiting processing',
      icon: FiDollarSign,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
  ].filter(Boolean) as any[];

  const accessibleSections = SECTION_CARDS.filter(c => permSet.has(c.perm));

  if (permsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">

      {/* Welcome header */}
      <div className="bg-gradient-to-r from-primary/90 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-sm font-medium opacity-80 mb-1">{roleName}</p>
        <h1 className="text-2xl font-bold">Welcome back, {displayName || 'Staff'}</h1>
        <p className="text-sm opacity-70 mt-1">Here is a summary of what is within your access.</p>
      </div>

      {/* Stat cards — only visible when user has permission */}
      {statCards.length > 0 && (
        <div className={`grid gap-4 ${statCards.length === 1 ? 'grid-cols-1 max-w-xs' : statCards.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          {statCards.map((card: any) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`rounded-xl p-5 ${card.bg} border border-gray-100 dark:border-white/10`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</span>
                  <div className={`p-2 rounded-lg bg-white dark:bg-white/10`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                {card.sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.sub}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick access sections */}
      {accessibleSections.length > 0 ? (
        <div>
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">Your Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accessibleSections.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.label}
                  onClick={() => router.push(card.path)}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/10 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group"
                >
                  <div className={`${card.color} p-3 rounded-xl flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{card.label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{card.desc}</p>
                  </div>
                  <FiArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <FiKey className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No additional sections assigned</p>
          <p className="text-sm mt-1">Contact your administrator to request access.</p>
        </div>
      )}
    </div>
  );
}
