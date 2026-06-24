import apiClient from './client';

export const followUpsApi = {
  getAll: (params?: { servantId?: string }) =>
    apiClient.get('/follow-ups', { params }),
  getOne: (id: string) =>
    apiClient.get(`/follow-ups/${id}`),
  create: (data: any) =>
    apiClient.post('/follow-ups', data),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/follow-ups/${id}/status`, { status }),
  delete: (id: string) =>
    apiClient.delete(`/follow-ups/${id}`),
  addActivity: (id: string, data: any) =>
    apiClient.post(`/follow-ups/${id}/activities`, data),
  getActivities: (id: string) =>
    apiClient.get(`/follow-ups/${id}/activities`),
};
