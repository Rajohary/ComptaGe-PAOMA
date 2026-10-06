import { apiClient } from './client';
import type { HealthResponse } from '../types';

export const getHealth = async (): Promise<HealthResponse> => {
  return apiClient<HealthResponse>('/api/v1/health/', { requiresAuth: false });
};
