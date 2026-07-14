import apiClient from './client';

export const servantAssignmentsApi = {
  getAll: (serviceId: string) => apiClient.get('/servant-assignments', { params: { serviceId } }),
  update: (id: string, data: { classId?: string; leaderRole?: string }) =>
    apiClient.patch(`/servant-assignments/${id}`, data),
  remove: (id: string) => apiClient.delete(`/servant-assignments/${id}`),
  create: (data: { churchMemberId: string; serviceId: string; classId: string; leaderRole?: string }) =>
    apiClient.post('/servant-assignments', data),
};
