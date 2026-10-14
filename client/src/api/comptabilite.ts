import { apiClient } from './client';
import type {
  LigneComptable,
  LigneComptableSearchParams,
  PaginatedResponse,
  SectionComptable,
} from '../types';

/**
 * Récupère la liste des sections comptables (A à E).
 */
export const getSectionsComptables = async (): Promise<PaginatedResponse<SectionComptable>> => {
  return apiClient<PaginatedResponse<SectionComptable>>('/api/v1/sections-comptables/', {
    method: 'GET',
    requiresAuth: true,
  });
};

/**
 * Recherche et filtre dans le plan comptable.
 * Remplace le TreeView legacy par une recherche instantanée et groupée par section.
 */
export const getLignesComptables = async (
  params?: LigneComptableSearchParams
): Promise<PaginatedResponse<LigneComptable>> => {
  const query = new URLSearchParams();

  if (params?.search) query.append('search', params.search);
  if (params?.section !== undefined && params.section !== '') {
    query.append('section', params.section.toString());
  }
  if (params?.sens !== undefined) query.append('sens', params.sens.toString());
  if (params?.parent !== undefined) {
    query.append('parent', params.parent === null ? 'null' : params.parent.toString());
  }
  if (params?.feuille !== undefined) query.append('feuille', params.feuille.toString());
  if (params?.actif !== undefined) query.append('actif', params.actif.toString());
  if (params?.page) query.append('page', params.page.toString());

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiClient<PaginatedResponse<LigneComptable>>(`/api/v1/lignes-comptables/${queryString}`, {
    method: 'GET',
    requiresAuth: true,
  });
};
