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
  date_fin: string | null;
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

export interface HistoriquePeriodeItem {
  id: number;
  nom_receveur: string;
  date_debut: string;
  date_fin: string | null;
  cloturee: boolean;
  date_cloture: string | null;
  solde_debiteur_depart: string;
  solde_crediteur_depart: string;
  reserve_numeraire: string;
  valeurs_postales: string;
  timbres_fiscaux: string;
  total_encaisse_depart: string;
  total_debit: string;
  total_credit: string;
  solde_debiteur_fin: string;
  solde_crediteur_fin: string;
  nb_mouvements: number;
}

export interface PeriodeEnCoursInfo {
  id: number;
  nom_receveur: string;
  date_debut: string;
  solde_debiteur_depart: string;
  solde_crediteur_depart: string;
  total_encaisse_depart: string;
}

export interface HistoriquePassationResponse {
  bureau: {
    id: number;
    ncodique: number;
    nom_bureau: string;
    classe: string;
    ccp: string;
    province: string | null;
  };
  total_periodes: number;
  periodes_cloturees: number;
  periode_en_cours: PeriodeEnCoursInfo | null;
  historique: HistoriquePeriodeItem[];
}

export interface PeriodeGestionFormData {
  bureau: number;
  nom_receveur: string;
  date_debut: string;
  date_fin?: string | null;
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

export interface SectionComptableFormData {
  code: string;
  libelle: string;
  sens: number;
  ordre: number;
  actif?: boolean;
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

export interface LigneComptableFormData {
  section: number;
  parent?: number | null;
  menu_sub?: number | null;
  compte: string;
  libelle: string;
  actif?: boolean;
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

// ============================================================================
// Tableaux de bord (Module 6 — API_CONTRACT.md)
// ============================================================================

export interface SectionProgressionItem {
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
    province_nom?: string;
  };
  periode: {
    id: number;
    nom_receveur: string;
    date_debut: string;
    date_fin: string;
    cloturee: boolean;
    date_cloture?: string | null;
  } | null;
  has_active_periode: boolean;
  message: string;
  progression_sections: SectionProgressionItem[];
  totaux_mouvements: TotauxMouvementsProgression;
  encaisse: EncaisseProgression;
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

export interface BureauAvecEcartsItem {
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
  bureaux_avec_ecarts: BureauAvecEcartsItem[];
}

export interface EcartItem {
  id: number;
  date_operation: string;
  bureau: {
    id: number;
    ncodique: number;
    nom_bureau: string;
    classe: string;
    province_nom: string;
  };
  periode_gestion_id: number;
  ligne_comptable: {
    id: number;
    menu_sub: number;
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
  a_ecart?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RectificationInput {
  motif: string;
  augmentation?: string | number;
  diminution?: string | number;
  montant_rectifie?: string | number;
}

export interface MouvementG58FormData {
  periode_gestion: number;
  ligne_comptable: number;
  date_operation: string;
  montant: string;
  augmentation?: string;
  diminution?: string;
  motif_rectification?: string;
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

export interface InspecteurDashboardData {
  kpis: InspecteurKPIs;
  derniers_ecarts: EcartItem[];
}

export interface EcartsListResponse extends PaginatedResponse<EcartItem> {
  kpis?: InspecteurKPIs;
}

export interface AdminDashboardData {
  territoire: {
    total_bureaux: number;
    total_provinces: number;
    bureaux_actifs_count: number;
    bureaux_sans_periode_active: number;
    repartition_classes: Array<{ classe: string; nb_bureaux: number }>;
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
    repartition_roles: Record<UserRole, number>;
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


