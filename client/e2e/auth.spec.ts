import { test, expect } from '@playwright/test';

/**
 * Tests e2e du module Authentification & RBAC.
 * Conforme au contrat API défini dans API_CONTRACT.md.
 */

const RECEVEUR_USER = {
  id: 1,
  username: 'receveur1',
  first_name: 'Jean',
  last_name: 'Receveur',
  email: 'receveur1@comptage.local',
  role: 'RECEVEUR',
  syst_fonc: '01',
  bureau_code: 101,
};

const ADMIN_USER = {
  id: 2,
  username: 'admin1',
  first_name: 'Admin',
  last_name: 'Système',
  email: 'admin@comptage.local',
  role: 'ADMIN',
  syst_fonc: '',
  bureau_code: null,
};

test.describe('Authentification - Formulaire et validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    });
    await page.reload();
  });

  test('affiche le formulaire de connexion', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    await expect(page.locator('#login-username')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('#login-submit')).toBeVisible();
    await expect(page.locator('#login-submit')).toHaveText('Se connecter');
  });

  test('affiche les erreurs de validation champ vide', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#login-submit').click();

    await expect(page.locator('#username-error')).toBeVisible();
    await expect(page.locator('#password-error')).toBeVisible();
  });

  test('affiche une erreur avec des identifiants incorrects', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#login-username').fill('utilisateur_inexistant');
    await page.locator('#login-password').fill('motdepasse_faux');
    await page.locator('#login-submit').click();

    await expect(page.locator('#login-error')).toBeVisible({ timeout: 10000 });
  });

  test('redirige vers /login si non authentifié', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Connexion réussie et redirection selon rôle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    });
    await page.reload();
  });

  test('connexion receveur redirige vers /saisie', async ({ page }) => {
    // Mock de l'endpoint d'authentification conforme à API_CONTRACT.md
    await page.route('**/api/v1/auth/login/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          refresh: 'mock_refresh_token_receveur',
          access: 'mock_access_token_receveur',
          user: RECEVEUR_USER,
        }),
      });
    });

    await page.route('**/api/v1/auth/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(RECEVEUR_USER),
      });
    });

    await page.goto('/login');
    await page.locator('#login-username').fill('receveur1');
    await page.locator('#login-password').fill('StrongPass123!');
    await page.locator('#login-submit').click();

    // Redirection automatique vers /saisie
    await expect(page).toHaveURL(/\/saisie/, { timeout: 10000 });
    await expect(page.locator('#logout-button')).toBeVisible();
  });

  test('connexion admin redirige vers /admin', async ({ page }) => {
    await page.route('**/api/v1/auth/login/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          refresh: 'mock_refresh_token_admin',
          access: 'mock_access_token_admin',
          user: ADMIN_USER,
        }),
      });
    });

    await page.route('**/api/v1/auth/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ADMIN_USER),
      });
    });

    await page.goto('/login');
    await page.locator('#login-username').fill('admin1');
    await page.locator('#login-password').fill('AdminPass123!');
    await page.locator('#login-submit').click();

    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await expect(page.locator('#logout-button')).toBeVisible();
  });
});

test.describe('RBAC — visibilité des éléments selon le rôle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    });
    await page.reload();
  });

  test('un receveur ne voit pas le lien Audit dans la sidebar', async ({ page }) => {
    await page.route('**/api/v1/auth/login/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          refresh: 'mock_refresh_token_receveur',
          access: 'mock_access_token_receveur',
          user: RECEVEUR_USER,
        }),
      });
    });

    await page.route('**/api/v1/auth/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(RECEVEUR_USER),
      });
    });

    await page.goto('/login');
    await page.locator('#login-username').fill('receveur1');
    await page.locator('#login-password').fill('StrongPass123!');
    await page.locator('#login-submit').click();

    await expect(page).toHaveURL(/\/saisie/, { timeout: 10000 });

    // Le lien Audit ne doit pas être visible pour un receveur
    await expect(page.getByRole('link', { name: 'Audit & Écarts' })).not.toBeVisible();
    // Mais le lien Saisie G58 doit être visible
    await expect(page.getByRole('link', { name: 'Saisie G58' })).toBeVisible();
  });

  test('un receveur tentant d acceder à /audit est redirigé vers /non-autorise', async ({ page }) => {
    await page.route('**/api/v1/auth/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(RECEVEUR_USER),
      });
    });

    // Injecter le token dans le localStorage pour simuler une session active
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock_token_receveur');
    });

    await page.goto('/audit');
    await expect(page).toHaveURL(/\/non-autorise/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Accès non autorisé' })).toBeVisible();
  });

  test('déconnexion redirige vers /login', async ({ page }) => {
    await page.route('**/api/v1/auth/login/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          refresh: 'mock_refresh_token_receveur',
          access: 'mock_access_token_receveur',
          user: RECEVEUR_USER,
        }),
      });
    });

    await page.route('**/api/v1/auth/logout/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Déconnexion réussie.' }),
      });
    });

    await page.goto('/login');
    await page.locator('#login-username').fill('receveur1');
    await page.locator('#login-password').fill('StrongPass123!');
    await page.locator('#login-submit').click();

    await expect(page).toHaveURL(/\/saisie/, { timeout: 10000 });

    // Cliquer sur Déconnexion
    await page.locator('#logout-button').click();

    // Doit revenir au login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
