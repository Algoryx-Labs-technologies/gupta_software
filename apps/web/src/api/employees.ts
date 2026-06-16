import api from './axios';
import type {
  AssignEmployeeInput,
  ChangeEmployeeTenderInput,
  CreateEmployeeInput,
  EmployeePopulated,
  PaginatedResponse,
  TenderSalaryExpenseSummary,
  UnassignEmployeeInput,
  UpdateEmployeeDaysInput,
  UpdateEmployeeInput,
} from '@gupta/shared';

export const employeesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<EmployeePopulated>>('/employees', { params }).then((r) => r.data),
  get: (id: string) => api.get<EmployeePopulated>(`/employees/${id}`).then((r) => r.data),
  create: (data: CreateEmployeeInput) =>
    api.post<EmployeePopulated>('/employees', data).then((r) => r.data),
  update: (id: string, data: UpdateEmployeeInput) =>
    api.patch<EmployeePopulated>(`/employees/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/employees/${id}`).then((r) => r.data),
  assign: (id: string, data: AssignEmployeeInput) =>
    api.post<EmployeePopulated>(`/employees/${id}/assign`, data).then((r) => r.data),
  changeTender: (id: string, data: ChangeEmployeeTenderInput) =>
    api.post<EmployeePopulated>(`/employees/${id}/change-tender`, data).then((r) => r.data),
  unassign: (id: string, data?: UnassignEmployeeInput) =>
    api.post<EmployeePopulated>(`/employees/${id}/unassign`, data ?? {}).then((r) => r.data),
  updateDays: (id: string, data: UpdateEmployeeDaysInput) =>
    api.patch<EmployeePopulated>(`/employees/${id}/days`, data).then((r) => r.data),
  tenderExpenses: (params?: { tender?: string }) =>
    api
      .get<TenderSalaryExpenseSummary[] | TenderSalaryExpenseSummary | null>(
        '/employees/tender-expenses',
        { params },
      )
      .then((r) => r.data),
};
