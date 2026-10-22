import { apiClient } from './client';
import type {
  LigneComptable,
  LigneComptableFormData,
  LigneComptableSearchParams,
  PaginatedResponse,
  SectionComptable,
  SectionComptableFormData,
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
 * Création d'une nouvelle section macro-comptable (réservé ADMIN)
 */
export const createSectionComptable = async (
  data: SectionComptableFormData
): Promise<SectionComptable> => {
  return apiClient<SectionComptable>('/api/v1/sections-comptables/', {
    method: 'POST',
    data,
    requiresAuth: true,
  });
};

/**
 * Modification d'une section macro-comptable existante (réservé ADMIN)
 */
export const updateSectionComptable = async (
  id: number,
  data: Partial<SectionComptableFormData>
): Promise<SectionComptable> => {
  return apiClient<SectionComptable>(`/api/v1/sections-comptables/${id}/`, {
    method: 'PATCH',
    data,
    requiresAuth: true,
  });
};

/**
 * Suppression d'une section macro-comptable (réservé ADMIN)
 */
export const deleteSectionComptable = async (id: number): Promise<void> => {
  return apiClient<void>(`/api/v1/sections-comptables/${id}/`, {
    method: 'DELETE',
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

/**
 * Création d'une rubrique / sous-compte dans le plan comptable (réservé ADMIN)
 */
export const createLigneComptable = async (
  data: LigneComptableFormData
): Promise<LigneComptable> => {
  return apiClient<LigneComptable>('/api/v1/lignes-comptables/', {
    method: 'POST',
    data,
    requiresAuth: true,
  });
};

/**
 * Modification d'une rubrique / ligne du plan comptable (réservé ADMIN)
 */
export const updateLigneComptable = async (
  id: number,
  data: Partial<LigneComptableFormData>
): Promise<LigneComptable> => {
  return apiClient<LigneComptable>(`/api/v1/lignes-comptables/${id}/`, {
    method: 'PATCH',
    data,
    requiresAuth: true,
  });
};

/**
 * Suppression d'une ligne du plan comptable (réservé ADMIN)
 */
export const deleteLigneComptable = async (id: number): Promise<void> => {
  return apiClient<void>(`/api/v1/lignes-comptables/${id}/`, {
    method: 'DELETE',
    requiresAuth: true,
  });
};

/**
 * Récupère la liste des mouvements du Journal G58
 */
export const getMouvements = async (
  params?: import('../types').MouvementSearchParams
): Promise<PaginatedResponse<import('../types').MouvementG58>> => {
  const query = new URLSearchParams();

  if (params?.periode_gestion) query.append('periode_gestion', params.periode_gestion.toString());
  if (params?.periode) query.append('periode', params.periode.toString());
  if (params?.bureau) query.append('bureau', params.bureau.toString());
  if (params?.date_operation) query.append('date_operation', params.date_operation);
  if (params?.date) query.append('date', params.date);
  if (params?.section !== undefined) query.append('section', params.section.toString());
  if (params?.sens !== undefined) query.append('sens', params.sens.toString());
  if (params?.compte) query.append('compte', params.compte);
  if (params?.page) query.append('page', params.page.toString());

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiClient<PaginatedResponse<import('../types').MouvementG58>>(`/api/v1/mouvements/${queryString}`, {
    method: 'GET',
    requiresAuth: true,
  });
};

/**
 * Saisie d'une écriture comptable dans le Journal G58
 */
export const createMouvement = async (
  data: import('../types').MouvementG58FormData
): Promise<import('../types').MouvementG58> => {
  return apiClient<import('../types').MouvementG58>('/api/v1/mouvements/', {
    method: 'POST',
    data,
    requiresAuth: true,
  });
};

/**
 * Modification d'une écriture comptable avant audit
 */
export const updateMouvement = async (
  id: number,
  data: Partial<import('../types').MouvementG58FormData>
): Promise<import('../types').MouvementG58> => {
  return apiClient<import('../types').MouvementG58>(`/api/v1/mouvements/${id}/`, {
    method: 'PATCH',
    data,
    requiresAuth: true,
  });
};

/**
 * Suppression d'une écriture comptable
 */
export const deleteMouvement = async (id: number): Promise<void> => {
  return apiClient<void>(`/api/v1/mouvements/${id}/`, {
    method: 'DELETE',
    requiresAuth: true,
  });
};

/**
 * Récupération des totaux consolidés G58
 */
export const getTotauxG58 = async (params: {
  periode: number;
  date?: string;
}): Promise<import('../types').TotauxG58> => {
  const query = new URLSearchParams();
  query.append('periode', params.periode.toString());
  if (params.date) query.append('date', params.date);

  return apiClient<import('../types').TotauxG58>(`/api/v1/mouvements/totaux/?${query.toString()}`, {
    method: 'GET',
    requiresAuth: true,
  });
};

/**
 * Référentiel des rubriques d'encaisse et de coffre
 */
export const getRubriquesEncaisse = async (): Promise<
  import('../types').PaginatedResponse<import('../types').RubriqueEncaisse>
> => {
  return apiClient<import('../types').PaginatedResponse<import('../types').RubriqueEncaisse>>(
    '/api/v1/rubriques-encaisse/',
    {
      method: 'GET',
      requiresAuth: true,
    }
  );
};

/**
 * Liste des flux de caisse et de coffre (MouvementEncaisse)
 */
export const getMouvementsEncaisse = async (
  params: import('../types').MouvementEncaisseSearchParams = {}
): Promise<import('../types').PaginatedResponse<import('../types').MouvementEncaisse>> => {
  const query = new URLSearchParams();
  if (params.periode_gestion) query.append('periode_gestion', params.periode_gestion.toString());
  if (params.periode) query.append('periode', params.periode.toString());
  if (params.bureau) query.append('bureau', params.bureau.toString());
  if (params.date_operation) query.append('date_operation', params.date_operation);
  if (params.date) query.append('date', params.date);
  if (params.sens) query.append('sens', params.sens.toString());
  if (params.rubrique_encaisse) query.append('rubrique_encaisse', params.rubrique_encaisse.toString());
  if (params.compte) query.append('compte', params.compte);
  if (params.page) query.append('page', params.page.toString());

  const qs = query.toString();
  return apiClient<import('../types').PaginatedResponse<import('../types').MouvementEncaisse>>(
    `/api/v1/mouvements-encaisse/${qs ? `?${qs}` : ''}`,
    {
      method: 'GET',
      requiresAuth: true,
    }
  );
};

/**
 * Création d'un flux d'encaisse
 */
export const createMouvementEncaisse = async (
  data: import('../types').MouvementEncaisseFormData
): Promise<import('../types').MouvementEncaisse> => {
  return apiClient<import('../types').MouvementEncaisse>('/api/v1/mouvements-encaisse/', {
    method: 'POST',
    data,
    requiresAuth: true,
  });
};

/**
 * Modification d'un flux d'encaisse
 */
export const updateMouvementEncaisse = async (
  id: number,
  data: Partial<import('../types').MouvementEncaisseFormData>
): Promise<import('../types').MouvementEncaisse> => {
  return apiClient<import('../types').MouvementEncaisse>(`/api/v1/mouvements-encaisse/${id}/`, {
    method: 'PATCH',
    data,
    requiresAuth: true,
  });
};

/**
 * Suppression d'un flux d'encaisse
 */
export const deleteMouvementEncaisse = async (id: number): Promise<void> => {
  return apiClient<void>(`/api/v1/mouvements-encaisse/${id}/`, {
    method: 'DELETE',
    requiresAuth: true,
  });
};

/**
 * Calcul et consultation de la Situation Comptable officielle avec report de solde automatique
 */
export const getSituationComptable = async (
  periodeId: number
): Promise<import('../types').SituationComptable> => {
  return apiClient<import('../types').SituationComptable>(
    `/api/v1/situation-comptable/${periodeId}/`,
    {
      method: 'GET',
      requiresAuth: true,
    }
  );
};


