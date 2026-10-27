import { test, expect } from '@playwright/test';

test.describe('Gestion des bureaux de poste (Référentiel)', () => {
  test.beforeEach(async ({ page }) => {
    // Intercepter les appels API pour les tests e2e isolés du client
    await page.route('**/api/v1/provinces/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [{ id: 1, nprovince: 1, nom: 'Antananarivo' }],
        }),
      });
    });

    await page.route('**/api/v1/bureaux/**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 1,
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
                ccp: '10020',
                nbur: 1,
                codeclasse: 1,
                ncf: 1,
                cf_codik: 10101,
              },
            ],
          }),
        });
      } else if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 2,
            ...body,
            province_detail: { id: body.province, nprovince: body.province, nom: 'Antananarivo' },
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('affiche la liste des bureaux et les données existantes', async ({ page }) => {
    await page.goto('/bureaux');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Gestion des Bureaux de Poste');
    await expect(page.getByText('Antaninarenina')).toBeVisible();
    await expect(page.getByText('10101')).toBeVisible();
    await expect(page.getByText('R1')).toBeVisible();
  });

  test('permet d’ouvrir le formulaire de création et affiche la validation Zod', async ({ page }) => {
    await page.goto('/bureaux');

    await page.getByRole('button', { name: /Nouveau Bureau/i }).click();

    await expect(page.getByRole('heading', { name: /Créer un nouveau bureau/i })).toBeVisible();

    // Soumettre sans remplir pour déclencher la validation
    await page.getByRole('button', { name: /Créer le bureau/i }).click();

    await expect(page.getByText(/Le nom du bureau doit contenir au moins 2 caractères/i)).toBeVisible();
  });

  test('associe correctement les erreurs de validation renvoyées par le backend au champ de formulaire', async ({ page }) => {
    // Intercepter POST pour simuler une erreur de validation DRF
    await page.route('**/api/v1/bureaux/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            code_postal: ['Un bureau avec ce code postal existe déjà.'],
            nom_bureau: ['Ce nom de bureau est déjà utilisé dans cette province.'],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/bureaux');

    await page.getByRole('button', { name: /Nouveau Bureau/i }).click();

    await page.getByLabel(/Nom du bureau/i).fill('Antaninarenina');
    await page.getByLabel(/Code Postal/i).fill('10101');

    await page.getByRole('button', { name: /Créer le bureau/i }).click();

    // Vérifier que les messages d'erreurs du serveur s'affichent sous les bons champs
    await expect(page.getByText('Un bureau avec ce code postal existe déjà.')).toBeVisible();
    await expect(page.getByText('Ce nom de bureau est déjà utilisé dans cette province.')).toBeVisible();

    // La modale reste ouverte pour permettre la correction
    await expect(page.getByRole('heading', { name: /Créer un nouveau bureau/i })).toBeVisible();
  });
});
