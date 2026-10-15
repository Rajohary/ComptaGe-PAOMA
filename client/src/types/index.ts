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

// ---------------------------------------------------------------------------
// Types pour les Tableaux de bord (Module 6)
// ---------------------------------------------------------------------------

// 1. Dashboard Receveur & Agent de saisie
export interface ProgressionSectionItem {
  section_id: number;
  code: string;
  libelle: string;
  sens: string;
  sens_code: number;
  nb_mouvements: number;
  total_montant: string;
  total_rectifie: string;
  lignes_utilisees: number;
  lignes_total: number;
}

export interface TotauxMouvementsProgression {
  nb_mouvements: number;
  total_debit: string;
  total_credit: string;
  solde_mouvements: string;
  nb_ecarts: number;
  dernier_mouvement_date: string | null;
}

export interface EncaisseProgression {
  reserve_numeraire_depart: string;
  valeurs_postales_depart: string;
  timbres_fiscaux_depart: string;
  total_inventaire_depart: string;
  total_entrees_encaisse: string;
  total_sorties_encaisse: string;
  variation_nette: string;
  montant_caisse_actuel: string;
}

export interface ReceveurDashboardData {
  bureau: {
    id: number;
    ncodique: number;
    nom_bureau: string;
    classe: string;
    province_nom: string;
  };
  periode: {
    id: number;
    nom_receveur: string;
    date_debut: string;
    date_fin: string;
    cloturee: boolean;
    date_cloture: string | null;
  } | null;
  has_active_periode: boolean;
  message: string;
  progression_sections: ProgressionSectionItem[];
  totaux_mouvements: TotauxMouvementsProgression;
  encaisse: EncaisseProgression;
}

// 2. Dashboard Inspecteur & Vue DIF
export interface BureauAvecEcarts {
  bureau_id: number;
  ncodique: number;
  nom_bureau: string;
  province_nom: string;
  nb_ecarts: number;
  total_declare: string;
  total_rectifie: string;
  ecart_net: string;
}

export interface InspecteurKPIs {
  total_ecarts_count: number;
  total_montant_declare: string;
  total_montant_rectifie: string;
  total_ecart_net: string;
  total_ecart_absolu: string;
  total_augmentation: string;
  total_diminution: string;
  nb_bureaux_impactes: number;
  nb_non_rectifies: number;
  nb_rectifies: number;
  bureaux_avec_ecarts: BureauAvecEcarts[];
}

export interface EcartItem {
  id: number;
  date_operation: string;
  bureau: {
    id: number | null;
    ncodique: number | null;
    nom_bureau: string;
    classe: string;
    province_nom: string;
  };
  periode_gestion_id: number;
  ligne_comptable: {
    id: number | null;
    menu_sub: number | null;
    compte: string;
    libelle: string;
    section_code: string;
  };
  montant: string;
  augmentation: string;
  diminution: string;
  montant_rectifie: string;
  ecart: string;
  motif_rectification: string;
  saisi_par: string;
  rectifie_par: string | null;
  est_rectifie: boolean;
  created_at: string;
  updated_at: string;
}

export interface InspecteurDashboardData {
  kpis: InspecteurKPIs;
  derniers_ecarts: EcartItem[];
}

export interface EcartsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  kpis?: InspecteurKPIs;
  results: EcartItem[];
}

// 3. Dashboard Admin (Vue globale)
export interface AdminDashboardData {
  territoire: {
    total_bureaux: number;
    total_provinces: number;
    bureaux_actifs_count: number;
    bureaux_sans_periode_active: number;
    repartition_classes: Array<{
      classe: string;
      nb_bureaux: number;
    }>;
    repartition_provinces: Array<{
      province_id: number;
      nprovince: number;
      province_nom: string;
      nb_bureaux: number;
    }>;
  };
  periodes: {
    total_periodes: number;
    periodes_en_cours: number;
    periodes_cloturees: number;
    taux_cloture_pourcentage: number;
  };
  utilisateurs: {
    total_utilisateurs: number;
    utilisateurs_actifs: number;
    repartition_roles: {
      ADMIN: number;
      RECEVEUR: number;
      AGENT_SAISIE: number;
      INSPECTEUR: number;
      [key: string]: number;
    };
  };
  comptabilite: {
    total_mouvements_g58: number;
    total_debit: string;
    total_credit: string;
    solde_global: string;
    total_mouvements_encaisse: number;
  };
  audit: {
    total_ecarts_detectes: number;
    ecarts_en_attente: number;
    total_logs_audit: number;
    derniers_logs: Array<{
      id: number;
      created_at: string;
      action: string;
      action_label: string;
      auteur: string;
      model_name: string;
      object_repr: string;
      detail: string;
    }>;
  };
}


