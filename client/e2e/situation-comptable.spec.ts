import { test, expect } from '@playwright/test';

const MOCK_BUREAUX = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      province: 1,
      province_detail: { id: 1, nprovince: 1, nom: 'Antananarivo' },
      nbur: 1,
      codeclasse: 1,
      ncodique: 10101,
      nom_bureau: 'Antaninarenina',
      classe: 'R1',
      ccp: '10020',
      ncf: 1,
      cf_codik: 10101,
      created_at: '2026-06-01T08:00:00Z',
      updated_at: '2026-06-01T08:00:00Z',
    },
  ],
};

const MOCK_PERIODES = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 2,
      bureau: 1,
      nom_receveur: 'Rakoto Jean',
      date_debut: '2026-06-01',
      date_fin: '2026-06-30',
      reserve_numeraire: '500000.00',
      valeurs_postales: '250000.00',
      timbres_fiscaux: '100000.00',
      solde_debiteur_depart: '0.00',
      solde_crediteur_depart: '0.00',
      cloturee: false,
      date_cloture: null,
    },
    {
      id: 1,
      bureau: 1,
      nom_receveur: 'Rakoto Jean',
      date_debut: '2026-05-01',
      date_fin: '2026-05-31',
      reserve_numeraire: '450000.00',
      valeurs_postales: '200000.00',
      timbres_fiscaux: '80000.00',
      solde_debiteur_depart: '0.00',
      solde_crediteur_depart: '0.00',
      cloturee: true,
      date_cloture: '2026-05-31T18:00:00Z',
    },
  ],
};

// Situation calculée avec report automatique du solde débiteur de mai 2026 (120 000 Ar)
const MOCK_SITUATION_JUIN = {
  periode_id: 2,
  bureau_id: 1,
  bureau_nom: 'Antaninarenina',
  bureau_ncodique: 10101,
  nom_receveur: 'Rakoto Jean',
  date_debut: '2026-06-01',
  date_fin: '2026-06-30',
  cloturee: false,
  source_report: 'Période précédente #1 (2026-05-01 au 2026-05-31)',
  periode_precedente_id: 1,
  solde_debiteur_reporte: '120000.00',
  solde_crediteur_reporte: '0.00',
  total_debit_mois: '80000.00',
  total_credit_mois: '50000.00',
  cumul_debit: '200000.00', // 120 000 + 80 000
  cumul_credit: '50000.00',  // 0 + 50 000
  solde_debiteur_fin: '150000.00', // 200 000 - 50 000
  solde_crediteur_fin: '0.00',
  totaux_sections: {},
  sous_sections_b: {},
};

// Situation initiale sans période précédente (ex: Mai 2026)
const MOCK_SITUATION_MAI = {
  periode_id: 1,
  bureau_id: 1,
  bureau_nom: 'Antaninarenina',
  bureau_ncodique: 10101,
  nom_receveur: 'Rakoto Jean',
  date_debut: '2026-05-01',
  date_fin: '2026-05-31',
  cloturee: true,
  source_report: "Solde initial déclaré à l'ouverture",
  periode_precedente_id: null,
  solde_debiteur_reporte: '0.00',
  solde_crediteur_reporte: '0.00',
  total_debit_mois: '150000.00',
  total_credit_mois: '30000.00',
  cumul_debit: '150000.00',
  cumul_credit: '30000.00',
  solde_debiteur_fin: '120000.00',
  solde_crediteur_fin: '0.00',
  totaux_sections: {},
  sous_sections_b: {},
};

test.describe('Section 4 — Écran Situation comptable & Report automatique de solde', () => {
  test.beforeEach(async ({ page }) => {
    // Auth Receveur
    await page.route('**/api/v1/auth/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          username: 'receveur1',
          first_name: 'Jean',
          last_name: 'Receveur',
          email: 'receveur1@comptage.local',
          role: 'RECEVEUR',
          syst_fonc: '01',
          bureau_code: 10101,
        }),
      });
    });

    // Bureaux
    await page.route('**/api/v1/bureaux/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BUREAUX),
      });
    });

    // Périodes
    await page.route('**/api/v1/periodes-gestion/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PERIODES),
      });
    });

    // Situation comptable
    await page.route('**/api/v1/situation-comptable/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/situation-comptable/1/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_SITUATION_MAI),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SITUATION_JUIN),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock_token_receveur');
    });
  });

  test('affiche la situation comptable avec le report automatique du solde du mois précédent', async ({ page }) => {
    await page.goto('/situation-comptable');

    // Titre de l'écran
    await expect(page.getByRole('heading', { name: 'Situation comptable mensuelle' })).toBeVisible();

    // Vérifier la bannière de report automatique
    const banner = page.getByTestId('report-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Report automatique du solde du mois précédent actif');
    await expect(banner).toContainText('Période précédente #1 (2026-05-01 au 2026-05-31)');

    // Vérifier les montants reportés
    await expect(page.getByTestId('report-debit')).toContainText('120 000,00 Ar');
    await expect(page.getByTestId('report-credit')).toContainText('0,00 Ar');

    // Vérifier la balance : Colonne Débits
    await expect(page.getByTestId('mois-debit')).toContainText('+80 000,00 Ar');
    await expect(page.getByTestId('cumul-debit')).toContainText('200 000,00 Ar');

    // Colonne Crédits
    await expect(page.getByTestId('mois-credit')).toContainText('+50 000,00 Ar');
    await expect(page.getByTestId('cumul-credit')).toContainText('50 000,00 Ar');

    // Solde de clôture : Débiteur = 200 000 - 50 000 = 150 000 Ar
    const soldeFin = page.getByTestId('solde-debiteur-fin');
    await expect(soldeFin).toBeVisible();
    await expect(soldeFin).toContainText('+150 000,00 Ar');
  });

  test('permet de basculer vers une autre période pour consulter sa balance mensuelle', async ({ page }) => {
    await page.goto('/situation-comptable');

    // Changer la période de gestion vers Mai 2026 (id=1)
    await page.locator('#select-periode-situation').selectOption('1');

    // La situation de Mai affiche la source initiale déclarée à l'ouverture
    const banner = page.getByTestId('report-banner');
    await expect(banner).toContainText("Solde initial déclaré à l'ouverture");

    // Cumuls et solde de fin de Mai (120 000 Ar débiteur)
    await expect(page.getByTestId('cumul-debit')).toContainText('150 000,00 Ar');
    await expect(page.getByTestId('cumul-credit')).toContainText('30 000,00 Ar');
    await expect(page.getByTestId('solde-debiteur-fin')).toContainText('+120 000,00 Ar');
  });

  test('permet d’accéder à la situation comptable depuis la saisie G58 via le bouton de raccourci', async ({ page }) => {
    // Totaux G58 mock
    await page.route('**/api/v1/mouvements/totaux/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          periode_gestion_id: 2,
          date_operation: null,
          totaux_sections: {},
          sous_sections_b: {},
          total_general_debit: '80000.00',
          total_general_credit: '50000.00',
          solde_net: '30000.00',
        }),
      });
    });

    await page.route('**/api/v1/sections-comptables/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [{ id: 1, code: 'A', libelle: 'Opérations postales', sens: 1, sens_libelle: 'Débit', actif: true, ordre: 1 }],
        }),
      });
    });

    await page.route(/\/api\/v1\/mouvements\/(?!\?.*totaux|\b(?:totaux)\b).*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      });
    });

    await page.goto('/saisie');

    // Cliquer sur le raccourci Situation comptable
    const situationBtn = page.getByTestId('link-to-situation');
    await expect(situationBtn).toBeVisible();
    await situationBtn.click();

    // Doit naviguer vers /situation-comptable
    await expect(page).toHaveURL(/\/situation-comptable/);
    await expect(page.getByRole('heading', { name: 'Situation comptable mensuelle' })).toBeVisible();
  });

  test('permet de télécharger le bordereau officiel Journal G58 en PDF depuis la situation comptable', async ({ page }) => {
    let pdfRequested = false;

    await page.route('**/api/v1/bordereau-g58/2/pdf/**', async (route) => {
      pdfRequested = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: {
          'Content-Disposition': 'inline; filename="Bordereau_G58_10101_2026-06-01.pdf"',
        },
        body: Buffer.from('%PDF-1.4 mock pdf from situation comptable'),
      });
    });

    await page.goto('/situation-comptable');

    // Vérifier et cliquer sur le bouton de téléchargement PDF
    const downloadBtn = page.getByTestId('btn-download-bordereau-g58');
    await expect(downloadBtn).toBeVisible();
    await expect(downloadBtn).toContainText('Bordereau G58 (PDF)');

    await downloadBtn.click();
    await expect.poll(() => pdfRequested).toBe(true);
  });

  test('permet d’exporter la balance et les écritures en classeur Excel (.xlsx)', async ({ page }) => {
    let excelRequested = false;

    await page.route('**/api/v1/mouvements/export-excel/**', async (route) => {
      excelRequested = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers: {
          'Content-Disposition': 'attachment; filename="Journal_G58_10101_2026-06-01.xlsx"',
        },
        body: Buffer.from('mock excel spreadsheet binary data from situation comptable'),
      });
    });

    await page.goto('/situation-comptable');

    // Vérifier et cliquer sur le bouton Export Excel
    const excelBtn = page.getByTestId('btn-export-excel-situation');
    await expect(excelBtn).toBeVisible();
    await expect(excelBtn).toContainText('Export Excel');

    await excelBtn.click();
    await expect.poll(() => excelRequested).toBe(true);
  });
});
