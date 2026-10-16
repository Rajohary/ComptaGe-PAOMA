import { test, expect } from '@playwright/test';

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

const MOCK_SECTIONS = {
  count: 3,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      code: 'A',
      libelle: "Opérations d'ordre postal et financier",
      sens: 1,
      sens_libelle: 'Débit',
      actif: true,
      ordre: 1,
    },
    {
      id: 2,
      code: 'B',
      libelle: 'Opérations relatives aux correspondances et objets',
      sens: 2,
      sens_libelle: 'Crédit',
      actif: true,
      ordre: 2,
    },
    {
      id: 4,
      code: 'D',
      libelle: 'Opérations financières et mandats reçus',
      sens: 1,
      sens_libelle: 'Débit',
      actif: true,
      ordre: 4,
    },
  ],
};

const MOCK_LIGNES = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 10,
      menu_sub: 101,
      compte: 'A101',
      libelle: 'Versements usagers en numéraire',
      section: 1,
      section_code: 'A',
      sens: 1,
      sens_libelle: 'Débit',
      actif: true,
      parent: null,
      parent_detail: null,
    },
    {
      id: 23,
      menu_sub: 201,
      compte: 'B101',
      libelle: 'Mandats ordinaires émis en numéraire',
      section: 2,
      section_code: 'B',
      sens: 2,
      sens_libelle: 'Crédit',
      actif: true,
      parent: null,
      parent_detail: null,
    },
  ],
};

const MOCK_TOTAUX = {
  periode_gestion_id: 1,
  date_operation: null,
  totaux_sections: {
    A: {
      section_id: 1,
      code: 'A',
      libelle: "Opérations d'ordre postal et financier",
      sens: 1,
      sens_libelle: 'Débit',
      total_declare: '50000.00',
      total_rectifie: '50000.00',
    },
  },
  sous_sections_b: {},
  total_general_debit: '50000.00',
  total_general_credit: '0.00',
  solde_net: '50000.00',
};

test.describe('Section 4 — Saisie du Journal G58 & Composant SectionForm', () => {
  let createdMouvements: any[] = [];

  test.beforeEach(async ({ page }) => {
    createdMouvements = [
      {
        id: 1,
        periode_gestion: 1,
        ligne_comptable: 10,
        ligne_detail: MOCK_LIGNES.results[0],
        saisi_par: 1,
        saisi_par_username: 'receveur1',
        date_operation: '2026-06-15',
        montant: '50000.00',
        montant_rectifie: '50000.00',
        augmentation: '0.00',
        diminution: '0.00',
        motif_rectification: '',
        a_ecart: false,
      },
    ];

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
          bureau_code: 101,
        }),
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

    // Sections
    await page.route('**/api/v1/sections-comptables/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SECTIONS),
      });
    });

    // Lignes comptables
    await page.route('**/api/v1/lignes-comptables/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LIGNES),
      });
    });

    // Totaux G58
    await page.route('**/api/v1/mouvements/totaux/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TOTAUX),
      });
    });

    // Mouvements
    await page.route(/\/api\/v1\/mouvements\/(?!\?.*totaux|\b(?:totaux)\b).*/, async (route) => {
      if (route.request().url().includes('/totaux/')) {
        await route.fallback();
        return;
      }
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const m = {
          id: createdMouvements.length + 1,
          periode_gestion: body.periode_gestion,
          ligne_comptable: body.ligne_comptable,
          ligne_detail: MOCK_LIGNES.results.find((l) => l.id === body.ligne_comptable) || null,
          saisi_par: 1,
          saisi_par_username: 'receveur1',
          date_operation: body.date_operation,
          montant: body.montant,
          montant_rectifie: body.montant,
          augmentation: '0.00',
          diminution: '0.00',
          motif_rectification: '',
          a_ecart: false,
        };
        createdMouvements.push(m);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(m),
        });
        return;
      }

      const url = new URL(route.request().url());
      const section = url.searchParams.get('section');
      let filtered = [...createdMouvements];
      if (section) {
        filtered = filtered.filter((m) => m.ligne_detail?.section_code === section);
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: filtered.length,
          next: null,
          previous: null,
          results: filtered,
        }),
      });
    });

    // Token
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock_token_receveur');
    });
  });

  test('affiche l’écran de saisie G58, les onglets de sections (A, B, D) et les totaux consolidés', async ({ page }) => {
    await page.goto('/saisie');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Saisie du Journal G58');

    // Vérifier la présence des onglets A, B, D
    await expect(page.getByRole('tab', { name: /A/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /B/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /D/ })).toBeVisible();

    // Vérifier l'écriture existante dans la section A
    const row1 = page.getByTestId('mouvement-row-1');
    await expect(row1).toBeVisible();
    await expect(row1).toContainText('Versements usagers en numéraire');
    await expect(row1).toContainText('50 000,00 Ar');
  });

  test('calcule en temps réel le total dans TotauxLive à chaque frappe dans le champ montant', async ({ page }) => {
    await page.goto('/saisie');

    // Vérifier le total initial de la section A (50 000 Ar existant)
    const liveCard = page.getByTestId('totaux-live-card');
    await expect(liveCard).toBeVisible();
    await expect(liveCard.getByTestId('live-section-sum')).toContainText('50');

    // Saisir un montant sans soumettre
    const montantInput = page.locator('#g58-montant');
    await montantInput.fill('15000');

    // Le total en direct doit immédiatement afficher 50 000 + 15 000 = 65 000 Ar
    await expect(liveCard.getByTestId('live-section-sum')).toContainText('65');

    // Modifier le montant à 25 000 -> total doit devenir 75 000 Ar
    await montantInput.fill('25000');
    await expect(liveCard.getByTestId('live-section-sum')).toContainText('75');

    // Vérifier les indicateurs globaux consolidés débits / crédits
    await expect(liveCard.getByTestId('live-total-debit')).toContainText('50 000,00 Ar');
    await expect(liveCard.getByTestId('live-total-credit')).toContainText('0,00 Ar');
    await expect(liveCard.getByTestId('live-solde-net')).toContainText('+50 000,00 Ar');

    // Effacer le montant en cours de saisie -> le total revient à 50 000 Ar
    await montantInput.fill('');
    await expect(liveCard.getByTestId('live-section-sum')).toContainText('50');
  });


  test('permet d’imputer une nouvelle écriture comptable via la recherche de ligne', async ({ page }) => {
    await page.goto('/saisie');

    // Ouvrir le sélecteur de recherche de compte
    await page.getByRole('button', { name: 'Rechercher un compte' }).click();

    // Sélectionner la ligne A101 dans les résultats de recherche
    await page.getByTestId('plan-results-container').getByText('A101').click();

    // Le libellé sélectionné doit être affiché dans le formulaire
    await expect(page.locator('form').getByText('Versements usagers en numéraire')).toBeVisible();

    // Remplir la date et le montant
    await page.locator('#g58-date-operation').fill('2026-06-20');
    await page.locator('#g58-montant').fill('30000');



    // Soumettre
    await page.getByRole('button', { name: 'Ajouter au Journal' }).click();

    // Vérifier l'apparition de la nouvelle écriture
    await expect(page.getByTestId('mouvement-row-2')).toBeVisible();
    await expect(page.getByText('30 000,00 Ar')).toBeVisible();
  });

  test('valide les contraintes Zod côté client (montant négatif ou date hors période)', async ({ page }) => {
    await page.goto('/saisie');

    // Ouvrir et sélectionner la ligne A101
    await page.getByRole('button', { name: 'Rechercher un compte' }).click();
    await page.getByTestId('plan-results-container').getByText('A101').click();

    // Saisir une date en dehors de la période (période du 2026-06-01 au 2026-06-30)
    await page.locator('#g58-date-operation').fill('2026-07-15');
    await page.locator('#g58-montant').fill('-500');

    await page.getByRole('button', { name: 'Ajouter au Journal' }).click();

    // Vérifier les messages d'erreur de validation Zod sous les champs
    await expect(
      page.getByText(/La date d'opération doit être comprise dans la période active/)
    ).toBeVisible();
    await expect(
      page.getByText('Le montant doit être un nombre strictement positif')
    ).toBeVisible();
  });

  test('associe et affiche les erreurs de validation renvoyées par le backend Django DRF', async ({ page }) => {
    // Simuler une réponse 400 DRF sur le POST mouvements
    await page.route('**/api/v1/mouvements/**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            ligne_comptable: ["La ligne 'B1' est un regroupement et ne peut recevoir d'imputation directe."],
            montant: ['Montant non conforme aux plafonds autorisés.'],
          }),
        });
        return;
      }
      route.fallback();
    });

    await page.goto('/saisie');

    // Sélectionner un compte
    await page.getByRole('button', { name: 'Rechercher un compte' }).click();
    await page.getByTestId('plan-results-container').getByText('A101').click();

    await page.locator('#g58-date-operation').fill('2026-06-15');
    await page.locator('#g58-montant').fill('10000');

    await page.getByRole('button', { name: 'Ajouter au Journal' }).click();

    // Vérifier que les erreurs retournées par Django sont attachées aux champs respectifs
    await expect(
      page.getByText("La ligne 'B1' est un regroupement et ne peut recevoir d'imputation directe.")
    ).toBeVisible();
    await expect(
      page.getByText('Montant non conforme aux plafonds autorisés.')
    ).toBeVisible();
  });

  test('parcours complet de saisie d’une section avec vérification du total affiché en temps réel', async ({ page }) => {
    await page.goto('/saisie');

    // 1. Basculer sur la Section B (Opérations correspondances & mandats - Crédit)
    const tabB = page.getByRole('tab', { name: /B/ });
    await expect(tabB).toBeVisible();
    await tabB.click();

    // Vérifier l'activation de la section B et son badge Crédit
    const liveCard = page.getByTestId('totaux-live-card');
    await expect(liveCard).toBeVisible();
    await expect(liveCard.getByRole('heading', { name: /Section B/ })).toBeVisible();
    await expect(liveCard.getByText('Crédit', { exact: true })).toBeVisible();

    // 2. Recherche et sélection de la ligne comptable B101
    await page.getByRole('button', { name: 'Rechercher un compte' }).click();
    await expect(page.getByTestId('plan-results-container')).toBeVisible();
    await page.getByTestId('plan-results-container').getByText('B101').click();

    // Vérifier que le compte sélectionné est affiché
    await expect(page.locator('form').getByText('Mandats ordinaires émis en numéraire')).toBeVisible();

    // 3. Vérification du calcul en temps réel pendant la frappe
    const montantInput = page.locator('#g58-montant');
    await expect(liveCard.getByTestId('live-section-sum')).toContainText('0');

    // Saisie progressive : 45 000 Ar
    await montantInput.pressSequentially('45000', { delay: 30 });
    await expect(liveCard.getByTestId('live-section-sum')).toContainText('45 000');

    // Remplir la date d'opération
    await page.locator('#g58-date-operation').fill('2026-06-18');

    // 4. Soumission de l'écriture
    await page.getByRole('button', { name: 'Ajouter au Journal' }).click();

    // 5. Vérifier que la nouvelle ligne apparaît immédiatement dans le tableau de la section B
    const row = page.getByTestId('mouvement-row-2');
    await expect(row).toBeVisible();
    await expect(row).toContainText('B101');
    await expect(row).toContainText('Mandats ordinaires émis en numéraire');
    await expect(row).toContainText('45 000,00 Ar');

    // 6. Vérifier que le champ de montant s'est vidé pour la prochaine saisie
    await expect(montantInput).toHaveValue('');
    // Le total cumulé de la section reste à 45 000 Ar grâce à l'écriture enregistrée
    await expect(liveCard.getByTestId('live-section-sum')).toContainText('45 000');
  });
});

