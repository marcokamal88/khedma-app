import apiClient from './client';

export const churchApi = {
  getMyClass: () => apiClient.get('/servant-assignments/my-class'),
  getClassStudents: (classId: string) => apiClient.get(`/classes/${classId}/students`),
  getServiceStructure: (serviceId: string) => apiClient.get(`/services/${serviceId}/structure`),
  enrollMember: (data: {
    churchMemberId: string;
    serviceId: string;
    classId: string;
    serviceYearId: string;
  }) => apiClient.post('/enrollments', data),
  assignServant: (data: {
    churchMemberId: string;
    serviceId: string;
    classId: string;
    leaderRole?: string;
  }) => apiClient.post('/servant-assignments', data),
  searchMembers: (q: string) => apiClient.get('/members/search', { params: { q } }),
  registerMember: (data: {
    fullName: string;
    email?: string;
    phone?: string;
    password: string;
    serviceId?: string;
    classId?: string;
    serviceYearId?: string;
    address?: string;
    birthDate?: string;
    notes?: string;
  }) => apiClient.post('/members/register', data),
};
