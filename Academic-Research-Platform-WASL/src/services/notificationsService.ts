import api from './api';

export const getNotifications = () =>
  api.get('/api/notifications');

export const markNotificationRead = (id: string) =>
  api.put(`/api/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  api.put('/api/notifications/read-all');

export const deleteNotification = (id: string) =>
  api.delete(`/api/notifications/${id}`);
