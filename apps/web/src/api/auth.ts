import api from './axios';
import type { AuthUser, LoginResponse, User, PaginatedResponse } from '@gupta/shared';
import type { CreateUserInput, UpdateUserInput } from '@gupta/shared';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),
  adminLogin: (id: string, password: string) =>
    api.post<LoginResponse>('/auth/admin/login', { id, password }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
};

export const usersApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<User>>('/users', { params }).then((r) => r.data),
  create: (data: CreateUserInput) => api.post<User>('/users', data).then((r) => r.data),
  update: (id: string, data: UpdateUserInput) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),
  updateStatus: (id: string, disabled: boolean) =>
    api.patch<User>(`/users/${id}/status`, { disabled }).then((r) => r.data),
  resetPassword: (id: string, password: string) =>
    api.post(`/users/${id}/reset-password`, { password }).then((r) => r.data),
};

export type { AuthUser };
