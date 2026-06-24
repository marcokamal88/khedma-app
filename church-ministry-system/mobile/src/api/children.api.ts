import apiClient from './client';

export const childrenApi = {
  getAttendance: (childId: string) => apiClient.get(`/attendance/${childId}`),
  getTaioBalance: (childId: string) => apiClient.get(`/taio/balance/${childId}`),
  getTasks: (childId: string) => apiClient.get(`/tasks?assignedTo=${childId}`),
  getPreparations: (childId: string) => apiClient.get(`/preparations?memberId=${childId}`),
};
