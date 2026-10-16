import { test, expect } from '@playwright/test';

test('page affiche le titre de santé et le statut API backend', async ({ page }) => {
  await page.goto('/sante');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Santé et Connectivité Système');
});
