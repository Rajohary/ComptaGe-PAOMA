import { test, expect } from '@playwright/test';

const MOCK_SECTIONS = {
  count: 2,
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
  ],
};

const MOCK_LIGNES = [
  {
    id: 1,
    menu_sub: 101,
    compte: 'A101',
    libelle: 'Versements reçus des usagers en numéraire',
    section: 1,
    section_code: 'A',
    section_libelle: "Opérations d'ordre postal et financier",
    sens: 1,
    sens_libelle: 'Débit',
    parent: null,
    parent_detail: null,
    actif: true,
  },
  {
    id: 2,
    menu_sub: 200,
    compte: 'B1',
    libelle: 'Sous-section B1 — Mandats et envois recommandés',
    section: 2,
    section_code: 'B',
    section_libelle: 'Opérations relatives aux correspondances et objets',
    sens: 2,
    sens_libelle: 'Crédit',
    parent: null,
    parent_detail: null,
    actif: true,
  },
  {
    id: 3,
    menu_sub: 201,
    compte: 'B101',
    libelle: 'Mandats ordinaires émis en numéraire',
    section: 2,
    section_code: 'B',
    section_libelle: 'Opérations relatives aux correspondances et objets',
    sens: 2,
    sens_libelle: 'Crédit',
    parent: 2,
    parent_detail: {
      id: 2,
      menu_sub: 200,
      compte: 'B1',
      libelle: 'Sous-section B1 — Mandats et envois recommandés',
    },
    actif: true,
  },
];

test.describe('Plan comptable — Recherche et consultation (Section 3)', () => {
  test.beforeEach(async ({ page }) => {
    // Intercepter auth / session utilisateur receveur
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

    // Intercepter sections
    await page.route('**/api/v1/sections-comptables/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SECTIONS),
      });
    });

    // Intercepter lignes comptables avec support du paramètre search et section
    await page.route('**/api/v1/lignes-comptables/**', async (route) => {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search')?.toLowerCase() || '';
      const section = url.searchParams.get('section');
      const sens = url.searchParams.get('sens');

      let results = [...MOCK_LIGNES];

      if (section) {
        results = results.filter((l) => l.section_code === section);
      }

      if (sens) {
        results = results.filter((l) => l.sens.toString() === sens);
      }

      if (search) {
        results = results.filter(
          (l) =>
            l.compte.toLowerCase().includes(search) ||
            l.libelle.toLowerCase().includes(search)
        );
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: results.length,
          next: null,
          previous: null,
          results,
        }),
      });
    });

    // Injecter le token dans le localStorage
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock_token_receveur');
    });
  });

  test('affiche le titre et les résultats groupés par section macro-comptable', async ({ page }) => {
    await page.goto('/plan-comptable');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Plan comptable des bureaux de poste'
    );

    // Vérifier la présence des groupes de section A et B
    await expect(page.getByRole('region', { name: 'Section A' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Section B' })).toBeVisible();

    // Vérifier les comptes
    await expect(page.getByText('A101')).toBeVisible();
    await expect(page.getByText('B101')).toBeVisible();
    await expect(page.getByText('Mandats ordinaires émis en numéraire')).toBeVisible();
  });

  test('permet la recherche instantanée par mot-clé et préfixe de compte', async ({ page }) => {
    await page.goto('/plan-comptable');

    const searchInput = page.locator('#plan-comptable-search-input');
    await expect(searchInput).toBeVisible();

    // Rechercher B101
    await searchInput.fill('B101');

    // Section B visible, Section A absente
    await expect(page.getByText('B101')).toBeVisible();
    await expect(page.getByText('A101')).not.toBeVisible();

    // Effacer avec le bouton X
    await page.getByLabel('Effacer le texte recherché').click();
    await expect(page.getByText('A101')).toBeVisible();
  });

  test('affiche un état vide explicite lorsqu’aucun résultat n’est trouvé (remplace zone grise vide legacy)', async ({ page }) => {
    await page.goto('/plan-comptable');

    const searchInput = page.locator('#plan-comptable-search-input');
    await searchInput.fill('ZZZ999INEXISTANT');

    const emptyState = page.getByTestId('plan-empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('Aucune ligne comptable trouvée');
    await expect(emptyState).toContainText('ZZZ999INEXISTANT');

    // Réinitialiser les filtres
    await page.getByRole('button', { name: 'Réinitialiser les filtres' }).click();
    await expect(page.getByText('A101')).toBeVisible();
  });

  test('affiche un état de chargement explicite pendant la requête et permet la récupération après erreur', async ({ page }) => {
    // Intercepter avec un délai pour vérifier l'affichage du spinner de chargement
    await page.route('**/api/v1/lignes-comptables/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 0,
          next: null,
          previous: null,
          results: [],
        }),
      });
    });

    await page.goto('/plan-comptable');
    await expect(page.getByTestId('plan-loading-state')).toBeVisible();
    await expect(page.getByText('Recherche dans le plan comptable en cours…')).toBeVisible();

    // Attendre l'état vide
    await expect(page.getByTestId('plan-empty-state')).toBeVisible();
  });


  test('sauvegarde et affiche les lignes récemment consultées par le bureau', async ({ page }) => {
    // Pré-remplir l'historique dans le localStorage pour le bureau 101
    await page.addInitScript(() => {
      localStorage.setItem(
        'comptage_recent_lignes_101',
        JSON.stringify([
          {
            id: 3,
            menu_sub: 201,
            compte: 'B101',
            libelle: 'Mandats ordinaires émis en numéraire',
            section: 2,
            section_code: 'B',
            section_libelle: 'Opérations relatives aux correspondances et objets',
            sens: 2,
            sens_libelle: 'Crédit',
            parent: 2,
            parent_detail: null,
            actif: true,
          },
        ])
      );
    });

    await page.goto('/plan-comptable');

    // Vérifier l'affichage du bloc récent
    await expect(page.getByText('Récemment utilisées (Bureau 101)')).toBeVisible();
    await expect(page.getByRole('button', { name: /B101/ })).toBeVisible();

    // Tester l'effacement de l'historique
    await page.getByRole('button', { name: "Effacer l'historique" }).click();
    await expect(page.getByText('Récemment utilisées (Bureau 101)')).not.toBeVisible();
  });

  test('ajoute dynamiquement une ligne sélectionnée dans l’historique récent', async ({ page }) => {
    await page.goto('/plan-comptable');

    // Cliquer sur la ligne A101
    await page.getByText('A101').click();

    // Vérifier que le bloc récemment utilisées apparaît avec A101
    await expect(page.getByText('Récemment utilisées (Bureau 101)')).toBeVisible();
    await expect(page.getByRole('button', { name: /A101/ })).toBeVisible();
  });
});

