'use client';

import { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  notificationService,
  Notification,
  NotificationType,
  BroadcastResult,
} from '@/services/notification.service';
import { adminService } from '@/services/admin.service';
import CustomSelect from '@/components/ui/CustomSelect';
import {
  FiBell,
  FiMail,
  FiMessageSquare,
  FiSmartphone,
  FiCheck,
  FiCheckCircle,
  FiSearch,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiClock,
  FiActivity,
  FiUser,
  FiUsers,
  FiTrash2,
  FiSend,
  FiGlobe,
  FiAlertTriangle,
  FiX,
} from '@/utils/icons';
import toast from 'react-hot-toast';

type Tab = 'mine' | 'all' | 'send' | 'broadcast' | 'history';

const CHANNELS: NotificationType[] = ['IN_APP', 'PUSH', 'EMAIL', 'SMS'];
const TARGET_ROLES = ['CUSTOMER', 'CASHIER', 'ADMIN', 'OTHERS'];
const TARGET_TIERS = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

function NotificationsContent() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const isAdmin = !!(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'OTHERS');
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'all' || tab === 'send' || tab === 'broadcast' || tab === 'history') return tab;
    return 'mine';
  });

  // List filters
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const limit = 10;

  // Delete confirm: stores notification id pending confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // User search for Send tab
  const [userSearch, setUserSearch] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const userSearchRef = useRef<HTMLDivElement>(null);

  // Broadcast history page
  const [historyPage, setHistoryPage] = useState(1);

  // Send form state
  const [sendForm, setSendForm] = useState({ userId: '', type: 'IN_APP' as NotificationType, title: '', body: '', priority: 'normal' });

  // Broadcast form state
  const [broadcastForm, setBroadcastForm] = useState({ title: '', body: '', priority: 'normal' });
  const [selectedChannels, setSelectedChannels] = useState<NotificationType[]>(['IN_APP']);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [broadcastResult, setBroadcastResult] = useState<BroadcastResult | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const tab = searchParams.get('tab') as Tab | null;
    if (tab && ['mine', 'all', 'send', 'broadcast', 'history'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => { setPage(1); }, [activeTab, typeFilter, readFilter]);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Debounced user search for Send tab
  useEffect(() => {
    if (!userSearch.trim() || userSearch.length < 2) { setUserSearchResults([]); return; }
    const t = setTimeout(async () => {
      setUserSearchLoading(true);
      try {
        const res = await adminService.getUsers({ search: userSearch.trim(), limit: 6, page: 1 });
        setUserSearchResults(res.data || []);
      } catch { setUserSearchResults([]); }
      finally { setUserSearchLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  // Close user search dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target as Node)) setShowUserDropdown(false);
    };
    if (showUserDropdown) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showUserDropdown]);

  // Queries
  const { data: myRaw, isLoading: myLoading } = useQuery({
    queryKey: ['notifications', 'mine', typeFilter, readFilter, page, limit],
    queryFn: () => notificationService.getNotifications({ type: typeFilter || undefined, read: readFilter === 'read' ? true : readFilter === 'unread' ? false : undefined, page, limit }),
    enabled: !!user && (activeTab === 'mine' || !isAdmin),
  });

  const { data: allRaw, isLoading: allLoading } = useQuery({
    queryKey: ['notifications', 'all', typeFilter, readFilter, page, limit],
    queryFn: () => notificationService.getAllNotifications({ type: typeFilter || undefined, read: readFilter === 'read' ? true : readFilter === 'unread' ? false : undefined, page, limit }),
    enabled: !!user && isAdmin && activeTab === 'all',
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: !!user,
  });

  const { data: broadcastHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['notifications', 'broadcast-history', historyPage],
    queryFn: () => notificationService.getBroadcastHistory(historyPage, 15),
    enabled: !!user && isAdmin && activeTab === 'history',
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] }); },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: (data) => {
      toast.success(`Marked ${(data as any)?.count || 'all'} notifications as read`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      toast.success('Notification deleted');
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Failed to delete notification'),
  });

  const sendMutation = useMutation({
    mutationFn: () => notificationService.sendNotification({ userId: sendForm.userId, type: sendForm.type, title: sendForm.title, body: sendForm.body, data: sendForm.priority ? { priority: sendForm.priority } : undefined }),
    onSuccess: () => {
      toast.success('Notification sent successfully');
      setSendForm({ userId: '', type: 'IN_APP', title: '', body: '', priority: 'normal' });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to send notification'),
  });

  const broadcastMutation = useMutation({
    mutationFn: () => notificationService.broadcastNotification({
      ...broadcastForm,
      channels: selectedChannels,
      targetRoles: selectedRoles.length > 0 ? selectedRoles : undefined,
      targetTiers: selectedTiers.length > 0 ? selectedTiers : undefined,
    }),
    onSuccess: (result) => {
      toast.success(result.message || 'Broadcast sent!');
      setBroadcastResult(result);
      queryClient.invalidateQueries({ queryKey: ['notifications', 'broadcast-history'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to send broadcast'),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Derived data
  const activeRaw = (isAdmin && activeTab === 'all') ? allRaw : myRaw;
  const activeLoading = (isAdmin && activeTab === 'all') ? allLoading : myLoading;

  const notifications = useMemo(() => {
    if (!activeRaw) return [];
    if (Array.isArray(activeRaw)) return activeRaw;
    return (activeRaw as any)?.data || [];
  }, [activeRaw]);

  const filteredNotifications = useMemo(() => {
    if (!debouncedSearch) return notifications;
    const q = debouncedSearch.toLowerCase();
    return notifications.filter((n: Notification) =>
      n.title?.toLowerCase().includes(q) || n.body?.toLowerCase().includes(q) || (n as any).userId?.toLowerCase().includes(q)
    );
  }, [notifications, debouncedSearch]);

  const uniqueUserIds = useMemo(() => {
    if (!isAdmin || activeTab !== 'all') return [];
    return [...new Set(filteredNotifications.map((n: any) => n.userId).filter(Boolean) as string[])];
  }, [filteredNotifications, isAdmin, activeTab]);

  const userQueries = useQueries({
    queries: uniqueUserIds.map((uid) => ({
      queryKey: ['admin', 'user', uid],
      queryFn: () => adminService.getUserById(uid),
      staleTime: 5 * 60 * 1000,
      retry: 0,
    })),
  });

  const userMap = useMemo(() => {
    const map: Record<string, { name: string; email: string }> = {};
    userQueries.forEach((q, i) => {
      const uid = uniqueUserIds[i];
      if (uid && q.data) {
        const u = q.data as any;
        map[uid] = { name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || uid, email: u.email || '' };
      }
    });
    return map;
  }, [userQueries, uniqueUserIds]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  }

  const total = (activeRaw as any)?.total || notifications.length;
  const totalPages = Math.ceil(total / limit);
  const unread = (unreadCount as any)?.unreadCount || (unreadCount as any)?.count || 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return FiMail;
      case 'SMS': return FiMessageSquare;
      case 'PUSH': return FiSmartphone;
      default: return FiBell;
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'EMAIL': return { color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25', badge: 'bg-blue-50 text-blue-700 ring-blue-600/20' };
      case 'SMS': return { color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/25', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' };
      case 'PUSH': return { color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25', badge: 'bg-violet-50 text-violet-700 ring-violet-600/20' };
      case 'IN_APP': return { color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/25', badge: 'bg-amber-50 text-amber-700 ring-amber-600/20' };
      default: return { color: 'from-gray-500 to-gray-600', shadow: 'shadow-gray-500/25', badge: 'bg-gray-50 text-gray-700 ring-gray-500/20' };
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      case 'FAILED': return 'bg-red-50 text-red-700 ring-red-600/20';
      case 'PENDING': return 'bg-amber-50 text-amber-700 ring-amber-600/20';
      case 'READ': return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      default: return 'bg-gray-50 text-gray-700 ring-gray-500/20';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const toggleItem = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const statCards = [
    { label: 'Total', value: total, icon: FiBell, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
    { label: 'Unread', value: unread, icon: FiActivity, color: 'from-rose-500 to-red-600', shadow: 'shadow-rose-500/25' },
    { label: 'Read', value: Math.max(0, total - unread), icon: FiCheckCircle, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/25' },
    { label: 'Showing', value: filteredNotifications.length, icon: FiEye, color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <FiBell className="w-6 h-6" />
            </div>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#E5B887]">Notifications</h1>
            <p className="text-gray-500 text-sm">
              {isAdmin ? 'Manage your notifications and system-wide alerts' : 'View and manage your notifications'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={isRefreshing} className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50" title="Refresh">
            <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          {activeTab === 'mine' && unread > 0 && (
            <button onClick={() => markAllAsReadMutation.mutate()} disabled={markAllAsReadMutation.isPending} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50">
              <FiCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Tabs — admin gets 5 tabs, others get none */}
      {isAdmin && (
        <div className="overflow-x-auto min-w-0 mb-6">
          <div className="flex gap-1 bg-gray-100 dark:bg-[#1E293B] rounded-xl p-1 w-max">
            {([
              { id: 'mine' as Tab, label: 'My Notifications', icon: FiUser },
              { id: 'all' as Tab, label: 'All Notifications', icon: FiUsers },
              { id: 'send' as Tab, label: 'Send', icon: FiSend },
              { id: 'broadcast' as Tab, label: 'Broadcast', icon: FiGlobe },
              { id: 'history' as Tab, label: 'Broadcast History', icon: FiClock },
            ] as { id: Tab; label: string; icon: any }[]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white dark:bg-[#2D3F55] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-[#94A3B8] hover:text-gray-700 dark:hover:text-[#F1F5F9] hover:bg-white/50 dark:hover:bg-[#2D3F55]/60'}`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
                {tab.id === 'mine' && unread > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">{unread}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Mine & All tabs: stat cards + filters + list ── */}
      {(activeTab === 'mine' || activeTab === 'all') && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-4 flex items-center gap-4">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg ${card.shadow} flex-shrink-0`}>
                  <card.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-[#94A3B8]">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-[#F1F5F9] mt-0.5">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-5 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#64748B] w-5 h-5" />
                <input
                  type="text"
                  placeholder={isAdmin && activeTab === 'all' ? 'Search by title, message or user ID...' : 'Search notifications...'}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#263349] border border-gray-200 dark:border-white/10 focus:bg-white dark:focus:bg-[#2D3F55] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-gray-900 dark:text-[#F1F5F9] placeholder-gray-400 dark:placeholder-[#64748B]"
                />
              </div>
              <CustomSelect value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }} options={[{ value: '', label: 'All Types' }, { value: 'EMAIL', label: 'Email' }, { value: 'SMS', label: 'SMS' }, { value: 'PUSH', label: 'Push' }, { value: 'IN_APP', label: 'In-App' }]} className="min-w-[140px]" />
              <CustomSelect value={readFilter} onChange={(v) => { setReadFilter(v); setPage(1); }} options={[{ value: '', label: 'All' }, { value: 'unread', label: 'Unread' }, { value: 'read', label: 'Read' }]} className="min-w-[140px]" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
            {isAdmin && activeTab === 'all' && (
              <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-[#263349]/60 flex items-center gap-2">
                <FiUsers className="w-4 h-4 text-gray-400 dark:text-[#64748B]" />
                <p className="text-xs font-medium text-gray-500 dark:text-[#94A3B8]">Showing notifications sent to all users across the system</p>
              </div>
            )}

            {activeLoading ? (
              <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
            ) : filteredNotifications.length > 0 ? (
              <>
                <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                  {filteredNotifications.map((notification: Notification) => {
                    const typeStyle = getTypeStyle(notification.type);
                    const TypeIcon = getTypeIcon(notification.type);
                    const isUnread = !notification.readAt;
                    const recipientId = (notification as any).userId as string | undefined;
                    const isConfirmingDelete = deleteConfirmId === notification.id;

                    return (
                      <div key={notification.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50/60 dark:hover:bg-white/[0.03] transition-colors ${isUnread && activeTab === 'mine' ? 'bg-blue-50/30 dark:bg-blue-500/[0.05]' : ''}`}>
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${typeStyle.color} text-white shadow-lg ${typeStyle.shadow} flex-shrink-0 mt-0.5`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                {isUnread && activeTab === 'mine' && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                                <h3 className={`text-sm truncate ${isUnread && activeTab === 'mine' ? 'font-bold text-gray-900 dark:text-[#F1F5F9]' : 'font-medium text-gray-700 dark:text-[#CBD5E1]'}`}>{notification.title}</h3>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-[#64748B] line-clamp-2 mt-0.5">{notification.body}</p>

                              {isAdmin && activeTab === 'all' && recipientId && (() => {
                                const recipient = userMap[recipientId];
                                const isLoadingUser = uniqueUserIds.includes(recipientId) && userQueries[uniqueUserIds.indexOf(recipientId)]?.isLoading;
                                return (
                                  <button onClick={() => router.push(`/dashboard/users/${recipientId}`)} className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 ring-1 ring-inset ring-indigo-600/20 dark:ring-indigo-400/20 text-[10px] font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors" title={recipient ? `${recipient.name} · ${recipient.email}` : recipientId}>
                                    <FiUser className="w-3 h-3 flex-shrink-0" />
                                    {isLoadingUser ? <span className="w-16 h-2.5 bg-indigo-200 dark:bg-indigo-500/30 rounded animate-pulse inline-block" /> : recipient ? <span>{recipient.name}{recipient.email && <span className="opacity-60 ml-1">· {recipient.email}</span>}</span> : <span>{recipientId.substring(0, 8)}…</span>}
                                  </button>
                                );
                              })()}

                              <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ring-inset ${typeStyle.badge}`}>{notification.type}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ring-inset ${getStatusStyle(notification.status)}`}>{notification.status}</span>
                                <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-[#64748B]"><FiClock className="w-3 h-3" />{formatTime(notification.createdAt)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              {activeTab === 'mine' && isUnread && (
                                <button onClick={() => markAsReadMutation.mutate(notification.id)} disabled={markAsReadMutation.isPending} className="p-1.5 rounded-lg text-gray-400 dark:text-[#64748B] hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all" title="Mark as read">
                                  <FiCheck className="w-4 h-4" />
                                </button>
                              )}
                              {isAdmin && activeTab === 'all' && (
                                isConfirmingDelete ? (
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => deleteMutation.mutate(notification.id)} disabled={deleteMutation.isPending} className="px-2 py-1 rounded-lg bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-colors disabled:opacity-50">
                                      {deleteMutation.isPending ? '...' : 'Yes'}
                                    </button>
                                    <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-[#334155] text-gray-600 dark:text-[#CBD5E1] text-[10px] font-bold hover:bg-gray-200 dark:hover:bg-[#3E5068] transition-colors">No</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setDeleteConfirmId(notification.id)} className="p-1.5 rounded-lg text-gray-400 dark:text-[#64748B] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all" title="Delete notification">
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-[#263349]/40 gap-3">
                    <p className="text-sm text-gray-500 dark:text-[#94A3B8]">Showing <span className="font-medium text-gray-700 dark:text-[#CBD5E1]">{(page - 1) * limit + 1}</span>–<span className="font-medium text-gray-700 dark:text-[#CBD5E1]">{Math.min(page * limit, total)}</span> of <span className="font-medium text-gray-700 dark:text-[#CBD5E1]">{total}</span></p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E293B] hover:bg-gray-50 dark:hover:bg-[#2D3F55] text-gray-600 dark:text-[#94A3B8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><FiChevronLeft className="w-4 h-4" /></button>
                      <span className="text-sm font-medium text-gray-600 dark:text-[#94A3B8] px-3 min-w-[100px] text-center">Page {page} of {totalPages}</span>
                      <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E293B] hover:bg-gray-50 dark:hover:bg-[#2D3F55] text-gray-600 dark:text-[#94A3B8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><FiChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 dark:bg-[#263349] rounded-2xl flex items-center justify-center mx-auto mb-4"><FiBell className="w-8 h-8 text-gray-400 dark:text-[#64748B]" /></div>
                <p className="text-gray-900 dark:text-[#F1F5F9] font-semibold mb-1">No notifications</p>
                <p className="text-sm text-gray-400 dark:text-[#64748B]">{typeFilter || readFilter || debouncedSearch ? 'Try adjusting your filters' : activeTab === 'all' ? 'No notifications have been sent to any user yet' : "You're all caught up!"}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Send Notification tab ── */}
      {activeTab === 'send' && (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-6 max-w-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"><FiSend className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-[#F1F5F9]">Send Notification</h2>
              <p className="text-sm text-gray-500 dark:text-[#94A3B8]">Send a notification to a specific user</p>
            </div>
          </div>
          <div className="space-y-4">

            {/* User search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-1.5">Recipient <span className="text-red-500">*</span></label>
              {selectedUser ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                    {selectedUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-[#F1F5F9] truncate">{selectedUser.name}</p>
                    <p className="text-xs text-gray-500 dark:text-[#64748B] truncate">{selectedUser.email}</p>
                  </div>
                  <button onClick={() => { setSelectedUser(null); setSendForm((f) => ({ ...f, userId: '' })); setUserSearch(''); }}
                    className="text-gray-400 dark:text-[#64748B] hover:text-red-500 transition-colors flex-shrink-0">
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative" ref={userSearchRef}>
                  <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#64748B] w-4 h-4" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => { setUserSearch(e.target.value); setShowUserDropdown(true); }}
                      onFocus={() => setShowUserDropdown(true)}
                      placeholder="Search by name or email…"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#263349] border border-gray-200 dark:border-white/10 focus:bg-white dark:focus:bg-[#2D3F55] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-gray-900 dark:text-[#F1F5F9] placeholder-gray-400 dark:placeholder-[#64748B]"
                    />
                    {userSearchLoading && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                  </div>
                  {showUserDropdown && (userSearch.length >= 2) && (
                    <div className="absolute z-20 mt-1 w-full bg-white dark:bg-[#263349] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                      {userSearchResults.length > 0 ? userSearchResults.map((u) => (
                        <button key={u.id} type="button"
                          onClick={() => {
                            setSelectedUser({ id: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email });
                            setSendForm((f) => ({ ...f, userId: u.id }));
                            setShowUserDropdown(false);
                            setUserSearch('');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#2D3F55] transition-colors text-left">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-[#F1F5F9] truncate">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-gray-500 dark:text-[#64748B] truncate">{u.email} · {u.role}</p>
                          </div>
                        </button>
                      )) : !userSearchLoading && (
                        <div className="px-4 py-3 text-sm text-gray-400 dark:text-[#64748B] text-center">No users found</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-1.5">Type <span className="text-red-500">*</span></label>
              <CustomSelect value={sendForm.type} onChange={(v) => setSendForm((f) => ({ ...f, type: v as NotificationType }))} options={CHANNELS.map((c) => ({ value: c, label: c }))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-1.5">Title <span className="text-red-500">*</span></label>
              <input type="text" value={sendForm.title} onChange={(e) => setSendForm((f) => ({ ...f, title: e.target.value }))} placeholder="Notification title" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#263349] border border-gray-200 dark:border-white/10 focus:bg-white dark:focus:bg-[#2D3F55] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-gray-900 dark:text-[#F1F5F9] placeholder-gray-400 dark:placeholder-[#64748B]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-1.5">Message <span className="text-red-500">*</span></label>
              <textarea rows={4} value={sendForm.body} onChange={(e) => setSendForm((f) => ({ ...f, body: e.target.value }))} placeholder="Notification message body" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#263349] border border-gray-200 dark:border-white/10 focus:bg-white dark:focus:bg-[#2D3F55] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none text-gray-900 dark:text-[#F1F5F9] placeholder-gray-400 dark:placeholder-[#64748B]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-1.5">Priority</label>
              <CustomSelect value={sendForm.priority} onChange={(v) => setSendForm((f) => ({ ...f, priority: v }))} options={[{ value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }]} className="w-full" />
            </div>
            <button
              onClick={() => { sendMutation.mutate(); }}
              disabled={sendMutation.isPending || !sendForm.userId || !sendForm.title || !sendForm.body}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendMutation.isPending ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</> : <><FiSend className="w-4 h-4" />Send Notification</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Broadcast tab ── */}
      {activeTab === 'broadcast' && (
        <div className="max-w-2xl space-y-6">
          {broadcastResult ? (
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"><FiCheckCircle className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-[#F1F5F9]">Broadcast Sent!</h2>
                  <p className="text-sm text-gray-500 dark:text-[#94A3B8]">{broadcastResult.message}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-gray-50 dark:bg-[#263349] rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-[#94A3B8] mb-1">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-[#F1F5F9]">{broadcastResult.stats?.totalUsers ?? '–'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#263349] rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-[#94A3B8] mb-1">Notifications Sent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-[#F1F5F9]">{broadcastResult.stats?.notificationsSent ?? '–'}</p>
                </div>
              </div>
              {broadcastResult.stats?.byChannel && (
                <div className="space-y-2 mb-5">
                  {Object.entries(broadcastResult.stats.byChannel).map(([ch, s]) => (
                    <div key={ch} className="flex items-center justify-between text-sm px-4 py-2 bg-gray-50 dark:bg-[#263349] rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-[#CBD5E1]">{ch}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{s.sent} sent{s.failed > 0 && <span className="text-red-500 ml-2">/ {s.failed} failed</span>}</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => { setBroadcastResult(null); setBroadcastForm({ title: '', body: '', priority: 'normal' }); setSelectedChannels(['IN_APP']); setSelectedRoles([]); setSelectedTiers([]); }} className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-[#CBD5E1] font-medium hover:bg-gray-50 dark:hover:bg-[#263349] transition-colors text-sm">
                Send Another Broadcast
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25"><FiGlobe className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-[#F1F5F9]">Broadcast Notification</h2>
                  <p className="text-sm text-gray-500 dark:text-[#94A3B8]">Send a message to all or targeted users</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-1.5">Title <span className="text-red-500">*</span></label>
                  <input type="text" value={broadcastForm.title} onChange={(e) => setBroadcastForm((f) => ({ ...f, title: e.target.value }))} placeholder="Broadcast title" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#263349] border border-gray-200 dark:border-white/10 focus:bg-white dark:focus:bg-[#2D3F55] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-gray-900 dark:text-[#F1F5F9] placeholder-gray-400 dark:placeholder-[#64748B]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-1.5">Message <span className="text-red-500">*</span></label>
                  <textarea rows={4} value={broadcastForm.body} onChange={(e) => setBroadcastForm((f) => ({ ...f, body: e.target.value }))} placeholder="Write your broadcast message..." className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#263349] border border-gray-200 dark:border-white/10 focus:bg-white dark:focus:bg-[#2D3F55] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none text-gray-900 dark:text-[#F1F5F9] placeholder-gray-400 dark:placeholder-[#64748B]" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-2">Channels <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map((ch) => (
                      <button key={ch} onClick={() => setSelectedChannels((prev) => toggleItem(prev, ch))} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${selectedChannels.includes(ch) ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-[#263349] text-gray-600 dark:text-[#94A3B8] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}>{ch}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-2">Target Roles <span className="text-xs font-normal text-gray-400 dark:text-[#64748B]">(leave empty for all)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {TARGET_ROLES.map((r) => (
                      <button key={r} onClick={() => setSelectedRoles((prev) => toggleItem(prev, r))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedRoles.includes(r) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white dark:bg-[#263349] text-gray-600 dark:text-[#94A3B8] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}>{r}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-2">Target Tiers <span className="text-xs font-normal text-gray-400 dark:text-[#64748B]">(leave empty for all)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {TARGET_TIERS.map((t) => (
                      <button key={t} onClick={() => setSelectedTiers((prev) => toggleItem(prev, t))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedTiers.includes(t) ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-[#263349] text-gray-600 dark:text-[#94A3B8] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}>{t}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#94A3B8] mb-1.5">Priority</label>
                  <CustomSelect value={broadcastForm.priority} onChange={(v) => setBroadcastForm((f) => ({ ...f, priority: v }))} options={[{ value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }]} className="w-full" />
                </div>

                {selectedChannels.length === 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm">
                    <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Select at least one channel to broadcast
                  </div>
                )}

                <button
                  onClick={() => broadcastMutation.mutate()}
                  disabled={broadcastMutation.isPending || !broadcastForm.title || !broadcastForm.body || selectedChannels.length === 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {broadcastMutation.isPending ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Broadcasting...</> : <><FiGlobe className="w-4 h-4" />Send Broadcast</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Broadcast History tab ── */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400"><FiClock className="w-4 h-4" /></div>
            <h2 className="font-bold text-gray-900 dark:text-[#F1F5F9]">Broadcast History</h2>
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (broadcastHistory?.announcements?.length ?? 0) > 0 ? (
            <>
              <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {broadcastHistory!.announcements.map((a) => (
                  <div key={a.id} className="px-5 py-4 hover:bg-gray-50/60 dark:hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-[#F1F5F9] mb-0.5">{a.title}</p>
                        <p className="text-xs text-gray-500 dark:text-[#94A3B8] line-clamp-2">{a.body}</p>
                        {(a.data as any)?.sentBy && (
                          <p className="text-[10px] text-gray-400 dark:text-[#64748B] mt-1">Sent by: {(a.data as any).sentBy}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400 dark:text-[#64748B]">{formatTime(a.createdAt)}</p>
                        <p className="text-[10px] text-gray-300 dark:text-[#475569] mt-0.5">{new Date(a.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {(broadcastHistory?.pagination?.totalPages ?? 1) > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-[#263349]/40">
                  <p className="text-sm text-gray-500 dark:text-[#94A3B8]">Page {historyPage} of {broadcastHistory!.pagination.totalPages}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setHistoryPage((p) => Math.max(1, p - 1))} disabled={historyPage === 1} className="p-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E293B] hover:bg-gray-50 dark:hover:bg-[#2D3F55] text-gray-600 dark:text-[#94A3B8] disabled:opacity-40 transition-colors"><FiChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setHistoryPage((p) => Math.min(broadcastHistory!.pagination.totalPages, p + 1))} disabled={historyPage === broadcastHistory!.pagination.totalPages} className="p-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E293B] hover:bg-gray-50 dark:hover:bg-[#2D3F55] text-gray-600 dark:text-[#94A3B8] disabled:opacity-40 transition-colors"><FiChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-[#263349] rounded-2xl flex items-center justify-center mx-auto mb-4"><FiGlobe className="w-8 h-8 text-gray-400 dark:text-[#64748B]" /></div>
              <p className="text-gray-900 dark:text-[#F1F5F9] font-semibold mb-1">No broadcasts yet</p>
              <p className="text-sm text-gray-400 dark:text-[#64748B]">Send your first broadcast from the Broadcast tab</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>}>
      <NotificationsContent />
    </Suspense>
  );
}
