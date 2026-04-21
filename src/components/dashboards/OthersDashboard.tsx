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
  FiArrowRight, FiBarChart2, FiGift, FiKey, FiLayers,
  FiBell, FiWallet, FiFileText, FiActivity,
} from '@/utils/icons';

const SECTION_CARDS = [
  { perm: 'user:read',         label: 'Users',         desc: 'View and manage users',            path: '/dashboard/users',         icon: FiUsers,      gradient: 'from-teal-500 to-cyan-500',      glow: 'rgba(20,184,166,0.25)',  countKey: 'users' },
  { perm: 'transaction:read',  label: 'Transactions',  desc: 'Browse transaction records',        path: '/dashboard/transactions',  icon: FiCreditCard, gradient: 'from-indigo-500 to-blue-500',    glow: 'rgba(99,102,241,0.25)',  countKey: null },
  { perm: 'wallet:read',       label: 'Wallets',       desc: 'View wallet balances',              path: '/dashboard/wallets',       icon: FiWallet,     gradient: 'from-emerald-500 to-green-500',  glow: 'rgba(16,185,129,0.25)', countKey: null },
  { perm: 'dispute:read',      label: 'Disputes',      desc: 'Manage open disputes',              path: '/dashboard/disputes',      icon: FiShield,     gradient: 'from-red-500 to-rose-500',       glow: 'rgba(239,68,68,0.25)',   countKey: 'disputes' },
  { perm: 'refund:read',       label: 'Refunds',       desc: 'Process pending refunds',           path: '/dashboard/refunds',       icon: FiDollarSign, gradient: 'from-green-500 to-emerald-600',  glow: 'rgba(34,197,94,0.25)',   countKey: 'refunds' },
  { perm: 'report:read',       label: 'Reports',       desc: 'View system reports',               path: '/dashboard/reports',       icon: FiBarChart2,  gradient: 'from-violet-500 to-purple-600',  glow: 'rgba(139,92,246,0.25)', countKey: null },
  { perm: 'audit:read',        label: 'Audit Logs',    desc: 'Review audit trail',                path: '/dashboard/audit',         icon: FiFileText,   gradient: 'from-orange-500 to-amber-500',   glow: 'rgba(249,115,22,0.25)',  countKey: null },
  { perm: 'reward:read',       label: 'Rewards',       desc: 'Manage loyalty rewards',            path: '/dashboard/rewards',       icon: FiGift,       gradient: 'from-yellow-500 to-orange-400',  glow: 'rgba(234,179,8,0.25)',   countKey: null },
  { perm: 'role:read',         label: 'Roles',         desc: 'View role definitions',             path: '/dashboard/roles',         icon: FiLayers,     gradient: 'from-purple-500 to-violet-600',  glow: 'rgba(167,139,250,0.25)', countKey: null },
  { perm: 'permission:read',   label: 'Permissions',   desc: 'Browse permission catalogue',       path: '/dashboard/permissions',   icon: FiKey,        gradient: 'from-amber-500 to-yellow-500',   glow: 'rgba(245,158,11,0.25)',  countKey: null },
  { perm: 'notification:send', label: 'Notifications', desc: 'Send system notifications',         path: '/dashboard/notifications', icon: FiBell,       gradient: 'from-cyan-500 to-sky-500',       glow: 'rgba(6,182,212,0.25)',   countKey: null },
];

const STAT_ACCENTS = {
  users:    { color: '#14b8a6', bg: 'rgba(20,184,166,0.10)',  label: 'Total Users',      emptyText: 'No data',           icon: FiUsers      },
  disputes: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   label: 'Open Disputes',    emptyText: 'All clear',         icon: FiShield     },
  refunds:  { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   label: 'Pending Refunds',  emptyText: 'None pending',      icon: FiDollarSign },
};

function getInitials(firstName?: string, lastName?: string) {
  return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase() || 'U';
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function OthersDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: permissions = [], isLoading: permsLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: () => roleService.getMyPermissions(),
    enabled: !!user?.id,
    staleTime: 0,
    gcTime: 0,
  });

  const permSet = new Set(permissions.map((p: any) => `${p.resource}:${p.action}`));
  const has = (perm: string) => permSet.has(perm);

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

  const counts: Record<string, number | null> = {
    users:    userStats?.total ?? null,
    disputes: disputes?.total  ?? null,
    refunds:  refunds?.total   ?? null,
  };

  const displayName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const roleName    = user ? getDisplayRole(user) : 'Staff';
  const initials    = getInitials(user?.firstName, user?.lastName);

  const statCards = [
    has('user:read') && {
      key:   'users',
      value: userStats?.total ?? null,
      sub:   userStats ? `+${userStats.recentSignups ?? 0} new signups` : null,
      ...STAT_ACCENTS.users,
    },
    has('dispute:read') && {
      key:   'disputes',
      value: disputes?.total ?? null,
      sub:   disputes?.total ? 'Requires attention' : 'All clear',
      ...STAT_ACCENTS.disputes,
    },
    has('refund:read') && {
      key:   'refunds',
      value: refunds?.total ?? null,
      sub:   refunds?.total ? 'Awaiting processing' : 'None pending',
      ...STAT_ACCENTS.refunds,
    },
  ].filter(Boolean) as any[];

  const accessibleSections = SECTION_CARDS.filter(c => permSet.has(c.perm));

  if (permsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A]">
      <div className="w-full px-6 py-6 space-y-6">

        {/* ── Hero banner ─────────────────────────────────────── */}
        <div className="w-full relative rounded-2xl overflow-hidden shadow-lg">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />

          {/* Decorative orbs */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-20 w-32 h-32 rounded-full bg-purple-400/20 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 p-7">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow" />
            </div>

            {/* Name + greeting */}
            <div className="flex-1 min-w-0">
              <p className="text-indigo-200 text-sm font-medium">{getGreeting()}</p>
              <h1 className="text-2xl font-bold text-white mt-0.5 truncate">
                {displayName || 'Staff Member'}
              </h1>
              <p className="text-indigo-200 text-xs mt-1">{formatDate()}</p>
            </div>

            {/* Role chip + section count */}
            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold">
                <FiActivity className="w-3.5 h-3.5" />
                {roleName}
              </span>
              {accessibleSections.length > 0 && (
                <span className="text-xs text-indigo-200">
                  {accessibleSections.length} section{accessibleSections.length !== 1 ? 's' : ''} available
                </span>
              )}
            </div>
          </div>

          {/* Inline mini-stat bubbles (only if user has relevant perms) */}
          {statCards.length > 0 && (
            <div className="relative flex items-center gap-3 px-7 pb-5 flex-wrap">
              {statCards.map((card: any) => (
                <div
                  key={card.key}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15"
                >
                  <card.icon className="w-3.5 h-3.5 text-white/70" />
                  <span className="text-white text-xs font-medium">{card.label}:</span>
                  <span className="text-white text-xs font-bold tabular-nums">
                    {card.value !== null ? card.value : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Stat cards ──────────────────────────────────────── */}
        {statCards.length > 0 && (
          <div className={`grid gap-4 ${
            statCards.length === 1 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
            statCards.length === 2 ? 'grid-cols-1 sm:grid-cols-2'               :
                                     'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {statCards.map((card: any) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.key}
                  className="relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden p-6 group hover:shadow-md transition-shadow"
                >
                  {/* Top accent line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                    style={{ background: card.color }}
                  />

                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 dark:text-[#64748B] uppercase tracking-wider mb-3">
                        {card.label}
                      </p>
                      <p className="text-4xl font-black text-gray-900 dark:text-white tabular-nums">
                        {card.value !== null ? card.value : '—'}
                      </p>
                      {card.sub && (
                        <p className="text-xs text-gray-400 dark:text-[#64748B] mt-2">{card.sub}</p>
                      )}
                    </div>
                    <div
                      className="p-3 rounded-xl"
                      style={{ background: card.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: card.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Quick access sections ────────────────────────────── */}
        {accessibleSections.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <h2 className="text-sm font-bold text-gray-800 dark:text-white">Quick Access</h2>
              <span className="text-xs text-gray-400 dark:text-[#64748B]">
                — {accessibleSections.length} section{accessibleSections.length !== 1 ? 's' : ''} available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accessibleSections.map((card) => {
                const Icon   = card.icon;
                const count  = card.countKey ? counts[card.countKey] : null;
                const urgent = count !== null && count > 0 && (card.countKey === 'disputes' || card.countKey === 'refunds');

                return (
                  <button
                    key={card.label}
                    onClick={() => router.push(card.path)}
                    className="relative group w-full rounded-2xl overflow-hidden text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.99]"
                  >
                    {/* Card gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />

                    {/* Glow orb */}
                    <div
                      className="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-xl opacity-50 pointer-events-none"
                      style={{ background: card.glow }}
                    />

                    <div className="relative flex items-center gap-4 p-5">
                      {/* Icon box */}
                      <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-inner">
                        <Icon className="w-5 h-5 text-white" />
                      </div>

                      {/* Label + desc */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">{card.label}</p>
                        <p className="text-xs text-white/70 mt-0.5 truncate">{card.desc}</p>
                      </div>

                      {/* Count badge */}
                      {count !== null && count > 0 && (
                        <span className={`flex-shrink-0 min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold px-1.5 ${
                          urgent ? 'bg-white text-red-500' : 'bg-white/25 text-white'
                        }`}>
                          {count}
                        </span>
                      )}

                      {/* Arrow */}
                      <FiArrowRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#1E293B] rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/8">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
              <FiKey className="w-7 h-7 text-gray-300 dark:text-[#334155]" />
            </div>
            <p className="text-base font-semibold text-gray-700 dark:text-[#94A3B8]">No sections assigned yet</p>
            <p className="text-sm text-gray-400 dark:text-[#475569] mt-1">Contact your administrator to request access.</p>
          </div>
        )}

      </div>
    </div>
  );
}
