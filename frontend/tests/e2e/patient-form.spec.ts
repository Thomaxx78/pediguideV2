import { test, expect } from '@playwright/test';

test.describe('Parcours patient — formulaire pré-consultation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/diagnosis');
  });

  test('la page affiche le header et la barre de progression étape 1', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /pré-consultation/i })).toBeVisible();
    await expect(page.getByText('Étape 1 sur 5')).toBeVisible();
  });

  test('étape 1 — validation des champs obligatoires', async ({ page }) => {
    // Cliquer Continuer sans remplir → erreurs attendues
    await page.getByRole('button', { name: /continuer/i }).click();

    await expect(page.getByText(/prénom.*requis|champ obligatoire/i).first()).toBeVisible();
  });

  test('étape 1 → étape 2 avec données valides', async ({ page }) => {
    await page.getByLabel(/prénom de l'enfant/i).fill('Léo');
    await page.getByLabel(/nom de l'enfant/i).fill('Dupont');
    await page.getByLabel(/date de naissance/i).fill('2020-03-15');
    await page.getByLabel(/qu'est-ce qui vous amène/i).fill('Fièvre depuis 2 jours, toux légère.');

    await page.getByRole('button', { name: /continuer/i }).click();

    await expect(page.getByText('Étape 2 sur 5')).toBeVisible();
    await expect(page.getByRole('heading', { name: /ce que vous observez/i })).toBeVisible();
  });

  test('étape 2 — sélection des symptômes (optionnel)', async ({ page }) => {
    // Remplir étape 1 d'abord
    await page.getByLabel(/prénom de l'enfant/i).fill('Emma');
    await page.getByLabel(/nom de l'enfant/i).fill('Martin');
    await page.getByLabel(/date de naissance/i).fill('2019-07-20');
    await page.getByLabel(/qu'est-ce qui vous amène/i).fill('Toux persistante.');
    await page.getByRole('button', { name: /continuer/i }).click();

    // Étape 2 — cocher un symptôme
    const checkbox = page.getByLabel(/agitation/i).first();
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    await page.getByRole('button', { name: /continuer/i }).click();
    await expect(page.getByText('Étape 3 sur 5')).toBeVisible();
  });

  test('bouton Retour revient à l'étape précédente', async ({ page }) => {
    await page.getByLabel(/prénom de l'enfant/i).fill('Jules');
    await page.getByLabel(/nom de l'enfant/i).fill('Bernard');
    await page.getByLabel(/date de naissance/i).fill('2021-01-10');
    await page.getByLabel(/qu'est-ce qui vous amène/i).fill('Diarrhée.');
    await page.getByRole('button', { name: /continuer/i }).click();

    await expect(page.getByText('Étape 2 sur 5')).toBeVisible();
    await page.getByRole('button', { name: /retour/i }).click();
    await expect(page.getByText('Étape 1 sur 5')).toBeVisible();
  });

  test('la barre de progression avance à chaque étape', async ({ page }) => {
    const getProgress = () =>
      page.evaluate(() => {
        const bar = document.querySelector('[role="progressbar"]');
        return bar?.getAttribute('aria-valuenow');
      });

    expect(await getProgress()).toBe('1');

    await page.getByLabel(/prénom de l'enfant/i).fill('Sofia');
    await page.getByLabel(/nom de l'enfant/i).fill('Leroy');
    await page.getByLabel(/date de naissance/i).fill('2018-11-05');
    await page.getByLabel(/qu'est-ce qui vous amène/i).fill('Fièvre.');
    await page.getByRole('button', { name: /continuer/i }).click();

    expect(await getProgress()).toBe('2');
  });
});
