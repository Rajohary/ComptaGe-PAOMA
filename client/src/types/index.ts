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

export interface SectionComptable {
  id: number;
  code: string;
  libelle: string;
  sens: number; // 1 = Débit, 2 = Crédit
  sens_libelle: string; // 'Débit' | 'Crédit'
  actif: boolean;
  ordre: number;
}

export interface LigneComptableParentDetail {
  id: number;
  menu_sub: number;
  compte: string;
  libelle: string;
}

export interface LigneComptable {
  id: number;
  menu_sub: number;
  compte: string;
  libelle: string;
  section: number;
  section_code: string;
  section_libelle: string;
  sens: number;
  sens_libelle: string;
  parent: number | null;
  parent_detail: LigneComptableParentDetail | null;
  actif: boolean;
  is_leaf?: boolean;
}

export interface LigneComptableSearchParams {
  search?: string;
  section?: string | number;
  sens?: number;
  parent?: number | null;
  feuille?: boolean;
  actif?: boolean | 'all';
  page?: number;
}

export type CategorieProduit = 'VP' | 'TF' | 'AUTRE';

export interface ProduitPostal {
  id: number;
  nom: string;
  categorie: CategorieProduit;
  categorie_libelle: string;
  valeur_faciale: string;
  actif: boolean;
}

export interface StockValeur {
  id: number;
  bureau: number;
  bureau_detail?: {
    id: number;
    ncodique: number;
    nom_bureau: string;
    classe: string;
  };
  periode_gestion: number;
  periode_detail?: {
    id: number;
    nom_receveur: string;
    date_debut: string;
    date_fin: string;
    cloturee: boolean;
  };
  produit: number;
  produit_detail?: ProduitPostal;
  quantite_initiale: number;
  quantite_recue: number;
  quantite_vendue: number;
  quantite_finale: number;
  valeur_initiale: string;
  valeur_recue: string;
  valeur_vendue: string;
  valeur_finale: string;
  created_at?: string;
  updated_at?: string;
}

export interface StockValeurFormData {
  bureau: number;
  periode_gestion: number;
  produit: number;
  quantite_initiale: number;
  quantite_recue: number;
  quantite_vendue: number;
}

export interface StockValeurRecapitulatif {
  total_valeur_initiale: number;
  total_valeur_recue: number;
  total_valeur_vendue: number;
  total_valeur_finale: number;
  total_quantite_initiale: number;
  total_quantite_recue: number;
  total_quantite_vendue: number;
  total_quantite_finale: number;
  nb_lignes: number;
}

export interface StockValeurSearchParams {
  bureau?: number;
  periode_gestion?: number;
  periode?: number;
  produit?: number;
  categorie?: string;
  page?: number;
}

export interface MouvementG58 {
  id: number;
  periode_gestion: number;
  periode_detail?: {
    id: number;
    nom_receveur: string;
    date_debut: string;
    date_fin: string;
    cloturee: boolean;
  };
  ligne_comptable: number;
  ligne_detail?: LigneComptable;
  saisi_par: number;
  saisi_par_username: string;
  rectifie_par: number | null;
  rectifie_par_username: string | null;
  date_operation: string;
  montant: string;
  augmentation: string;
  diminution: string;
  montant_rectifie: string;
  motif_rectification: string;
  a_ecart: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MouvementG58FormData {
  periode_gestion: number;
  ligne_comptable: number;
  date_operation: string;
  montant: string;
}

export interface MouvementSearchParams {
  periode_gestion?: number;
  periode?: number;
  bureau?: number;
  date_operation?: string;
  date?: string;
  section?: string | number;
  sens?: number;
  compte?: string;
  page?: number;
}

export interface TotauxSectionItem {
  section_id: number;
  code: string;
  libelle: string;
  sens: number;
  sens_libelle: string;
  total_declare: string;
  total_rectifie: string;
}

export interface SousSectionBItem {
  total_declare: string;
  total_rectifie: string;
}

export interface TotauxG58 {
  periode_gestion_id: number;
  date_operation?: string | null;
  totaux_sections: Record<string, TotauxSectionItem>;
  sous_sections_b: Record<string, SousSectionBItem>;
  total_general_debit: string;
  total_general_credit: string;
  solde_net: string;
}

export interface RubriqueEncaisse {
  id: number;
  rubrique_parent: number;
  parent_libelle: string;
  menu_sub: number;
  compte: string;
  libelle: string;
}

export interface MouvementEncaisse {
  id: number;
  periode_gestion: number;
  rubrique_encaisse: number;
  rubrique_detail?: RubriqueEncaisse;
  sens: number; // 1 = Entrée, 2 = Sortie
  sens_libelle: string;
  date_operation: string;
  montant: string;
  saisi_par: number;
  saisi_par_username: string;
  created_at?: string;
  updated_at?: string;
}

export interface MouvementEncaisseFormData {
  periode_gestion: number;
  rubrique_encaisse: number;
  sens: number;
  date_operation: string;
  montant: string;
}

export interface MouvementEncaisseSearchParams {
  periode_gestion?: number;
  periode?: number;
  bureau?: number;
  date_operation?: string;
  date?: string;
  sens?: number;
  rubrique_encaisse?: number;
  compte?: string;
  page?: number;
}

export interface SituationComptable {
  periode_id: number;
  bureau_id?: number;
  bureau_nom?: string;
  bureau_ncodique?: number;
  nom_receveur?: string;
  date_debut?: string;
  date_fin?: string;
  cloturee?: boolean;
  source_report: string;
  periode_precedente_id?: number | null;
  solde_debiteur_reporte: string | number;
  solde_crediteur_reporte: string | number;
  total_debit_mois: string | number;
  total_credit_mois: string | number;
  cumul_debit: string | number;
  cumul_credit: string | number;
  solde_debiteur_fin: string | number;
  solde_crediteur_fin: string | number;
  totaux_sections?: Record<string, TotauxSectionItem>;
  sous_sections_b?: Record<string, SousSectionBItem>;
}

