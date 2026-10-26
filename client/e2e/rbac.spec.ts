import { test, expect } from '@playwright/test';

/**
 * Tests e2e du Module 5 : Audit, Détection d'écarts et Rectification (UC-04).
 * Conforme au contrat API défini dans API_CONTRACT.md.
 */

const INSPECTEUR_USER = {
  id: 3,
  username: 'inspecteur1',
  first_name: 'Marc',
  last_name: 'Inspecteur',
  email: 'inspecteur@comptage.local',
  role: 'INSPECTEUR',
  syst_fonc: '02',
  bureau_code: null,
};

const AGENT_SAISIE_USER = {
  id: 4,
  username: 'agent1',
  first_name: 'Faly',
  last_name: 'Saisie',
  email: 'agent1@comptage.local',
  role: 'AGENT_SAISIE',
  syst_fonc: '01',
  bureau_code: 101,
};

const MOCK_PROVINCES = {
  count: 2,
  next: null,
  previous: null,
  results: [
    { id: 1, nprovince: 1, nom: 'Antananarivo' },
    { id: 2, nprovince: 2, nom: 'Fianarantsoa' },
  ],
};

const MOCK_BUREAUX = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      ncodique: 10101,
      nom_bureau: 'Antaninarenina',
      classe: 'R1',
      province: 1,
      province_detail: { id: 1, nprovince: 1, nom: 'Antananarivo' },
    },
    {
      id: 2,
      ncodique: 10102,
      nom_bureau: 'Analakely',
      classe: 'R2',
      province: 1,
      province_detail: { id: 1, nprovince: 1, nom: 'Antananarivo' },
    },
  ],
};

const MOCK_ECARTS_LIST = {
  count: 2,
  next: null,
  previous: null,
  kpis: {
    total_ecarts_count: 2,
    total_montant_declare: '85000.00',
    total_montant_rectifie: '95000.00',
    total_ecart_net: '10000.00',
    total_ecart_absolu: '15000.00',
    total_augmentation: '15000.00',
    total_diminution: '5000.00',
    nb_bureaux_impactes: 2,
    nb_non_rectifies: 1,
    nb_rectifies: 1,
    bureaux_avec_ecarts: [
      {
        bureau_id: 1,
        ncodique: 10101,
        nom_bureau: 'Antaninarenina',
        province_nom: 'Antananarivo',
        nb_ecarts: 1,
        total_declare: '50000.00',
        total_rectifie: '60000.00',
        ecart_net: '10000.00',
      },
      {
        bureau_id: 2,
        ncodique: 10102,
        nom_bureau: 'Analakely',
        province_nom: 'Antananarivo',
        nb_ecarts: 1,
        total_declare: '35000.00',
        total_rectifie: '35000.00',
        ecart_net: '0.00',
      },
    ],
  },
  results: [
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
      augmentation: '0.00',
      diminution: '0.00',
      montant_rectifie: '50000.00',
      ecart: '0.00',
      motif_rectification: '',
      saisi_par: 'receveur1',
      rectifie_par: null,
      est_rectifie: false,
      created_at: '2026-06-15T10:30:00Z',
      updated_at: '2026-06-15T10:30:00Z',
    },
    {
      id: 14,
      date_operation: '2026-06-16',
      bureau: {
        id: 2,
        ncodique: 10102,
        nom_bureau: 'Analakely',
        classe: 'R2',
        province_nom: 'Antananarivo',
      },
      periode_gestion_id: 1,
      ligne_comptable: {
        id: 23,
        menu_sub: 201,
        compte: 'B101',
        libelle: 'Mandats ordinaires émis en numéraire',
        section_code: 'B',
      },
      montant: '35000.00',
      augmentation: '5000.00',
      diminution: '0.00',
      montant_rectifie: '40000.00',
      ecart: '5000.00',
      motif_rectification: 'Pointage contradictoire inspecteur',
      saisi_par: 'agent1',
      rectifie_par: 'inspecteur1',
      est_rectifie: true,
      created_at: '2026-06-16T11:00:00Z',
      updated_at: '2026-06-16T14:00:00Z',
    },
  ],
};

test.describe('Audit & Écarts — Vue DIF et Filtrage Inspecteur', () => {
  test.beforeEach(async ({ page }) => {
    // Session Inspecteur
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock_access_token_inspecteur');
      localStorage.setItem('refresh_token', 'mock_refresh_token_inspecteur');
    });

    await page.route('**/api/v1/auth/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(INSPECTEUR_USER),
      });
    });

    await page.route('**/api/v1/provinces/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PROVINCES),
      });
    });

    await page.route('**/api/v1/bureaux/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BUREAUX),
      });
    });

    await page.route('**/api/v1/audit/ecarts/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ECARTS_LIST),
      });
    });
  });

  test('affiche l’écran d’audit des écarts avec ses cartes KPIs et sa table', async ({ page }) => {
    await page.goto('/audit');

    // Vérifier l'en-tête de la page
    await expect(page.getByRole('heading', { name: "Audit des Écarts & Vue DIF" })).toBeVisible();
    await expect(page.getByText("Inspection & Contrôle Comptable")).toBeVisible();

    // Vérifier les cartes KPIs
    await expect(page.getByText('Total Écarts')).toBeVisible();
    await expect(page.getByText('Écart Net Cumulé')).toBeVisible();
    await expect(page.getByText('Bureaux Impactés')).toBeVisible();
    await expect(page.getByText('Montant Rectifié Total')).toBeVisible();

    // Vérifier les lignes dans le tableau
    const table = page.locator('table');
    await expect(table.getByText('Antaninarenina')).toBeVisible();
    await expect(table.getByText('AD02')).toBeVisible();
    await expect(table.getByText('En attente')).toBeVisible();

    await expect(table.getByText('Analakely')).toBeVisible();
    await expect(table.getByText('B101')).toBeVisible();
    await expect(table.getByText('Régularisé')).toBeVisible();
  });

  test('permet de filtrer par bureau, province, statut et montant', async ({ page }) => {
    await page.goto('/audit');

    // Sélectionner un filtre bureau
    const bureauSelect = page.locator('#select-bureau');
    await expect(bureauSelect).toBeVisible();
    await bureauSelect.selectOption('10101');

    // Sélectionner un filtre province
    const provinceSelect = page.locator('#select-province');
    await expect(provinceSelect).toBeVisible();
    await provinceSelect.selectOption('Antananarivo');

    // Sélectionner un filtre statut
    const statutSelect = page.locator('#select-statut');
    await expect(statutSelect).toBeVisible();
    await statutSelect.selectOption('non_rectifie');

    // Filtrer par montant
    const minMontantInput = page.locator('#min-montant');
    await minMontantInput.fill('40000');

    // Le tableau doit refléter le filtrage local sur les montants
    const table = page.locator('table');
    await expect(table.getByText('Antaninarenina')).toBeVisible();
    await expect(table.getByText('Analakely')).not.toBeVisible();
  });
});

test.describe('Formulaire de rectification (UC-04)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock_access_token_inspecteur');
      localStorage.setItem('refresh_token', 'mock_refresh_token_inspecteur');
    });

    await page.route('**/api/v1/auth/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(INSPECTEUR_USER),
      });
    });

    await page.route('**/api/v1/provinces/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PROVINCES),
      });
    });

    await page.route('**/api/v1/bureaux/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BUREAUX),
      });
    });

    await page.route('**/api/v1/audit/ecarts/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ECARTS_LIST),
      });
    });
  });

  test('affiche le modal avec le calcul automatique de montant_rectifie et valide la rectification', async ({ page }) => {
    let patchPayload: any = null;

    await page.route('**/api/v1/mouvements/12/rectifier/', async (route) => {
      patchPayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
          augmentation: patchPayload.augmentation,
          diminution: patchPayload.diminution,
          montant_rectifie: patchPayload.montant_rectifie,
          ecart: patchPayload.augmentation,
          motif_rectification: patchPayload.motif,
          saisi_par: 'receveur1',
          rectifie_par: 'inspecteur1',
          est_rectifie: true,
          created_at: '2026-06-15T10:30:00Z',
          updated_at: '2026-06-16T15:00:00Z',
        }),
      });
    });

    await page.goto('/audit');

    // Cliquer sur le bouton Rectifier de la première écriture non régularisée
    const rectifierBtn = page.getByRole('button', { name: 'Rectifier' }).first();
    await expect(rectifierBtn).toBeVisible();
    await rectifierBtn.click();

    // La modale doit s'ouvrir
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Rectification d'écriture comptable (Audit UC-04)")).toBeVisible();
    await expect(modal.getByText('Équation de contrôle automatique')).toBeVisible();

    // Tester la validation : motif obligatoire
    const submitBtn = modal.getByRole('button', { name: 'Valider la rectification' });
    await submitBtn.click();
    await expect(modal.getByText(/Le motif de rectification est obligatoire/i)).toBeVisible();

    // Remplir le motif
    const motifInput = modal.locator('textarea');
    await motifInput.fill('Pointage contradictoire guichet manquant');

    // Remplir augmentation
    const augmentationInput = modal.locator('input[placeholder="0.00"]').first();
    await augmentationInput.fill('10000');

    // Vérifier l'affichage du calcul automatique en direct : 50 000 + 10 000 = 60 000 Ar
    await expect(modal.getByText(/60\s?000/).first()).toBeVisible();

    // Soumettre le formulaire
    await submitBtn.click();

    // Vérifier que la requête PATCH a bien été envoyée avec le motif et le calcul automatique
    expect(patchPayload).not.toBeNull();
    expect(patchPayload.motif).toBe('Pointage contradictoire guichet manquant');
    expect(patchPayload.augmentation).toBe('10000');
    expect(patchPayload.montant_rectifie).toBe('60000.00');

    // Vérifier le message de confirmation
    await expect(page.getByText(/Écriture rectifiée avec succès/i)).toBeVisible();
  });
});

test.describe('Test e2e rbac.spec.ts — agent de saisie et restrictions', () => {
  test('un agent de saisie ne voit pas les actions de rectification réservées à l’inspecteur et ne peut accéder à /audit', async ({ page }) => {
    // Session Agent de saisie
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock_access_token_agent');
      localStorage.setItem('refresh_token', 'mock_refresh_token_agent');
    });

    await page.route('**/api/v1/auth/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(AGENT_SAISIE_USER),
      });
    });

    // 1. Accès direct à /audit : doit rediriger vers /non-autorise
    await page.goto('/audit');
    await expect(page).toHaveURL(/\/non-autorise/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Accès non autorisé' })).toBeVisible();

    // 2. Navigation vers /saisie
    await page.goto('/saisie');
    await expect(page).toHaveURL(/\/saisie/);

    // 3. Vérifier que la sidebar ne montre pas l'item d'audit
    await expect(page.getByRole('link', { name: 'Audit & Écarts' })).not.toBeVisible();

    // 4. Mais l'agent de saisie accède bien et voit le lien de Saisie G58
    await expect(page.getByRole('link', { name: 'Saisie G58' })).toBeVisible();
  });
});
