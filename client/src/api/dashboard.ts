import { apiClient } from './client';
import type {
  ReceveurDashboardData,
  InspecteurDashboardData,
  EcartsListResponse,
  AdminDashboardData,
} from '../types';

/**
 * Récupère les données du tableau de bord Receveur (progression mensuelle G58 et encaisse).
 */
export const getReceveurDashboard = async (params?: {
  bureau?: number | string;
  periode?: number | string;
}): Promise<ReceveurDashboardData> => {
  const query = new URLSearchParams();
  if (params?.bureau) query.append('bureau', params.bureau.toString());
  if (params?.periode) query.append('periode', params.periode.toString());

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiClient<ReceveurDashboardData>(`/api/v1/dashboard/receveur/${queryString}`, {
    method: 'GET',
    requiresAuth: true,
  });
};

/**
 * Récupère les données de synthèse du tableau de bord Inspecteur (KPIs et aperçu des écarts).
 */
export const getInspecteurDashboard = async (params?: {
  bureau?: number | string;
  province?: number | string;
  statut?: string;
  search?: string;
}): Promise<InspecteurDashboardData> => {
  const query = new URLSearchParams();
  if (params?.bureau) query.append('bureau', params.bureau.toString());
  if (params?.province) query.append('province', params.province.toString());
  if (params?.statut) query.append('statut', params.statut);
  if (params?.search) query.append('search', params.search);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiClient<InspecteurDashboardData>(`/api/v1/dashboard/inspecteur/${queryString}`, {
    method: 'GET',
    requiresAuth: true,
  });
};

/**
 * Récupère la liste paginée et filtrable des écarts d'audit (Vue DIF).
 */
export const getEcartsList = async (params?: {
  bureau?: number | string;
  province?: number | string;
  periode?: number | string;
  statut?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}): Promise<EcartsListResponse> => {
  const query = new URLSearchParams();
  if (params?.bureau) query.append('bureau', params.bureau.toString());
  if (params?.province) query.append('province', params.province.toString());
  if (params?.periode) query.append('periode', params.periode.toString());
  if (params?.statut) query.append('statut', params.statut);
  if (params?.search) query.append('search', params.search);
  if (params?.ordering) query.append('ordering', params.ordering);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.page_size) query.append('page_size', params.page_size.toString());

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiClient<EcartsListResponse>(`/api/v1/audit/ecarts/${queryString}`, {
    method: 'GET',
    requiresAuth: true,
  });
};

/**
 * Récupère la vue d'ensemble globale du système pour le tableau de bord Admin.
 */
export const getAdminDashboard = async (): Promise<AdminDashboardData> => {
  return apiClient<AdminDashboardData>('/api/v1/dashboard/admin/', {
    method: 'GET',
    requiresAuth: true,
  });
};
