/**
 * Appels API et hooks TanStack Query pour les tableaux de bord (Module 6).
 * Conforme à ARCHITECTURE.md (§ 4 : toute la logique réseau passe par src/api/).
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import type {
  ReceveurDashboardData,
  InspecteurDashboardData,
  AdminDashboardData,
  EcartsListResponse,
} from '../types';

// ============================================================================
// Fonctions API REST
// ============================================================================

export async function getReceveurDashboard(params?: {
  bureau?: number;
  periode?: number;
}): Promise<ReceveurDashboardData> {
  const query = new URLSearchParams();
  if (params?.bureau !== undefined) query.append('bureau', params.bureau.toString());
  if (params?.periode !== undefined) query.append('periode', params.periode.toString());

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiClient<ReceveurDashboardData>(`/api/v1/dashboard/receveur/${qs}`, {
    method: 'GET',
  });
}

export async function getInspecteurDashboard(params?: {
  bureau?: string | number;
  province?: string | number;
  date_min?: string;
  date_max?: string;
  statut?: string;
  search?: string;
}): Promise<InspecteurDashboardData> {
  const query = new URLSearchParams();
  if (params?.bureau) query.append('bureau', params.bureau.toString());
  if (params?.province) query.append('province', params.province.toString());
  if (params?.date_min) query.append('date_min', params.date_min);
  if (params?.date_max) query.append('date_max', params.date_max);
  if (params?.statut) query.append('statut', params.statut);
  if (params?.search) query.append('search', params.search);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiClient<InspecteurDashboardData>(`/api/v1/dashboard/inspecteur/${qs}`, {
    method: 'GET',
  });
}

export async function getEcartsList(params?: {
  bureau?: string | number;
  province?: string | number;
  periode?: number;
  date_min?: string;
  date_max?: string;
  statut?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}): Promise<EcartsListResponse> {
  const query = new URLSearchParams();
  if (params?.bureau) query.append('bureau', params.bureau.toString());
  if (params?.province) query.append('province', params.province.toString());
  if (params?.periode) query.append('periode', params.periode.toString());
  if (params?.date_min) query.append('date_min', params.date_min);
  if (params?.date_max) query.append('date_max', params.date_max);
  if (params?.statut) query.append('statut', params.statut);
  if (params?.search) query.append('search', params.search);
  if (params?.ordering) query.append('ordering', params.ordering);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.page_size) query.append('page_size', params.page_size.toString());

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiClient<EcartsListResponse>(`/api/v1/audit/ecarts/${qs}`, {
    method: 'GET',
  });
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return apiClient<AdminDashboardData>('/api/v1/dashboard/admin/', {
    method: 'GET',
  });
}

// ============================================================================
// Hooks TanStack Query
// ============================================================================

export function useReceveurDashboard(params?: { bureau?: number; periode?: number }) {
  return useQuery({
    queryKey: ['dashboard', 'receveur', params?.bureau, params?.periode],
    queryFn: () => getReceveurDashboard(params),
    staleTime: 30_000,
  });
}

export function useInspecteurDashboard(params?: {
  bureau?: string | number;
  province?: string | number;
  date_min?: string;
  date_max?: string;
  statut?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: [
      'dashboard',
      'inspecteur',
      params?.bureau,
      params?.province,
      params?.date_min,
      params?.date_max,
      params?.statut,
      params?.search,
    ],
    queryFn: () => getInspecteurDashboard(params),
    staleTime: 30_000,
  });
}

export function useEcartsList(params?: {
  bureau?: string | number;
  province?: string | number;
  periode?: number;
  date_min?: string;
  date_max?: string;
  statut?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery({
    queryKey: ['audit', 'ecarts', params],
    queryFn: () => getEcartsList(params),
    staleTime: 15_000,
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => getAdminDashboard(),
    staleTime: 60_000,
  });
}
