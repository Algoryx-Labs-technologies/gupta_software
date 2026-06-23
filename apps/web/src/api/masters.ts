import api from './axios';
import type { Site, Vendor, Item, Category, PaginatedResponse } from '@gupta/shared';
import type {
  CreateSiteInput,
  UpdateSiteInput,
  CreateVendorInput,
  UpdateVendorInput,
  CreateItemInput,
  UpdateItemInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@gupta/shared';

export const sitesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Site>>('/sites', { params }).then((r) => r.data),
  search: (q: string) => api.get<Site[]>('/sites/search', { params: { q } }).then((r) => r.data),
  create: (data: CreateSiteInput) => api.post<Site>('/sites', data).then((r) => r.data),
  update: (id: string, data: UpdateSiteInput) =>
    api.patch<Site>(`/sites/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/sites/${id}`).then((r) => r.data),
};

export const vendorsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Vendor>>('/vendors', { params }).then((r) => r.data),
  search: (q: string) => api.get<Vendor[]>('/vendors/search', { params: { q } }).then((r) => r.data),
  create: (data: CreateVendorInput) => api.post<Vendor>('/vendors', data).then((r) => r.data),
  update: (id: string, data: UpdateVendorInput) =>
    api.patch<Vendor>(`/vendors/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/vendors/${id}`).then((r) => r.data),
};

export const itemsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Item>>('/items', { params }).then((r) => r.data),
  search: (q: string) => api.get<Item[]>('/items/search', { params: { q } }).then((r) => r.data),
  create: (data: CreateItemInput) => api.post<Item>('/items', data).then((r) => r.data),
  update: (id: string, data: UpdateItemInput) =>
    api.patch<Item>(`/items/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/items/${id}`).then((r) => r.data),
};

export const categoriesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Category>>('/categories', { params }).then((r) => r.data),
  search: (q: string) => api.get<Category[]>('/categories/search', { params: { q } }).then((r) => r.data),
  create: (data: CreateCategoryInput) => api.post<Category>('/categories', data).then((r) => r.data),
  update: (id: string, data: UpdateCategoryInput) =>
    api.patch<Category>(`/categories/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/categories/${id}`).then((r) => r.data),
};
