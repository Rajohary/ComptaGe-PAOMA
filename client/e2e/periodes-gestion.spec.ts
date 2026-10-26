import { test, expect } from '@playwright/test';

test.describe('Périodes de gestion (Référentiel)', () => {
  test.beforeEach(async ({ page }) => {
    // Intercepter les bureaux pour le formulaire d'ouverture
    await page.route('**/api/v1/bureaux/**', async (route) => {
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
              ncodique: 10101,
              nom_bureau: 'Antaninarenina',
              classe: 'R1',
              ccp: '10020',
            },
          ],
        }),
      });
    });

    // Intercepter les périodes de gestion
    await page.route('**/api/v1/periodes-gestion/**', async (route) => {
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
                bureau: 1,
                bureau_detail: {
                  id: 1,
                  ncodique: 10101,
                  nom_bureau: 'Antaninarenina',
                  classe: 'R1',
                },
                receveur: 2,
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
          }),
        });
      } else if (route.request().method() === 'POST') {
        const url = route.request().url();
        if (url.includes('/cloturer/')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 1,
              bureau: 1,
              bureau_detail: {
                id: 1,
                ncodique: 10101,
                nom_bureau: 'Antaninarenina',
                classe: 'R1',
              },
              receveur: 2,
              nom_receveur: 'Rakoto Jean',
              date_debut: '2026-06-01',
              date_fin: '2026-06-30',
              reserve_numeraire: '500000.00',
              valeurs_postales: '250000.00',
              timbres_fiscaux: '100000.00',
              solde_debiteur_depart: '0.00',
              solde_crediteur_depart: '0.00',
              cloturee: true,
              date_cloture: '2026-06-30T17:00:00Z',
            }),
          });
        } else {
          const body = route.request().postDataJSON();
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 2,
              ...body,
              bureau_detail: {
                id: body.bureau,
                ncodique: 10101,
                nom_bureau: 'Antaninarenina',
                classe: 'R1',
              },
              cloturee: false,
              date_cloture: null,
            }),
          });
        }
      } else {
        await route.continue();
      }
    });
  });

  test('affiche la liste des périodes et les montants d’inventaire', async ({ page }) => {
    await page.goto('/periodes-gestion');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Périodes de Gestion (Journal G58)');
    await expect(page.getByText('Rakoto Jean')).toBeVisible();
    await expect(page.getByText('Antaninarenina')).toBeVisible();
    await expect(page.getByText(/500\s?000,00\s?MGA/)).toBeVisible();
    await expect(page.getByText('En cours')).toBeVisible();
  });

  test('permet d’ouvrir le formulaire d’ouverture et calcule le total live de l’inventaire initial', async ({ page }) => {
    await page.goto('/periodes-gestion');

    await page.getByRole('button', { name: /Ouvrir une période/i }).click();

    await expect(page.getByRole('heading', { name: /Ouverture d'une période de gestion/i })).toBeVisible();

    // Remplir les montants de l'inventaire initial
    const numeraireInput = page.locator('input[name="reserve_numeraire"]');
    await numeraireInput.fill('100000');

    const valeursInput = page.locator('input[name="valeurs_postales"]');
    await valeursInput.fill('50000');

    const timbresInput = page.locator('input[name="timbres_fiscaux"]');
    await timbresInput.fill('25000');

    // Vérifier que le total live est calculé (175 000,00 MGA)
    await expect(page.getByText(/175\s?000,00\s?MGA/)).toBeVisible();
  });

  test('associe les erreurs de validation renvoyées par le backend aux champs correspondants', async ({ page }) => {
    await page.route('**/api/v1/periodes-gestion/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            nom_receveur: ['Le nom du receveur est invalide.'],
            timbres_fiscaux: ['Le montant des timbres fiscaux doit être un montant positif ou nul.'],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/periodes-gestion');

    await page.getByRole('button', { name: /Ouvrir une période/i }).click();

    await page.getByLabel(/Nom du receveur gestionnaire/i).fill('Rakoto Jean');
    await page.locator('input[name="date_debut"]').fill('2026-06-01');

    await page.locator('input[name="reserve_numeraire"]').fill('500000');
    await page.locator('input[name="valeurs_postales"]').fill('250000');
    await page.locator('input[name="timbres_fiscaux"]').fill('100000');

    await page.getByRole('button', { name: /Ouvrir la période de gestion/i }).click();

    // Vérifier que les messages d'erreurs serveur apparaissent sous les bons champs
    await expect(page.getByText('Le nom du receveur est invalide.')).toBeVisible();
    await expect(page.getByText('Le montant des timbres fiscaux doit être un montant positif ou nul.')).toBeVisible();

    // La modale reste ouverte pour permettre la correction
    await expect(page.getByRole('heading', { name: /Ouverture d'une période de gestion/i })).toBeVisible();
  });


  test('permet de clôturer officiellement une période de gestion', async ({ page }) => {
    await page.goto('/periodes-gestion');

    // Cliquer sur le bouton Clôturer de la période en cours
    await page.getByRole('button', { name: /Clôturer/i }).click();

    // La boîte de dialogue solennelle de clôture doit s'afficher
    await expect(page.getByRole('heading', { name: /Clôture officielle de la période de gestion/i })).toBeVisible();
    await expect(page.getByText(/Action définitive de clôture comptable/i)).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Antaninarenina')).toBeVisible();

    // Confirmer la clôture
    await page.getByRole('button', { name: /Confirmer la clôture officielle/i }).click();

    // La boîte de dialogue doit se fermer
    await expect(page.getByRole('heading', { name: /Clôture officielle de la période de gestion/i })).not.toBeVisible();
  });
});

