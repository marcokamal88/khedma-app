import apiClient from './client';

export const dashboardApi = {
  servantStats: () => apiClient.get('/dashboard/servant/stats'),
  servantToday: () => apiClient.get('/dashboard/servant/today'),
  servantTasks: () => apiClient.get('/dashboard/servant/tasks'),
  memberStats: () => apiClient.get('/dashboard/member/stats'),
  memberTasks: () => apiClient.get('/dashboard/member/tasks'),
};
