import { test, expect } from '@playwright/test';

const MOCK_PERIODES = {
  count: 2,
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
    {
      id: 2,
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

const MOCK_RUBRIQUES = {
  count: 3,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      rubrique_parent: 1,
      parent_libelle: 'ENCAISSE ET VALEURS',
      menu_sub: 1,
      compte: 'TR',
      libelle: 'Trésorerie et espèces physiques (billets et pièces)',
    },
    {
      id: 2,
      rubrique_parent: 1,
      parent_libelle: 'ENCAISSE ET VALEURS',
      menu_sub: 2,
      compte: 'SF',
      libelle: 'Stock final de timbres et valeurs postales',
    },
    {
      id: 3,
      rubrique_parent: 1,
      parent_libelle: 'ENCAISSE ET VALEURS',
      menu_sub: 3,
      compte: 'CR',
      libelle: 'Créances diverses et bons de trésor',
    },
  ],
};

test.describe('Section 4 — Écran Détails de l’encaisse', () => {
  let createdMouvementsEncaisse: any[] = [];

  test.beforeEach(async ({ page }) => {
    createdMouvementsEncaisse = [
      {
        id: 1,
        periode_gestion: 1,
        rubrique_encaisse: 1,
        rubrique_detail: MOCK_RUBRIQUES.results[0],
        sens: 1,
        sens_libelle: 'Entrée',
        date_operation: '2026-06-05',
        montant: '150000.00',
        saisi_par: 1,
        saisi_par_username: 'receveur1',
        created_at: '2026-06-05T09:00:00Z',
        updated_at: '2026-06-05T09:00:00Z',
      },
      {
        id: 2,
        periode_gestion: 1,
        rubrique_encaisse: 1,
        rubrique_detail: MOCK_RUBRIQUES.results[0],
        sens: 2,
        sens_libelle: 'Sortie',
        date_operation: '2026-06-10',
        montant: '50000.00',
        saisi_par: 1,
        saisi_par_username: 'receveur1',
        created_at: '2026-06-10T14:00:00Z',
        updated_at: '2026-06-10T14:00:00Z',
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

    // Rubriques encaisse
    await page.route('**/api/v1/rubriques-encaisse/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_RUBRIQUES),
      });
    });

    // Mouvements encaisse
    await page.route('**/api/v1/mouvements-encaisse/**', async (route) => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const rubric = MOCK_RUBRIQUES.results.find((r) => r.id === Number(body.rubrique_encaisse));
        const newMvt = {
          id: createdMouvementsEncaisse.length + 1,
          periode_gestion: Number(body.periode_gestion),
          rubrique_encaisse: Number(body.rubrique_encaisse),
          rubrique_detail: rubric,
          sens: Number(body.sens),
          sens_libelle: Number(body.sens) === 1 ? 'Entrée' : 'Sortie',
          date_operation: body.date_operation,
          montant: body.montant,
          saisi_par: 1,
          saisi_par_username: 'receveur1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        createdMouvementsEncaisse.push(newMvt);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newMvt),
        });
        return;
      }

      if (route.request().method() === 'PATCH') {
        const url = route.request().url();
        const idMatch = url.match(/mouvements-encaisse\/(\d+)\//);
        if (idMatch) {
          const updateId = Number(idMatch[1]);
          const body = JSON.parse(route.request().postData() || '{}');
          const mvt = createdMouvementsEncaisse.find((m) => m.id === updateId);
          if (mvt) {
            if (body.montant) mvt.montant = body.montant;
            if (body.date_operation) mvt.date_operation = body.date_operation;
            if (body.sens) {
              mvt.sens = Number(body.sens);
              mvt.sens_libelle = Number(body.sens) === 1 ? 'Entrée' : 'Sortie';
            }
            if (body.rubrique_encaisse) {
              mvt.rubrique_encaisse = Number(body.rubrique_encaisse);
              mvt.rubrique_detail = MOCK_RUBRIQUES.results.find((r) => r.id === mvt.rubrique_encaisse);
            }
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(mvt),
            });
            return;
          }
        }
      }

      if (route.request().method() === 'DELETE') {
        const url = route.request().url();
        const idMatch = url.match(/mouvements-encaisse\/(\d+)\//);
        if (idMatch) {
          const deleteId = Number(idMatch[1]);
          createdMouvementsEncaisse = createdMouvementsEncaisse.filter((m) => m.id !== deleteId);
        }
        await route.fulfill({ status: 204 });
        return;
      }

      // GET
      const url = new URL(route.request().url());
      const sensParam = url.searchParams.get('sens');
      let filtered = [...createdMouvementsEncaisse];
      if (sensParam) {
        filtered = filtered.filter((m) => m.sens === Number(sensParam));
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

    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock_token_receveur');
    });
  });

  test('affiche l’écran de suivi de l’encaisse, les cartes financières et la table des flux', async ({ page }) => {
    await page.goto('/encaisse');

    // Vérifier le titre
    await expect(page.getByRole('heading', { name: 'Détails de l’encaisse' })).toBeVisible();

    // Vérifier les 4 cartes statistiques :
    // Réserve départ = 500 000,00 Ar
    const reserveCard = page.getByTestId('stat-reserve-initiale');
    await expect(reserveCard).toContainText('500 000,00');

    // Total Entrées = 150 000,00 Ar
    const entreesCard = page.getByTestId('stat-total-entrees');
    await expect(entreesCard).toContainText('+150 000,00');

    // Total Sorties = 50 000,00 Ar
    const sortiesCard = page.getByTestId('stat-total-sorties');
    await expect(sortiesCard).toContainText('-50 000,00');

    // Solde théorique = 500 000 + 150 000 - 50 000 = 600 000,00 Ar
    const soldeCard = page.getByTestId('stat-solde-theorique');
    await expect(soldeCard).toContainText('600 000,00');

    // Vérifier les lignes dans le tableau
    const row1 = page.getByTestId('encaisse-row-1');
    await expect(row1).toBeVisible();
    await expect(row1).toContainText('TR');
    await expect(row1).toContainText('Entrée');
    await expect(row1).toContainText('+150 000,00 Ar');

    const row2 = page.getByTestId('encaisse-row-2');
    await expect(row2).toBeVisible();
    await expect(row2).toContainText('Sortie');
    await expect(row2).toContainText('-50 000,00 Ar');
  });

  test('permet d’enregistrer une nouvelle entrée de caisse via le formulaire modal', async ({ page }) => {
    await page.goto('/encaisse');

    // Ouvrir la modale
    await page.getByTestId('open-encaisse-modal-btn').click();
    await expect(page.getByRole('heading', { name: 'Enregistrer un mouvement d’encaisse' })).toBeVisible();

    // Remplir le formulaire
    await page.locator('#encaisse-date').fill('2026-06-15');
    await page.locator('#encaisse-montant').fill('75000');

    // Soumettre
    await page.getByTestId('submit-encaisse-btn').click();

    // Vérifier que la modale se ferme et que la nouvelle ligne apparaît
    await expect(page.getByTestId('encaisse-row-3')).toBeVisible();
    await expect(page.getByText('+75 000,00 Ar')).toBeVisible();

    // Le solde théorique passe à 600 000 + 75 000 = 675 000,00 Ar
    await expect(page.getByTestId('stat-solde-theorique')).toContainText('675 000,00');
  });

  test('valide les contraintes Zod côté client (montant négatif ou date hors période)', async ({ page }) => {
    await page.goto('/encaisse');

    // Ouvrir la modale
    await page.getByTestId('open-encaisse-modal-btn').click();

    // Saisir une date hors de la période de juin
    await page.locator('#encaisse-date').fill('2026-07-20');
    await page.locator('#encaisse-montant').fill('-1000');

    await page.getByTestId('submit-encaisse-btn').click();

    // Messages d'erreur attendus
    await expect(
      page.getByText(/La date d'opération doit être comprise dans la période active/)
    ).toBeVisible();
    await expect(
      page.getByText('Le montant doit être strictement supérieur à zéro')
    ).toBeVisible();
  });

  test('affiche les cartes de répartition analytique par rubrique (TR, SF, CR)', async ({ page }) => {
    await page.goto('/encaisse');

    const container = page.getByTestId('repartition-rubriques-container');
    await expect(container).toBeVisible();

    // Vérifier la présence de la carte TR (Trésorerie et espèces)
    const cardTR = page.getByTestId('rubrique-card-TR');
    await expect(cardTR).toBeVisible();
    await expect(cardTR).toContainText('TR');
    await expect(cardTR).toContainText('2 flux');
    await expect(cardTR).toContainText('+150 000,00 Ar'); // Entrée
    await expect(cardTR).toContainText('-50 000,00 Ar');  // Sortie
    await expect(cardTR).toContainText('+100 000,00 Ar'); // Solde net
  });

  test('permet de modifier un mouvement existant via la modale d’édition', async ({ page }) => {
    await page.goto('/encaisse');

    // Cliquer sur le bouton d'édition de la ligne 1
    const editBtn = page.getByTestId('edit-encaisse-btn-1');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // La modale doit s'ouvrir en mode modification avec les valeurs préremplies (formatées avec séparateur de milliers)
    await expect(page.getByRole('heading', { name: 'Modifier le mouvement d’encaisse' })).toBeVisible();
    const montantInput = page.locator('#encaisse-montant');
    await expect(montantInput).toHaveValue('150 000');

    // Mettre à jour le montant à 180 000 Ar
    await montantInput.fill('180000');
    await page.getByTestId('submit-encaisse-btn').click();

    // La table doit afficher le montant mis à jour
    const row1 = page.getByTestId('encaisse-row-1');
    await expect(row1).toContainText('+180 000,00 Ar');

    // Le solde théorique passe à 500 000 + 180 000 - 50 000 = 630 000,00 Ar
    await expect(page.getByTestId('stat-solde-theorique')).toContainText('630 000,00');
  });

  test('filtre instantanément les flux grâce aux pastilles rapides de sens', async ({ page }) => {
    await page.goto('/encaisse');

    const quickFilters = page.getByTestId('quick-sens-filters');
    await expect(quickFilters).toBeVisible();

    // Cliquer sur la pastille "Entrées"
    await quickFilters.getByRole('button', { name: 'Entrées' }).click();
    await expect(page.getByTestId('encaisse-row-1')).toBeVisible();
    await expect(page.getByTestId('encaisse-row-2')).not.toBeVisible();

    // Cliquer sur la pastille "Sorties"
    await quickFilters.getByRole('button', { name: 'Sorties' }).click();
    await expect(page.getByTestId('encaisse-row-2')).toBeVisible();
    await expect(page.getByTestId('encaisse-row-1')).not.toBeVisible();

    // Revenir à "Tous"
    await quickFilters.getByRole('button', { name: 'Tous' }).click();
    await expect(page.getByTestId('encaisse-row-1')).toBeVisible();
    await expect(page.getByTestId('encaisse-row-2')).toBeVisible();
  });
});
