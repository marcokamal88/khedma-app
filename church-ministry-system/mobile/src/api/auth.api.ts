import apiClient from './client';

export const authApi = {
  login: (data: { email?: string; phone?: string; password: string }) => {
    console.log(`[AUTH API] login() called | identifier: ${data.email || data.phone}`);
    return apiClient.post('/auth/login', data)
      .then((res: any) => {
        console.log(`[AUTH API] login() response received`);
        return res;
      });
  },

  signup: (data: { fullName: string; email?: string; phone?: string; password: string }) => {
    console.log(`[AUTH API] signup() called | fullName: ${data.fullName}`);
    return apiClient.post('/auth/signup', data)
      .then((res: any) => {
        console.log(`[AUTH API] signup() response received`);
        return res;
      });
  },

  getContexts: () => {
    console.log(`[AUTH API] getContexts() called`);
    return apiClient.get('/auth/contexts');
  },

  switchContext: (data: { role: string; serviceId?: string }) => {
    console.log(`[AUTH API] switchContext() called | role: ${data.role}`);
    return apiClient.post('/auth/switch-context', data);
  },
};

export const membersApi = {
  getMe: () => apiClient.get('/members/me'),
  updateMe: (data: any) => apiClient.patch('/members/me', data),
  getAll: () => apiClient.get('/members'),
  create: (data: any) => apiClient.post('/members', data),
};
