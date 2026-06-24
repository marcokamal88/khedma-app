import apiClient from './client';

export const lessonLibraryApi = {
  getAll: (params?: any) => apiClient.get('/lesson-library', { params }),
  getOne: (id: string) => apiClient.get(`/lesson-library/${id}`),
  create: (data: any) => apiClient.post('/lesson-library', data),
  delete: (id: string) => apiClient.delete(`/lesson-library/${id}`),
};
