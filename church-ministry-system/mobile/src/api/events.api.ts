import apiClient from './client';

export const eventsApi = {
  getAll: (params?: any) => apiClient.get('/events', { params }),
  getOne: (id: string) => apiClient.get(`/events/${id}`),
  create: (data: any) => apiClient.post('/events', data),
  register: (eventId: string) => apiClient.post(`/events/${eventId}/register`),
  cancelRegistration: (eventId: string) => apiClient.delete(`/events/${eventId}/register`),
  getRegistrations: (eventId: string) => apiClient.get(`/events/${eventId}/registrations`),
  addPayment: (registrationId: string, data: any) =>
    apiClient.post(`/events/0/registrations/${registrationId}/payments`, data),
  getPaymentSummary: (eventId: string) => apiClient.get(`/events/${eventId}/payments/summary`),
};
