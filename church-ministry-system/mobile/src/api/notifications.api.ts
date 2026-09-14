import apiClient from './client';

/**
 * Inbox API — mirrors backend NotificationsController.
 * Push registration (device tokens) lands in Phase B; these endpoints
 * already exist and back the in-app inbox + unread badge.
 */
export const notificationsApi = {
  getAll: () => apiClient.get('/notifications'),
  unreadCount: () => apiClient.get('/notifications/unread-count'),
  markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/read-all'),
};
