import { apiClient } from './client';
import type { User, LoginRequest, LoginResponse, RefreshResponse } from '../types';

/**
 * POST /api/v1/auth/login/
 * Authentification — retourne access + refresh token + objet user.
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  return apiClient<LoginResponse>('/api/v1/auth/login/', {
    method: 'POST',
    data: credentials,
    requiresAuth: false,
  });
};

/**
 * POST /api/v1/auth/refresh/
 * Renouvellement du token d'accès.
 */
export const refreshToken = async (refresh: string): Promise<RefreshResponse> => {
  return apiClient<RefreshResponse>('/api/v1/auth/refresh/', {
    method: 'POST',
    data: { refresh },
    requiresAuth: false,
  });
};

/**
 * POST /api/v1/auth/logout/
 * Déconnexion côté serveur.
 */
export const logout = async (): Promise<{ detail: string }> => {
  return apiClient<{ detail: string }>('/api/v1/auth/logout/', {
    method: 'POST',
    data: {},
  });
};

/**
 * GET /api/v1/auth/me/
 * Infos de l'utilisateur courant (dont le rôle).
 */
export const getMe = async (): Promise<User> => {
  return apiClient<User>('/api/v1/auth/me/');
};
