import apiClient from './client';

export const achievementsApi = {
  getAll: () => apiClient.get('/achievements'),
  getMine: () => apiClient.get('/achievements/mine'),
  checkAndAward: () => apiClient.post('/achievements/check'),
};
