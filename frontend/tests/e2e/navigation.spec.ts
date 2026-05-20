import { test, expect } from '@playwright/test';

test.describe('Navigation et pages publiques', () => {
  test(`la page d'accueil charge correctement`, async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/pédigu/i);
    await expect(page.getByRole('heading', { name: /pédigu/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /commencer/i })).toBeVisible();
  });

  test('le lien "Commencer" redirige vers /diagnosis', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /commencer/i }).click();
    await expect(page).toHaveURL(/\/diagnosis/);
  });

  test('la page de connexion est accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
  });

  test('une route inconnue affiche la page 404', async ({ page }) => {
    await page.goto('/route-qui-nexiste-pas');
    await expect(page.getByText(/404|introuvable|not found/i).first()).toBeVisible();
  });

  test('les pages légales sont accessibles', async ({ page }) => {
    await page.goto('/mentions-legales');
    await expect(page.getByRole('heading').first()).toBeVisible();

    await page.goto('/confidentialite');
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});
