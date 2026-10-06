import { test, expect } from '@playwright/test';

test('page affiche le titre ComptaGeWeb et le statut API backend', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ComptaGeWeb');
});
