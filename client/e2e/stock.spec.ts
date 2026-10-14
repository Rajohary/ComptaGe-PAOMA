import { test, expect } from '@playwright/test';

const MOCK_BUREAUX = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      ncodique: 10101,
      nom_bureau: 'Antaninarenina',
      classe: 'R1',
      province: 1,
      province_nom: 'Antananarivo',
      actif: true,
    },
  ],
};

const MOCK_PERIODES = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
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
  ],
};

const MOCK_PRODUITS = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      nom: "Timbre d'affranchissement 500 Ar",
      categorie: 'VP',
      categorie_libelle: 'Valeurs postales (timbres, aérogrammes…)',
      valeur_faciale: '500.00',
      actif: true,
    },
    {
      id: 2,
      nom: 'Timbre fiscal 2 000 Ar',
      categorie: 'TF',
      categorie_libelle: 'Timbres fiscaux',
      valeur_faciale: '2000.00',
      actif: true,
    },
  ],
};

const MOCK_STOCKS = [
  {
    id: 1,
    bureau: 1,
    bureau_detail: {
      id: 1,
      ncodique: 10101,
      nom_bureau: 'Antaninarenina',
      classe: 'R1',
    },
    periode_gestion: 1,
    periode_detail: {
      id: 1,
      nom_receveur: 'Rakoto Jean',
      date_debut: '2026-06-01',
      date_fin: '2026-06-30',
      cloturee: false,
    },
    produit: 1,
    produit_detail: {
      id: 1,
      nom: "Timbre d'affranchissement 500 Ar",
      categorie: 'VP',
      categorie_libelle: 'Valeurs postales (timbres, aérogrammes…)',
      valeur_faciale: '500.00',
      actif: true,
    },
    quantite_initiale: 100,
    quantite_recue: 50,
    quantite_vendue: 30,
    quantite_finale: 120,
    valeur_initiale: '50000.00',
    valeur_recue: '25000.00',
    valeur_vendue: '15000.00',
    valeur_finale: '60000.00',
    created_at: '2026-10-14T11:45:00Z',
    updated_at: '2026-10-14T11:45:00Z',
  },
];

const MOCK_RECAP = {
  total_valeur_initiale: 50000.0,
  total_valeur_recue: 25000.0,
  total_valeur_vendue: 15000.0,
  total_valeur_finale: 60000.0,
  total_quantite_initiale: 100,
  total_quantite_recue: 50,
  total_quantite_vendue: 30,
  total_quantite_finale: 120,
  nb_lignes: 1,
};

test.describe('Section 7 — Stock de valeurs postales et timbres fiscaux (Tableau A G58)', () => {
  test.beforeEach(async ({ page }) => {
    // Intercepter auth receveur
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

    // Intercepter bureaux
    await page.route('**/api/v1/bureaux/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BUREAUX),
      });
    });

    // Intercepter périodes
    await page.route('**/api/v1/periodes-gestion/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PERIODES),
      });
    });

    // Intercepter produits postaux
    await page.route('**/api/v1/produits-postaux/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PRODUITS),
      });
    });

    // Intercepter récapitulatif (doit être intercepté avant le catch-all stocks-valeurs)
    await page.route('**/api/v1/stocks-valeurs/recapitulatif/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_RECAP),
      });
    });

    // Intercepter stocks valeurs
    await page.route('**/api/v1/stocks-valeurs/**', async (route) => {
      const url = route.request().url();
      if (url.includes('recapitulatif')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_RECAP),
        });
        return;
      }

      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newStock = {
          id: 2,
          bureau: body.bureau,
          periode_gestion: body.periode_gestion,
          produit: body.produit,
          produit_detail: MOCK_PRODUITS.results.find((p) => p.id === body.produit),
          quantite_initiale: body.quantite_initiale,
          quantite_recue: body.quantite_recue,
          quantite_vendue: body.quantite_vendue,
          quantite_finale: body.quantite_initiale + body.quantite_recue - body.quantite_vendue,
          valeur_initiale: (body.quantite_initiale * 500).toFixed(2),
          valeur_recue: (body.quantite_recue * 500).toFixed(2),
          valeur_vendue: (body.quantite_vendue * 500).toFixed(2),
          valeur_finale: ((body.quantite_initiale + body.quantite_recue - body.quantite_vendue) * 500).toFixed(2),
        };
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newStock),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: MOCK_STOCKS.length,
          next: null,
          previous: null,
          results: MOCK_STOCKS,
        }),
      });
    });

    // Injecter token de session
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock_token_receveur');
    });
  });

  test('affiche l’écran de stock, la synthèse financière et la table des mouvements', async ({ page }) => {
    await page.goto('/stock');

    // Vérifier le titre institutionnel
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Stock de valeurs postales & timbres'
    );

    // Vérifier les cartes de synthèse financière
    const recapSection = page.getByTestId('stock-recap-cards');
    await expect(recapSection).toBeVisible();
    await expect(recapSection.getByText(/50\s*000/)).toBeVisible(); // Existant initial
    await expect(recapSection.getByText(/\+25\s*000/)).toBeVisible(); // Approvisionnements
    await expect(recapSection.getByText(/-15\s*000/)).toBeVisible(); // Ventes
    await expect(recapSection.getByText(/60\s*000/)).toBeVisible(); // Stock final

    // Vérifier la ligne de stock dans le tableau
    const stockRow = page.getByTestId('stock-row-1');
    await expect(stockRow).toBeVisible();
    await expect(stockRow).toContainText("Timbre d'affranchissement 500 Ar");
    await expect(stockRow).toContainText('100');
    await expect(stockRow).toContainText('+50');
    await expect(stockRow).toContainText('-30');
    await expect(stockRow).toContainText('120');
  });


  test('permet d’ouvrir la modale de saisie et calcule en direct les quantités et montants MGA', async ({ page }) => {
    await page.goto('/stock');

    await page.getByRole('button', { name: 'Saisir une ligne' }).click();

    // Vérifier le titre de la modale
    await expect(page.getByRole('heading', { name: 'Saisir un mouvement de stock' })).toBeVisible();

    // Remplir les quantités
    await page.locator('#stock-qte-init').fill('200');
    await page.locator('#stock-qte-recue').fill('100');
    await page.locator('#stock-qte-vendue').fill('50');

    // Vérifier le calcul en direct (200 + 100 - 50 = 250 unités)
    // Vérifier les valeurs financières calculées en direct
    await expect(page.getByTestId('live-val-initiale')).toContainText('100');
    await expect(page.getByTestId('live-val-vendue')).toContainText('25');
    await expect(page.getByTestId('live-val-finale')).toContainText('125');

    // Enregistrer
    await page.getByRole('button', { name: 'Enregistrer l’écriture' }).click();

    // La modale doit se fermer après succès
    await expect(page.getByRole('heading', { name: 'Saisir un mouvement de stock' })).not.toBeVisible();

  });

  test('bloque la validation si la quantité vendue excède le stock disponible', async ({ page }) => {
    await page.goto('/stock');

    await page.getByRole('button', { name: 'Saisir une ligne' }).click();

    await page.locator('#stock-qte-init').fill('10');
    await page.locator('#stock-qte-recue').fill('10');
    // Vente supérieure au total disponible (100 > 20)
    await page.locator('#stock-qte-vendue').fill('100');

    await page.getByRole('button', { name: 'Enregistrer l’écriture' }).click();

    // Vérifier le message de validation Zod sous le champ
    await expect(
      page.getByText('La quantité vendue ne peut pas dépasser le stock disponible')
    ).toBeVisible();
  });
});
