import apiClient from './client';

export const followUpsApi = {
  getAll: (params?: { servantId?: string; serviceId?: string; classId?: string; status?: string; targetType?: string }) =>
    apiClient.get('/follow-ups', { params }),
  getOne: (id: string) =>
    apiClient.get(`/follow-ups/${id}`),
  create: (data: { classId?: number; targetType?: string; memberIds?: number[]; name?: string; notes?: string; serviceId?: number; servantId?: number; servedMemberId?: number }) =>
    apiClient.post('/follow-ups', data),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/follow-ups/${id}/status`, { status }),
  update: (id: string, data: { name?: string; notes?: string }) =>
    apiClient.patch(`/follow-ups/${id}`, data),
  delete: (id: string) =>
    apiClient.delete(`/follow-ups/${id}`),
  addMembers: (id: string, memberIds: number[]) =>
    apiClient.post(`/follow-ups/${id}/members`, { memberIds }),
  removeMember: (id: string, memberId: string) =>
    apiClient.delete(`/follow-ups/${id}/members/${memberId}`),
  addActivity: (id: string, data: { targetMemberId: number; logType: string; notes: string; nextAction?: string; nextActionDate?: string; loggedAt?: string }) =>
    apiClient.post(`/follow-ups/${id}/activities`, data),
  getActivities: (id: string) =>
    apiClient.get(`/follow-ups/${id}/activities`),
  monitoring: (id: string) =>
    apiClient.get(`/follow-ups/${id}/monitoring`),
  weekly: (params?: { week?: string }) =>
    apiClient.get('/follow-ups/weekly', { params }),
  attention: (params?: { serviceId?: string; classId?: string; weeks?: number }) =>
    apiClient.get('/follow-ups/attention', { params }),  reportsServant: (params?: { servantId?: string; week?: string }) =>
    apiClient.get('/reports/follow-ups/servant', { params }),
  reportsClass: (params: { classId: string; week?: string }) =>
    apiClient.get('/reports/follow-ups/class', { params }),
  reportsService: (params?: { serviceId?: string; week?: string }) =>
    apiClient.get('/reports/follow-ups/service', { params }),
};
