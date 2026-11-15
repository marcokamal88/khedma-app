import apiClient from './client';

export const preparationsApi = {
  getAll: (params?: any) => apiClient.get('/preparations', { params }),
  getOne: (id: string) => apiClient.get(`/preparations/${id}`),
  create: (data: any) => apiClient.post('/preparations', data),
  submit: (id: string) => apiClient.post(`/preparations/${id}/submit`),
  review: (id: string, data: { status: string; reviewNotes?: string }) =>
    apiClient.patch(`/preparations/${id}/review`, data),
  getComments: (id: string) => apiClient.get(`/preparations/${id}/comments`),
  addComment: (id: string, body: string) =>
    apiClient.post(`/preparations/${id}/comments`, { body }),
  uploadFile: (id: string, uri: string, name: string, mimeType: string) => {
    const formData: any = new FormData();
    formData.append('file', { uri, name, type: mimeType } as any);
    return apiClient.post(`/preparations/${id}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFiles: (id: string) => apiClient.get(`/preparations/${id}/files`),
};
