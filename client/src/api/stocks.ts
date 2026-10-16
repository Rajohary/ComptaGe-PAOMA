import { apiClient } from './client';
import type {
  ProduitPostal,
  StockValeur,
  StockValeurFormData,
  StockValeurRecapitulatif,
  StockValeurSearchParams,
  PaginatedResponse,
} from '../types';

/**
 * Récupère la liste paginée des produits postaux et timbres fiscaux
 */
export const getProduitsPostaux = async (params?: {
  categorie?: string;
  actif?: boolean;
}): Promise<PaginatedResponse<ProduitPostal>> => {
  const query = new URLSearchParams();
  if (params?.categorie) query.append('categorie', params.categorie);
  if (params?.actif !== undefined) query.append('actif', params.actif.toString());

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiClient<PaginatedResponse<ProduitPostal>>(`/api/v1/produits-postaux/${queryString}`, {
    method: 'GET',
    requiresAuth: true,
  });
};

/**
 * Récupère la liste des lignes de stocks valeurs (Tableau A G58)
 */
export const getStocksValeurs = async (
  params?: StockValeurSearchParams
): Promise<PaginatedResponse<StockValeur>> => {
  const query = new URLSearchParams();
  if (params?.bureau) query.append('bureau', params.bureau.toString());
  if (params?.periode_gestion) query.append('periode_gestion', params.periode_gestion.toString());
  if (params?.periode) query.append('periode', params.periode.toString());
  if (params?.produit) query.append('produit', params.produit.toString());
  if (params?.categorie) query.append('categorie', params.categorie);
  if (params?.page) query.append('page', params.page.toString());

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiClient<PaginatedResponse<StockValeur>>(`/api/v1/stocks-valeurs/${queryString}`, {
    method: 'GET',
    requiresAuth: true,
  });
};

/**
 * Crée ou met à jour une ligne de stock valeur
 */
export const createStockValeur = async (
  data: StockValeurFormData
): Promise<StockValeur> => {
  return apiClient<StockValeur>('/api/v1/stocks-valeurs/', {
    method: 'POST',
    data,
    requiresAuth: true,
  });
};

/**
 * Met à jour une ligne de stock valeur existante
 */
export const updateStockValeur = async (
  id: number,
  data: Partial<StockValeurFormData>
): Promise<StockValeur> => {
  return apiClient<StockValeur>(`/api/v1/stocks-valeurs/${id}/`, {
    method: 'PATCH',
    data,
    requiresAuth: true,
  });
};

/**
 * Supprime une ligne de stock valeur
 */
export const deleteStockValeur = async (id: number): Promise<void> => {
  return apiClient<void>(`/api/v1/stocks-valeurs/${id}/`, {
    method: 'DELETE',
    requiresAuth: true,
  });
};

/**
 * Récupère les totaux de récapitulatif pour une période et un bureau
 */
export const getStockRecapitulatif = async (params: {
  periode: number;
  bureau?: number;
}): Promise<StockValeurRecapitulatif> => {
  const query = new URLSearchParams();
  query.append('periode', params.periode.toString());
  if (params.bureau) query.append('bureau', params.bureau.toString());

  return apiClient<StockValeurRecapitulatif>(
    `/api/v1/stocks-valeurs/recapitulatif/?${query.toString()}`,
    {
      method: 'GET',
      requiresAuth: true,
    }
  );
};
