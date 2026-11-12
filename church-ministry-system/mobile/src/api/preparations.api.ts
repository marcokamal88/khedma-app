import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './client';

export const preparationsApi = {
  getAll: (params?: any) => apiClient.get('/preparations', { params }),
  getOne: (id: string) => apiClient.get(`/preparations/${id}`),
  create: (data: any) => apiClient.post('/preparations', data),
  update: (id: string, data: any) => apiClient.patch(`/preparations/${id}`, data),
  deletePrep: (id: string) => apiClient.delete(`/preparations/${id}`),
  submit: (id: string) => apiClient.post(`/preparations/${id}/submit`),
  review: (id: string, data: { status: string; reviewNotes?: string }) =>
    apiClient.patch(`/preparations/${id}/review`, data),
  getComments: (id: string) => apiClient.get(`/preparations/${id}/comments`),
  addComment: (id: string, body: string) =>
    apiClient.post(`/preparations/${id}/comments`, { body }),
  uploadFile: async (id: string, fileUri: string, fileName: string, mimeType?: string) => {
    if (Platform.OS !== 'web') {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const churchId = (await AsyncStorage.getItem('church_id')) || '1';

        const uploadUrl = `${apiClient.defaults.baseURL}/preparations/${id}/files`;
        const res = await FileSystem.uploadAsync(uploadUrl, fileUri, {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'X-Church-ID': churchId,
          },
        });

        if (res.status >= 200 && res.status < 300) {
          try {
            return JSON.parse(res.body);
          } catch {
            return res.body;
          }
        } else {
          throw new Error(res.body || 'Failed to upload file');
        }
      } catch (err: any) {
        if (err?.message && !err.message.includes('not supported')) {
          // only fallback if uploadAsync is not supported or failed
        }
      }
    }

    // Web or fallback
    const cleanUri = Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri;
    const formData: any = new FormData();
    formData.append('file', {
      uri: cleanUri,
      name: fileName || 'file',
      type: mimeType || 'application/octet-stream',
    } as any);
    return apiClient.post(`/preparations/${id}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: (data) => data,
    });
  },
  getFiles: (id: string) => apiClient.get(`/preparations/${id}/files`),
  deleteFile: (id: string, fileId: string) => apiClient.delete(`/preparations/${id}/files/${fileId}`),
};
