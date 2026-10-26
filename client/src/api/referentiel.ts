import { apiClient } from './client';
import type {
  Bureau,
  BureauFormData,
  PaginatedResponse,
  Province,
  PeriodeGestion,
  PeriodeGestionFormData,
} from '../types';

export const getProvinces = async (): Promise<PaginatedResponse<Province>> => {
  return apiClient<PaginatedResponse<Province>>('/api/v1/provinces/', {
    method: 'GET',
    requiresAuth: false,
  });
};

export const getBureaux = async (params?: {
  search?: string;
  page?: number;
}): Promise<PaginatedResponse<Bureau>> => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.page) query.append('page', params.page.toString());

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiClient<PaginatedResponse<Bureau>>(`/api/v1/bureaux/${queryString}`, {
    method: 'GET',
    requiresAuth: false,
  });
};

export const getBureau = async (id: number): Promise<Bureau> => {
  return apiClient<Bureau>(`/api/v1/bureaux/${id}/`, {
    method: 'GET',
    requiresAuth: false,
  });
};

export const createBureau = async (data: BureauFormData): Promise<Bureau> => {
  return apiClient<Bureau>('/api/v1/bureaux/', {
    method: 'POST',
    data,
    requiresAuth: false,
  });
};

export const updateBureau = async (id: number, data: Partial<BureauFormData>): Promise<Bureau> => {
  return apiClient<Bureau>(`/api/v1/bureaux/${id}/`, {
    method: 'PATCH',
    data,
    requiresAuth: false,
  });
};

export const deleteBureau = async (id: number): Promise<void> => {
  return apiClient<void>(`/api/v1/bureaux/${id}/`, {
    method: 'DELETE',
    requiresAuth: false,
  });
};

export const getPeriodesGestion = async (params?: {
  bureau?: number;
  cloturee?: boolean;
  search?: string;
  page?: number;
}): Promise<PaginatedResponse<PeriodeGestion>> => {
  const query = new URLSearchParams();
  if (params?.bureau !== undefined) query.append('bureau', params.bureau.toString());
  if (params?.cloturee !== undefined) query.append('cloturee', params.cloturee.toString());
  if (params?.search) query.append('search', params.search);
  if (params?.page) query.append('page', params.page.toString());

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiClient<PaginatedResponse<PeriodeGestion>>(`/api/v1/periodes-gestion/${queryString}`, {
    method: 'GET',
    requiresAuth: false,
  });
};

export const createPeriodeGestion = async (
  data: PeriodeGestionFormData
): Promise<PeriodeGestion> => {
  return apiClient<PeriodeGestion>('/api/v1/periodes-gestion/', {
    method: 'POST',
    data,
    requiresAuth: false,
  });
};

export const cloturerPeriodeGestion = async (id: number, data?: { date_fin?: string }): Promise<PeriodeGestion> => {
  return apiClient<PeriodeGestion>(`/api/v1/periodes-gestion/${id}/cloturer/`, {
    method: 'POST',
    data,
    requiresAuth: false,
  });
};

