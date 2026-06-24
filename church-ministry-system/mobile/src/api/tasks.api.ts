import apiClient from './client';

export const tasksApi = {
  create: (data: any) => apiClient.post('/tasks', data),
  getAll: (params?: any) => apiClient.get('/tasks', { params }),
  getOne: (id: string) => apiClient.get(`/tasks/${id}`),
  update: (id: string, data: any) => apiClient.patch(`/tasks/${id}`, data),
  delete: (id: string) => apiClient.delete(`/tasks/${id}`),
  assign: (id: string, memberIds: string[]) =>
    apiClient.post(`/tasks/${id}/assign`, { memberIds }),
  getMyTasks: () => apiClient.get('/my-tasks'),
  complete: (id: string) => apiClient.post(`/tasks/${id}/complete`),
  verify: (taskId: string, memberId: string) =>
    apiClient.post(`/tasks/${taskId}/verify/${memberId}`),
};
