import apiClient from './client';

export const activitiesApi = {
  getAll: (params?: { type?: string }) => apiClient.get('/activities', { params }),
  getOne: (id: string) => apiClient.get(`/activities/${id}`),
  create: (data: any) => apiClient.post('/activities', data),
  enroll: (id: string, memberId: string) => apiClient.post(`/activities/${id}/enroll`, { memberId }),
  unenroll: (id: string, memberId: string) => apiClient.delete(`/activities/${id}/unenroll`, { data: { memberId } }),
  recordAttendance: (id: string, records: any[]) => apiClient.post(`/activities/${id}/attendance`, { records }),
  getAttendance: (id: string, params?: { sessionDate?: string }) => apiClient.get(`/activities/${id}/attendance`, { params }),
};
