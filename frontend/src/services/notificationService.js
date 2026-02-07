import { apiClient } from '@/lib/api/client';

class NotificationService {
  /**
   * Get all notifications for the current user.
   */
  async getNotifications() {
    const response = await apiClient.get('/notifications/');
    return response.data?.results || response.data || response.results || [];
  }

  /**
   * Get unread count.
   */
  async getUnreadCount() {
    const notifications = await this.getNotifications();
    const list = Array.isArray(notifications) ? notifications : [];
    return list.filter(n => !n.is_read).length;
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId) {
    return apiClient.post(`/notifications/${notificationId}/read/`);
  }

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead() {
    return apiClient.post('/notifications/read-all/');
  }
}

export const notificationService = new NotificationService();
