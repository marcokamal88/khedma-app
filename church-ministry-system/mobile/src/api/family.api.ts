import apiClient from './client';

export const familyApi = {
  getMyChildren: () => apiClient.get('/my-children'),
  getMyFamily: () => apiClient.get('/families/my'),
};
