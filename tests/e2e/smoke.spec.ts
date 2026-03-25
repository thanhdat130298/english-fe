import { expect, test } from '@playwright/test';

function uniqueUser() {
  return `u${Date.now().toString().slice(-8)}`;
}

test('smoke flow: auth -> translate -> vocabulary -> progress', async ({ page }) => {
  const username = uniqueUser();
  const password = 'Password1234%';

  await page.goto('/');

  // Register a fresh account
  await page.getByRole('button', { name: 'Sign up' }).click();
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('heading', { name: 'Translate' })).toBeVisible();

  // Translate a short word (app auto-saves to vocabulary)
  await page.getByPlaceholder(/Enter text to translate/i).fill('resilient');
  await page.getByRole('main').getByRole('button', { name: 'Translate' }).click();

  await expect(page.getByText(/Translation/i)).toBeVisible({ timeout: 15000 });

  // Go to Vocabulary and verify item appears
  await page.getByRole('button', { name: 'Vocabulary' }).click();
  await expect(page.getByRole('heading', { name: 'Vocabulary' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'resilient' })).toBeVisible({ timeout: 15000 });

  // Open Progress and verify leaderboard section exists
  await page.getByRole('button', { name: 'Progress' }).click();
  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
});

