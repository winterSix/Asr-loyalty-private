import { apiClient, unwrapResponse } from '@/config/api';

export interface Notification {
  id: string;
  userId: string;
  type: 'PUSH' | 'SMS' | 'IN_APP' | 'EMAIL';
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority: string;
  readAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
}

export type NotificationType = 'PUSH' | 'SMS' | 'IN_APP' | 'EMAIL';
export type NotificationStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface SendNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: string;
}

export interface BroadcastNotificationDto {
  title: string;
  body: string;
  channels: NotificationType[];
  targetRoles?: string[];
  targetTiers?: string[];
  data?: Record<string, unknown>;
  priority?: string;
}

export interface BroadcastResult {
  success: boolean;
  message: string;
  stats: {
    totalUsers: number;
    notificationsSent: number;
    byChannel: Record<string, { sent: number; failed: number }>;
    failureCount: number;
  };
}

export interface BroadcastAnnouncement {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface BroadcastHistoryResponse {
  announcements: BroadcastAnnouncement[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

class NotificationService {
  // GET /notifications/me
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    type?: string;
    read?: boolean;
  }): Promise<NotificationsResponse> {
    const response = await apiClient.get<any>(
      '/notifications/me',
      { params }
    );
    // Backend response: { success, statusCode, data: { notifications, pagination, unreadCount }, pagination }
    // unwrapResponse returns { data: { notifications, pagination, unreadCount }, total, page, limit }
    // when top-level pagination is present, so we need to dig one level deeper.
    const raw = response.data;
    const inner = raw?.data ?? raw;  // { notifications: [...], pagination: {...}, unreadCount: N }
    const notifs = inner?.notifications ?? (Array.isArray(inner) ? inner : null);
    const pag = raw?.pagination ?? inner?.pagination;
    if (notifs !== null && notifs !== undefined) {
      return {
        data: notifs,
        total: pag?.total ?? notifs.length,
        page: pag?.page ?? params?.page ?? 1,
        limit: pag?.limit ?? params?.limit ?? 20,
      };
    }
    return unwrapResponse<NotificationsResponse>(raw);
  }

  // GET /notifications/me/unread-count
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await apiClient.get<{ unreadCount: number }>('/notifications/me/unread-count');
    return unwrapResponse<{ unreadCount: number }>(response.data);
  }

  // GET /notifications/:id (Admin only)
  async getNotification(notificationId: string): Promise<Notification> {
    const response = await apiClient.get<Notification>(`/notifications/${notificationId}`);
    return unwrapResponse<Notification>(response.data);
  }

  // PATCH /notifications/:id/read
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.patch<Notification>(`/notifications/${notificationId}/read`);
    return unwrapResponse<Notification>(response.data);
  }

  // PATCH /notifications/me/read-all
  async markAllAsRead(): Promise<{ count: number }> {
    const response = await apiClient.patch<{ count: number }>('/notifications/me/read-all');
    return unwrapResponse<{ count: number }>(response.data);
  }

  // POST /notifications/send (Admin only)
  async sendNotification(data: SendNotificationDto): Promise<Notification> {
    const response = await apiClient.post<Notification>('/notifications/send', data);
    return unwrapResponse<Notification>(response.data);
  }

  // GET /notifications (Admin only)
  async getAllNotifications(params?: {
    userId?: string;
    type?: string;
    status?: string;
    read?: boolean;
    page?: number;
    limit?: number;
  }): Promise<NotificationsResponse> {
    const response = await apiClient.get<NotificationsResponse>(
      '/notifications',
      { params }
    );
    const data = unwrapResponse<NotificationsResponse | Notification[]>(response.data);
    if (Array.isArray(data)) {
      return {
        data,
        total: data.length,
        page: params?.page || 1,
        limit: params?.limit || 20,
      };
    }
    return data;
  }

  // POST /notifications (Admin only)
  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    const response = await apiClient.post<any>('/notifications', data);
    return unwrapResponse<Notification>(response.data);
  }

  // PATCH /notifications/:id (Admin only)
  async updateNotification(id: string, data: Partial<{ status: NotificationStatus; title: string; body: string; data: Record<string, unknown>; priority: string }>): Promise<Notification> {
    const response = await apiClient.patch<any>(`/notifications/${id}`, data);
    return unwrapResponse<Notification>(response.data);
  }

  // DELETE /notifications/:id (Admin only)
  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  }

  // POST /notifications/broadcast (Admin only)
  async broadcastNotification(data: BroadcastNotificationDto): Promise<BroadcastResult> {
    const response = await apiClient.post<any>('/notifications/broadcast', data);
    return unwrapResponse<BroadcastResult>(response.data);
  }

  // GET /notifications/broadcast/history (Admin only)
  async getBroadcastHistory(page = 1, limit = 20): Promise<BroadcastHistoryResponse> {
    const response = await apiClient.get<any>('/notifications/broadcast/history', {
      params: { page, limit },
    });
    return unwrapResponse<BroadcastHistoryResponse>(response.data);
  }
}

export const notificationService = new NotificationService();
