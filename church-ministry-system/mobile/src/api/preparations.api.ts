import apiClient from './client';

export const preparationsApi = {
  getAll: (params?: any) => apiClient.get('/preparations', { params }),
  getOne: (id: string) => apiClient.get(`/preparations/${id}`),
  review: (id: string, data: { status: string; reviewNotes?: string }) =>
    apiClient.patch(`/preparations/${id}/review`, data),
  getComments: (id: string) => apiClient.get(`/preparations/${id}/comments`),
  addComment: (id: string, body: string) =>
    apiClient.post(`/preparations/${id}/comments`, { body }),
};
