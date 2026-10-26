import { apiClient } from './client';
import type {
  EcartItem,
  EcartsListResponse,
  RectificationInput,
} from '../types';

export interface EcartsSearchParams {
  bureau?: string | number;
  province?: string | number;
  periode?: number;
  date_min?: string;
  date_max?: string;
  statut?: 'non_rectifie' | 'rectifie' | 'tous';
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

/**
 * Récupération de la liste des écarts d'audit (Vue DIF)
 * GET /api/v1/audit/ecarts/
 */
export async function getEcarts(params?: EcartsSearchParams): Promise<EcartsListResponse> {
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
    requiresAuth: true,
  });
}

/**
 * Rectification d'un mouvement d'audit par un Inspecteur ou Administrateur (UC-04)
 * PATCH /api/v1/mouvements/{id}/rectifier/
 */
export async function rectifierMouvement(
  mouvementId: number,
  data: RectificationInput
): Promise<EcartItem> {
  return apiClient<EcartItem>(`/api/v1/mouvements/${mouvementId}/rectifier/`, {
    method: 'PATCH',
    data,
    requiresAuth: true,
  });
}
