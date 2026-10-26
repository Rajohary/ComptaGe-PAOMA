import { test, expect } from '@playwright/test';

test.describe('Historique des périodes de gestion et passations d’un bureau', () => {
  test.beforeEach(async ({ page }) => {
    // Intercepter la session /auth/me/ en tant qu'ADMIN
    await page.route('**/api/v1/auth/me/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          username: 'admin_test',
          email: 'admin@paoma.mg',
          first_name: 'Admin',
          last_name: 'Test',
          role: 'ADMIN',
          syst_fonc: 'ADM01',
          bureau_code: null,
        }),
      });
    });

    // Intercepter la liste des bureaux
    await page.route('**/api/v1/bureaux/**', async (route) => {
      if (route.request().url().includes('/historique-periodes/')) {
        // Intercepter l'historique des périodes
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            bureau: {
              id: 47,
              ncodique: 11916,
              nom_bureau: 'Tsiroanomandidy',
              classe: 'R3',
              ccp: '9377',
              province: 'Antananarivo',
            },
            total_periodes: 2,
            periodes_cloturees: 1,
            periode_en_cours: {
              id: 999,
              nom_receveur: 'VOLOLONIRINA Tit Lydia',
              date_debut: '2023-10-04',
              solde_debiteur_depart: '0.00',
              solde_crediteur_depart: '0.00',
              total_encaisse_depart: '85000000.00',
            },
            historique: [
              {
                id: 245,
                nom_receveur: 'RASOAMANAMBELO Philbertine',
                date_debut: '2009-07-25',
                date_fin: '2010-07-31',
                cloturee: true,
                date_cloture: '2010-07-31T17:00:00Z',
                solde_debiteur_depart: '27498826.79',
                solde_crediteur_depart: '0.00',
                reserve_numeraire: '30000000.00',
                valeurs_postales: '3600000.00',
                timbres_fiscaux: '0.00',
                total_encaisse_depart: '33600000.00',
                total_debit: '1500000.00',
                total_credit: '500000.00',
                solde_debiteur_fin: '28498826.79',
                solde_crediteur_fin: '0.00',
                nb_mouvements: 12,
              },
              {
                id: 999,
                nom_receveur: 'VOLOLONIRINA Tit Lydia',
                date_debut: '2023-10-04',
                date_fin: null,
                cloturee: false,
                date_cloture: null,
                solde_debiteur_depart: '0.00',
                solde_crediteur_depart: '0.00',
                reserve_numeraire: '80000000.00',
                valeurs_postales: '5000000.00',
                timbres_fiscaux: '0.00',
                total_encaisse_depart: '85000000.00',
                total_debit: '3200000.00',
                total_credit: '1200000.00',
                solde_debiteur_fin: '2000000.00',
                solde_crediteur_fin: '0.00',
                nb_mouvements: 5,
              },
            ],
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 2,
            next: null,
            previous: null,
            results: [
              {
                id: 47,
                province: 1,
                ncodique: 11916,
                nom_bureau: 'Tsiroanomandidy',
                classe: 'R3',
                ccp: '9377',
              },
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
      }
    });

    // Simuler le stockage auth
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock_token_admin');
    });
  });

  test('affiche l’écran d’historique avec informations du bureau, métriques et passations successives', async ({
    page,
  }) => {
    await page.goto('/historique-periodes?bureau=47');

    // Vérifier le conteneur principal
    await expect(page.getByTestId('historique-periodes-page')).toBeVisible();

    // Vérifier l'en-tête du bureau
    await expect(page.getByRole('heading', { name: 'Tsiroanomandidy' })).toBeVisible();
    await expect(page.getByText('Code 11916')).toBeVisible();
    await expect(page.getByText('Classe R3')).toBeVisible();

    // Vérifier le résumé des métriques
    await expect(page.getByText('Total périodes')).toBeVisible();
    await expect(page.getByText('VOLOLONIRINA Tit Lydia').first()).toBeVisible();
    await expect(page.getByText('RASOAMANAMBELO Philbertine')).toBeVisible();

    // Vérifier les lignes de tableau
    await expect(page.getByTestId('historique-row-245')).toBeVisible();
    await expect(page.getByTestId('historique-row-999')).toBeVisible();

    // Vérifier le badge en cours
    await expect(page.getByText('En cours').first()).toBeVisible();

    // Vérifier les boutons d'export PDF et Excel
    await expect(page.getByTestId('download-pdf-btn-245')).toBeVisible();
    await expect(page.getByTestId('export-excel-btn-245')).toBeVisible();
  });

  test('permet de filtrer instantanément les passations par receveur ou date', async ({
    page,
  }) => {
    await page.goto('/historique-periodes?bureau=47');

    const searchInput = page.getByTestId('search-historique-input');
    await expect(searchInput).toBeVisible();

    // Filtrer par Philbertine
    await searchInput.fill('Philbertine');
    await expect(page.getByTestId('historique-row-245')).toBeVisible();
    await expect(page.getByTestId('historique-row-999')).not.toBeVisible();

    // Effacer le filtre
    await searchInput.fill('');
    await expect(page.getByTestId('historique-row-245')).toBeVisible();
    await expect(page.getByTestId('historique-row-999')).toBeVisible();
  });

  test('navigue vers l’historique depuis la liste des périodes de gestion', async ({
    page,
  }) => {
    // Intercepter la liste des périodes pour PeriodesGestionPage
    await page.route('**/api/v1/periodes-gestion/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 245,
              bureau: 47,
              bureau_detail: {
                id: 47,
                ncodique: 11916,
                nom_bureau: 'Tsiroanomandidy',
                classe: 'R3',
              },
              nom_receveur: 'RASOAMANAMBELO Philbertine',
              date_debut: '2009-07-25',
              date_fin: '2010-07-31',
              reserve_numeraire: '30000000.00',
              valeurs_postales: '3600000.00',
              timbres_fiscaux: '0.00',
              solde_debiteur_depart: '27498826.79',
              solde_crediteur_depart: '0.00',
              cloturee: true,
              date_cloture: '2010-07-31T17:00:00Z',
            },
          ],
        }),
      });
    });

    await page.goto('/periodes-gestion');

    // Cliquer sur le bouton d'historique de la ligne
    const btnHist = page.getByTestId('btn-historique-periode-245');
    await expect(btnHist).toBeVisible();
    await btnHist.click();

    // Devrait rediriger vers /historique-periodes?bureau=47
    await expect(page).toHaveURL(/.*\/historique-periodes\?bureau=47/);
    await expect(page.getByTestId('historique-periodes-page')).toBeVisible();
  });
});
