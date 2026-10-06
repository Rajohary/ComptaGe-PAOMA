export type UserRole = 'ADMIN' | 'RECEVEUR' | 'AGENT_SAISIE' | 'INSPECTEUR';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface ApiError {
  detail?: string;
  [key: string]: string | string[] | undefined;
}
