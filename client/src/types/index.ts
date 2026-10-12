export type UserRole = 'ADMIN' | 'RECEVEUR' | 'AGENT_SAISIE' | 'INSPECTEUR';

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  syst_fonc: string;
  bureau_code: number | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  refresh: string;
  access: string;
  user: User;
}

export interface RefreshResponse {
  access: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface ApiError {
  detail?: string;
  [key: string]: string | string[] | undefined;
}
