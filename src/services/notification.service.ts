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

export interface SendNotificationDto {
  userId: string;
  type: 'PUSH' | 'SMS' | 'IN_APP' | 'EMAIL';
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

class NotificationService {
  // GET /notifications/me
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    type?: string;
    read?: boolean;
  }): Promise<NotificationsResponse> {
    const response = await apiClient.get<NotificationsResponse>(
      '/notifications/me',
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
}

export const notificationService = new NotificationService();
