'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import {
  FiBell,
  FiMail,
  FiMessageSquare,
  FiSmartphone,
  FiCheck,
  FiX,
} from '@/utils/icons';
import { Notification } from '@/services/notification.service';

export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated) {
      checkAuth();
    }
  }, [isLoading, isAuthenticated, router, checkAuth]);

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications', typeFilter],
    queryFn: () => notificationService.getNotifications({ type: typeFilter || undefined, page: 1, limit: 50 }),
    enabled: !!user,
  });

  if (isLoading || notificationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = user?.role || 'CUSTOMER';

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return <FiMail className="w-5 h-5" />;
      case 'SMS':
        return <FiMessageSquare className="w-5 h-5" />;
      case 'PUSH':
        return <FiSmartphone className="w-5 h-5" />;
      default:
        return <FiBell className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return 'bg-blue-100 text-blue-700';
      case 'SMS':
        return 'bg-green-100 text-green-700';
      case 'PUSH':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <DashboardLayout role={role}>
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">View and manage your notifications</p>
          </div>
          <button
            onClick={async () => {
              await notificationService.markAllAsRead();
            }}
            className="btn-secondary text-sm"
          >
            Mark All as Read
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Types</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="PUSH">Push</option>
              <option value="IN_APP">In-App</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications?.data && notifications.data.length > 0 ? (
            notifications.data.map((notification: Notification) => (
              <div
                key={notification.id}
                className={`card ${!notification.readAt ? 'border-l-4 border-l-primary' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-gray-600 text-sm">{notification.body}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.readAt && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          notification.status === 'SENT'
                            ? 'bg-green-100 text-green-700'
                            : notification.status === 'FAILED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {notification.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-12">
              <FiBell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notifications found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

