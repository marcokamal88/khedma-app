import apiClient from './client';

export const attendanceApi = {
  createSession: (data: any) => apiClient.post('/attendance/sessions', data),
  getSessions: (params?: any) => apiClient.get('/attendance/sessions', { params }),
  getSession: (id: string) => apiClient.get(`/attendance/sessions/${id}`),
  recordAttendance: (sessionId: string, records: any[]) =>
    apiClient.post(`/attendance/sessions/${sessionId}/records`, { records }),
  updateRecord: (id: string, data: any) => apiClient.put(`/attendance/records/${id}`, data),
  deleteSession: (id: string) => apiClient.delete(`/attendance/sessions/${id}`),
  getReport: (params?: any) => apiClient.get('/attendance/report', { params }),
  exportClassAttendance: (params?: any) =>
    apiClient.get('/reports/servant-class-attendance/excel', { params, responseType: 'blob' }),
};
