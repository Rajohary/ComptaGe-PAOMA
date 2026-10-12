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

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Province {
  id: number;
  nprovince: number;
  nom: string;
}

export interface Bureau {
  id: number;
  province: number;
  province_detail?: Province;
  nbur?: number;
  codeclasse?: number;
  ncodique: number;
  nom_bureau: string;
  classe: string;
  ccp?: string;
  ncf?: number;
  cf_codik?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BureauFormData {
  province: number;
  ncodique: number;
  nom_bureau: string;
  classe: string;
  ccp?: string;
  nbur?: number;
  codeclasse?: number;
  ncf?: number;
  cf_codik?: number;
}

export interface PeriodeGestion {
  id: number;
  bureau: number;
  bureau_detail?: {
    id: number;
    ncodique: number;
    nom_bureau: string;
    classe: string;
  };
  receveur?: number | null;
  nom_receveur: string;
  date_debut: string;
  date_fin: string;
  reserve_numeraire: string;
  valeurs_postales: string;
  timbres_fiscaux: string;
  solde_debiteur_depart: string;
  solde_crediteur_depart: string;
  cloturee: boolean;
  date_cloture: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PeriodeGestionFormData {
  bureau: number;
  nom_receveur: string;
  date_debut: string;
  date_fin: string;
  reserve_numeraire: string;
  valeurs_postales: string;
  timbres_fiscaux: string;
  solde_debiteur_depart?: string;
  solde_crediteur_depart?: string;
}


