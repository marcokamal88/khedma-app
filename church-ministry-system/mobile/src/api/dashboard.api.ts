import apiClient from './client';

export const dashboardApi = {
  servantStats: () => apiClient.get('/dashboard/servant/stats'),
  servantToday: () => apiClient.get('/dashboard/servant/today'),
  servantTasks: () => apiClient.get('/dashboard/servant/tasks'),
  serviceLeaderStats: () => apiClient.get('/dashboard/service-leader/stats'),
  sectorLeaderStats: () => apiClient.get('/dashboard/sector-leader/stats'),
  priestStats: () => apiClient.get('/dashboard/priest/stats'),
  memberStats: () => apiClient.get('/dashboard/member/stats'),
  memberTasks: () => apiClient.get('/dashboard/member/tasks'),
};
