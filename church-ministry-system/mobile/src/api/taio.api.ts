import { apiClient } from './client';

export const taioApi = {
  getBalance: (serviceYearId?: string) =>
    apiClient.get('/taio/balance', { params: { serviceYearId } }),
  getMemberBalance: (memberId: string, serviceYearId?: string) =>
    apiClient.get(`/taio/balance/${memberId}`, { params: { serviceYearId } }),
  getTransactions: (serviceYearId?: string) =>
    apiClient.get('/taio/transactions', { params: { serviceYearId } }),
  awardPoints: (data: any) => apiClient.post('/taio/award', data),
  getLeaderboard: (params?: any) => apiClient.get('/taio/leaderboard', { params }),
  getStoreItems: () => apiClient.get('/store/items'),
  redeem: (data: any) => apiClient.post('/store/redeem', data),
  getMyRedemptions: () => apiClient.get('/store/redemptions'),
  fulfillRedemption: (id: string) => apiClient.patch(`/store/redemptions/${id}/fulfill`),
};
