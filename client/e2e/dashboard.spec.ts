import { test, expect } from '@playwright/test';

/**
 * Tests e2e du module 6 : Tableaux de bord (Receveur, Inspecteur, Admin).
 * Conforme à DESIGN.md et API_CONTRACT.md.
 */

const RECEVEUR_USER = {
  id: 1,
  username: 'receveur1',
  first_name: 'Jean',
  last_name: 'Receveur',
  email: 'receveur1@comptage.local',
  role: 'RECEVEUR',
  syst_fonc: '01',
  bureau_code: 10101,
};

const INSPECTEUR_USER = {
  id: 2,
  username: 'inspecteur1',
  first_name: 'Hery',
  last_name: 'Inspecteur',
  email: 'inspecteur@comptage.local',
  role: 'INSPECTEUR',
  syst_fonc: '',
  bureau_code: null,
};

const ADMIN_USER = {
  id: 3,
  username: 'admin1',
  first_name: 'Admin',
  last_name: 'Système',
  email: 'admin@comptage.local',
  role: 'ADMIN',
  syst_fonc: '',
  bureau_code: null,
};

const MOCK_RECEVEUR_DASHBOARD = {
  bureau: {
    id: 1,
    ncodique: 10101,
    nom_bureau: 'Antaninarenina',
    classe: 'R1',
    province_nom: 'Antananarivo',
  },
  periode: {
    id: 1,
    nom_receveur: 'Jean Receveur',
    date_debut: '2026-06-01',
    date_fin: '2026-06-30',
    cloturee: false,
    date_cloture: null,
  },
  has_active_periode: true,
  message: 'Période en cours active.',
  progression_sections: [
    {
      section_id: 1,
      code: 'A',
      libelle: 'Opérations de débit',
      sens: 'Débit',
      sens_code: 1,
      nb_mouvements: 14,
      total_montant: '1250000.00',
      total_rectifie: '1250000.00',
      lignes_utilisees: 6,
      lignes_total: 12,
    },
    {
      section_id: 2,
      code: 'B',
      libelle: 'Opérations de crédit',
      sens: 'Crédit',
      sens_code: 2,
      nb_mouvements: 8,
      total_montant: '450000.00',
      total_rectifie: '470000.00',
      lignes_utilisees: 4,
      lignes_total: 10,
    },
  ],
  totaux_mouvements: {
    nb_mouvements: 22,
    total_debit: '1250000.00',
    total_credit: '470000.00',
    solde_mouvements: '780000.00',
    nb_ecarts: 1,
    dernier_mouvement_date: '2026-06-18',
  },
  encaisse: {
    reserve_numeraire_depart: '500000.00',
    valeurs_postales_depart: '250000.00',
    timbres_fiscaux_depart: '100000.00',
    total_inventaire_depart: '850000.00',
    total_entrees_encaisse: '120000.00',
    total_sorties_encaisse: '40000.00',
    variation_nette: '80000.00',
    montant_caisse_actuel: '580000.00',
  },
};

const MOCK_INSPECTEUR_DASHBOARD = {
  kpis: {
    total_ecarts_count: 5,
    total_montant_declare: '320000.00',
    total_montant_rectifie: '345000.00',
    total_ecart_net: '25000.00',
    total_ecart_absolu: '35000.00',
    total_augmentation: '30000.00',
    total_diminution: '5000.00',
    nb_bureaux_impactes: 2,
    nb_non_rectifies: 3,
    nb_rectifies: 2,
    bureaux_avec_ecarts: [
      {
        bureau_id: 1,
        ncodique: 10101,
        nom_bureau: 'Antaninarenina',
        province_nom: 'Antananarivo',
        nb_ecarts: 3,
        total_declare: '200000.00',
        total_rectifie: '220000.00',
        ecart_net: '20000.00',
      },
      {
        bureau_id: 2,
        ncodique: 10102,
        nom_bureau: 'Tanjombato',
        province_nom: 'Antananarivo',
        nb_ecarts: 2,
        total_declare: '120000.00',
        total_rectifie: '125000.00',
        ecart_net: '5000.00',
      },
    ],
  },
  derniers_ecarts: [
    {
      id: 12,
      date_operation: '2026-06-15',
      bureau: {
        id: 1,
        ncodique: 10101,
        nom_bureau: 'Antaninarenina',
        classe: 'R1',
        province_nom: 'Antananarivo',
      },
      periode_gestion_id: 1,
      ligne_comptable: {
        id: 5,
        menu_sub: 102,
        compte: 'AD02',
        libelle: 'Vente de valeurs postales',
        section_code: 'A',
      },
      montant: '50000.00',
      augmentation: '10000.00',
      diminution: '0.00',
      montant_rectifie: '60000.00',
      ecart: '10000.00',
      motif_rectification: 'Manquant constaté lors du pointage contradictoire',
      saisi_par: 'receveur1',
      rectifie_par: 'inspecteur1',
      est_rectifie: true,
      created_at: '2026-06-15T10:30:00Z',
      updated_at: '2026-06-16T14:20:00Z',
    },
  ],
};

const MOCK_ADMIN_DASHBOARD = {
  territoire: {
    total_bureaux: 24,
    total_provinces: 6,
    bureaux_actifs_count: 18,
    bureaux_sans_periode_active: 6,
    repartition_classes: [
      { classe: 'R1', nb_bureaux: 10 },
      { classe: 'R2', nb_bureaux: 8 },
      { classe: 'HC', nb_bureaux: 6 },
    ],
    repartition_provinces: [
      { province_id: 1, nprovince: 1, province_nom: 'Antananarivo', nb_bureaux: 8 },
      { province_id: 2, nprovince: 2, province_nom: 'Toamasina', nb_bureaux: 5 },
    ],
  },
  periodes: {
    total_periodes: 30,
    periodes_en_cours: 18,
    periodes_cloturees: 12,
    taux_cloture_pourcentage: 40.0,
  },
  utilisateurs: {
    total_utilisateurs: 42,
    utilisateurs_actifs: 40,
    repartition_roles: {
      ADMIN: 3,
      RECEVEUR: 24,
      AGENT_SAISIE: 12,
      INSPECTEUR: 3,
    },
  },
  comptabilite: {
    total_mouvements_g58: 1420,
    total_debit: '48500000.00',
    total_credit: '36200000.00',
    solde_global: '12300000.00',
    total_mouvements_encaisse: 540,
  },
  audit: {
    total_ecarts_detectes: 14,
    ecarts_en_attente: 4,
    total_logs_audit: 185,
    derniers_logs: [
      {
        id: 185,
        created_at: '2026-10-15T15:20:00Z',
        action: 'RECTIFICATION',
        action_label: 'Rectification inspecteur',
        auteur: 'inspecteur1',
        model_name: 'Mouvement',
        object_repr: 'Mouvement #42',
        detail: 'Redressement montant +5000 MGA',
      },
    ],
  },
};

test.describe('Module 6 — Tableau de bord Receveur', () => {
  test('affiche la progression de saisie par section et le montant en caisse', async ({ page }) => {
    await page.route('**/api/v1/auth/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(RECEVEUR_USER),
      });
    });

    await page.route('**/api/v1/dashboard/receveur/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_RECEVEUR_DASHBOARD),
      });
    });

    // Simuler connexion
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mock_token_receveur');
    });
    await page.goto('/');

    // Vérifier l'en-tête du bureau
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tableau de Bord');
    await expect(page.getByText('Antaninarenina')).toBeVisible();
    await expect(page.getByText('Codique 10101')).toBeVisible();
    await expect(page.getByText('Période en cours (ouverte)')).toBeVisible();

    // Vérifier les KPIs
    await expect(page.getByText('Encaisse Actuelle')).toBeVisible();
    await expect(page.getByText('Recettes (Débit)')).toBeVisible();
    await expect(page.getByText('Dépenses (Crédit)')).toBeVisible();

    // Vérifier les sections comptables dans le tableau
    await expect(page.getByText('Opérations de débit')).toBeVisible();
    await expect(page.getByText('Opérations de crédit')).toBeVisible();
    await expect(page.getByText('Décomposition de l\'Encaisse et Valeurs en Coffre')).toBeVisible();
  });
});

test.describe('Module 6 — Tableau de bord Inspecteur', () => {
  test('affiche les KPIs d\'audit et la liste triable des bureaux avec écarts', async ({ page }) => {
    await page.route('**/api/v1/auth/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(INSPECTEUR_USER),
      });
    });

    await page.route('**/api/v1/dashboard/inspecteur/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_INSPECTEUR_DASHBOARD),
      });
    });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mock_token_inspecteur');
    });
    await page.goto('/');

    // Vérifier les KPIs
    await expect(page.getByText('Anomalies Détectées')).toBeVisible();
    await expect(page.getByText('Bureaux en Écart')).toBeVisible();
    await expect(page.getByText('Écart Net (Rectif − Déclaré)')).toBeVisible();

    // Vérifier la liste des bureaux impactés
    await expect(page.getByText('Bureaux avec Écarts en Attente')).toBeVisible();
    await expect(page.getByText('Antaninarenina').first()).toBeVisible();
    await expect(page.getByText('Tanjombato')).toBeVisible();

    // Vérifier le tableau des dernières écritures en anomalie
    await expect(page.getByText('Écritures en Anomalie Récentes (Vue DIF)')).toBeVisible();
    await expect(page.getByText('Manquant constaté lors du pointage contradictoire')).toBeVisible();
  });
});

test.describe('Module 6 — Tableau de bord Administrateur', () => {
  test('affiche la vue d\'ensemble du réseau postal et permet de basculer de vue', async ({ page }) => {
    await page.route('**/api/v1/auth/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ADMIN_USER),
      });
    });

    await page.route('**/api/v1/dashboard/admin/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ADMIN_DASHBOARD),
      });
    });

    await page.route('**/api/v1/dashboard/inspecteur/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_INSPECTEUR_DASHBOARD),
      });
    });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mock_token_admin');
    });
    await page.goto('/');

    // Vérifier la vue d'ensemble globale
    await expect(page.getByText('Vue d\'Ensemble Globale du Réseau Postal')).toBeVisible();
    await expect(page.getByText('Bureaux Actifs')).toBeVisible();
    await expect(page.getByText('Périodes en Cours')).toBeVisible();
    await expect(page.getByText('Agents & Accès')).toBeVisible();
    await expect(page.getByText('Maillage Postal par Province (Faritany)')).toBeVisible();

    // Vérifier les boutons de bascule de vue
    const auditBtn = page.getByRole('button', { name: /Audit \(Inspecteur\)/ });
    await expect(auditBtn).toBeVisible();
    await auditBtn.click();

    // Doit maintenant afficher le dashboard inspecteur
    await expect(page.getByText('Anomalies Détectées')).toBeVisible();
    await expect(page.getByText('Bureaux avec Écarts en Attente')).toBeVisible();
  });

  test('affiche et filtre le journal de traçabilité & vigilance réglementaire', async ({ page }) => {
    await page.route('**/api/v1/auth/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ADMIN_USER),
      });
    });

    await page.route('**/api/v1/dashboard/admin/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ADMIN_DASHBOARD),
      });
    });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mock_token_admin');
    });
    await page.goto('/');

    // Vérifier le bloc de traçabilité et vigilance réglementaire
    await expect(page.getByText('Traçabilité & Vigilance Réglementaire')).toBeVisible();
    await expect(page.getByText('Journal Inaltérable')).toBeVisible();
    await expect(page.getByText('185', { exact: true })).toBeVisible();
    await expect(page.getByText('Rectification inspecteur')).toBeVisible();
    await expect(page.getByText('Mouvement #42')).toBeVisible();
    await expect(page.getByText('Redressement montant +5000 MGA')).toBeVisible();

    // Tester la recherche en direct
    const searchInput = page.getByPlaceholder('Rechercher par auteur, modèle, objet, détail...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('introuvable_xyz');
    await expect(page.getByText('Aucun événement ne correspond à vos critères de filtrage.')).toBeVisible();

    await searchInput.fill('');
    await expect(page.getByText('Redressement montant +5000 MGA')).toBeVisible();
  });

  test('permet à l\'administrateur de sélectionner un bureau pour voir son état détaillé', async ({ page }) => {
    await page.route('**/api/v1/auth/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ADMIN_USER),
      });
    });

    await page.route('**/api/v1/dashboard/admin/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ADMIN_DASHBOARD),
      });
    });

    await page.route('**/api/v1/bureaux/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          next: null,
          previous: null,
          results: [
            {
              id: 1,
              province: 1,
              province_detail: { id: 1, nprovince: 1, nom: 'Antananarivo' },
              ncodique: 10101,
              nom_bureau: 'Antaninarenina',
              classe: 'R1',
            },
            {
              id: 2,
              province: 1,
              province_detail: { id: 1, nprovince: 1, nom: 'Antananarivo' },
              ncodique: 10102,
              nom_bureau: 'Tanjombato',
              classe: 'R2',
            },
          ],
        }),
      });
    });

    await page.route('**/api/v1/periodes-gestion/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          next: null,
          previous: null,
          results: [
            {
              id: 10,
              bureau: 1,
              bureau_nom: 'Antaninarenina',
              nom_receveur: 'Jean Receveur',
              date_debut: '2026-10-01',
              date_fin: '2026-10-31',
              cloturee: false,
            },
            {
              id: 9,
              bureau: 1,
              bureau_nom: 'Antaninarenina',
              nom_receveur: 'Paul Ancien',
              date_debut: '2026-09-01',
              date_fin: '2026-09-30',
              cloturee: true,
            },
          ],
        }),
      });
    });

    await page.route('**/api/v1/dashboard/receveur/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_RECEVEUR_DASHBOARD),
      });
    });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'mock_token_admin');
    });
    await page.goto('/');

    // Vérifier la présence de la section de sélection de bureau et de période
    await expect(page.getByText("Consulter l'état d'un bureau")).toBeVisible();
    const adminSelect = page.getByTestId('admin-select-bureau');
    await expect(adminSelect).toBeVisible();

    const periodeSelect = page.getByTestId('admin-select-periode');
    await expect(periodeSelect).toBeVisible();
    await expect(periodeSelect).toContainText('Jean Receveur');

    // Vérifier le bouton "Voir l'état"
    const viewBtn = page.getByTestId('btn-view-bureau-dashboard');
    await expect(viewBtn).toBeVisible();
    await viewBtn.click();

    // On bascule sur la vue bureau (receveur) avec le sélecteur actif
    await expect(page.getByTestId('select-bureau-dashboard')).toBeVisible();
    await expect(page.getByTestId('select-periode-dashboard')).toBeVisible();
    await expect(page.getByText('Antaninarenina').first()).toBeVisible();
  });
});
