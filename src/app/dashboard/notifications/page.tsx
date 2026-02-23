'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, Notification } from '@/services/notification.service';
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
} from '@/utils/icons';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [readFilter, setReadFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const limit = 15;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: notificationsRaw, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications', typeFilter, readFilter, page, limit],
    queryFn: () => notificationService.getNotifications({
      type: typeFilter || undefined,
      read: readFilter === 'read' ? true : readFilter === 'unread' ? false : undefined,
      page,
      limit,
    }),
    enabled: !!user,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: !!user,
  });

  const notifications = useMemo(() => {
    if (!notificationsRaw) return [];
    if (Array.isArray(notificationsRaw)) return notificationsRaw;
    return (notificationsRaw as any)?.data || [];
  }, [notificationsRaw]);

  const filteredNotifications = useMemo(() => {
    if (!debouncedSearch) return notifications;
    const q = debouncedSearch.toLowerCase();
    return notifications.filter((n: Notification) =>
      n.title?.toLowerCase().includes(q) ||
      n.body?.toLowerCase().includes(q)
    );
  }, [notifications, debouncedSearch]);

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: (data) => {
      toast.success(`Marked ${(data as any)?.count || 'all'} notifications as read`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onError: () => {
      toast.error('Failed to mark all as read');
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';
  const total = (notificationsRaw as any)?.total || notifications.length;
  const totalPages = Math.ceil(total / limit);
  const unread = (unreadCount as any)?.unreadCount || (unreadCount as any)?.count || 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return FiMail;
      case 'SMS': return FiMessageSquare;
      case 'PUSH': return FiSmartphone;
      case 'IN_APP': return FiBell;
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

  const statCards = [
    {
      label: 'Total',
      value: total,
      icon: FiBell,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
    },
    {
      label: 'Unread',
      value: unread,
      icon: FiActivity,
      color: 'from-rose-500 to-red-600',
      shadow: 'shadow-rose-500/25',
    },
    {
      label: 'Read',
      value: Math.max(0, total - unread),
      icon: FiCheckCircle,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
    },
    {
      label: 'This Page',
      value: filteredNotifications.length,
      icon: FiEye,
      color: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/25',
    },
  ];

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <div>
        {/* Header */}
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-500 text-sm">View and manage your notifications</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
              title="Refresh"
            >
              <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            {unread > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <FiCheck className="w-4 h-4" />
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg ${card.shadow}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm min-w-[140px]"
            >
              <option value="">All Types</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="PUSH">Push</option>
              <option value="IN_APP">In-App</option>
            </select>
            <select
              value={readFilter}
              onChange={(e) => { setReadFilter(e.target.value); setPage(1); }}
              className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm min-w-[140px]"
            >
              <option value="">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {notificationsLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <>
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification: Notification) => {
                  const typeStyle = getTypeStyle(notification.type);
                  const TypeIcon = getTypeIcon(notification.type);
                  const isUnread = !notification.readAt;
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors ${
                        isUnread ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${typeStyle.color} text-white shadow-lg ${typeStyle.shadow} flex-shrink-0 mt-0.5`}>
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {isUnread && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                              )}
                              <h3 className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                {notification.title}
                              </h3>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notification.body}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ring-inset ${typeStyle.badge}`}>
                                {notification.type}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ring-inset ${getStatusStyle(notification.status)}`}>
                                {notification.status}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                <FiClock className="w-3 h-3" />
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                          {isUnread && (
                            <button
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              disabled={markAsReadMutation.isPending}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex-shrink-0"
                              title="Mark as read"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50 gap-3">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-700">{(page - 1) * limit + 1}</span>&ndash;<span className="font-medium text-gray-700">{Math.min(page * limit, total)}</span> of <span className="font-medium text-gray-700">{total}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-gray-600 px-3 min-w-[100px] text-center">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiBell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-semibold mb-1">No notifications</p>
              <p className="text-sm text-gray-400">
                {typeFilter || readFilter || debouncedSearch ? 'Try adjusting your filters' : 'You\'re all caught up!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
