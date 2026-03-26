import { expect, test } from '@playwright/test';

function uniqueUser() {
  return `u${Date.now().toString().slice(-8)}`;
}

test('smoke flow: auth -> translate -> vocabulary -> progress', async ({ page }) => {
  const username = uniqueUser();
  const password = 'Password1234%';
  const now = new Date().toISOString();
  const vocabId = '11111111-1111-1111-1111-111111111111';

  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Warmup endpoints
    if (url.endsWith('/api/ping') || url.endsWith('/api/health') || url.endsWith('/api') || url.endsWith('/api/')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    }

    // Auth
    if (url.endsWith('/api/auth/register') && method === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'test-token' }),
      });
    }
    if (url.endsWith('/api/auth/login') && method === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'test-token' }),
      });
    }
    if (url.endsWith('/api/auth/me') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ userId: 'me', username }),
      });
    }

    // Translate
    if (url.endsWith('/api/translate') && method === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          text: 'resilient',
          sourceLang: 'EN',
          targetLang: 'VI',
          detectedSourceLang: 'EN',
          translatedText: 'kiên cường',
          cached: false,
          dictionary: [
            {
              word: 'resilient',
              meanings: [
                {
                  partOfSpeech: 'adjective',
                  definitions: [{ definition: 'able to recover quickly', synonyms: [], antonyms: [] }],
                  synonyms: [],
                  antonyms: [],
                },
              ],
            },
          ],
          vocabulary: { id: vocabId },
        }),
      });
    }

    // Vocabulary list
    if (url.includes('/api/vocab') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: vocabId,
              userId: 'me',
              word: 'resilient',
              meaning: 'kiên cường',
              example: null,
              sourceText: null,
              difficulty: null,
              reviewCount: 0,
              correctCount: 0,
              lastReviewedAt: null,
              nextReviewAt: null,
              isArchived: false,
              createdAt: now,
              updatedAt: now,
              isNew: true,
              isDue: false,
              isMastered: false,
              dictionary: [],
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
        }),
      });
    }

    // Progress dashboard
    if (url.includes('/api/progress/dashboard') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          summary: { date: '2026-03-24', totalVocabularyCount: 1, dailyAddedVocabularyCount: 1 },
          activitySeries: [{ date: '2026-03-24', addedCount: 1 }],
          streak: { currentStreakDays: 1, longestStreakDays: 1, lastActiveDate: '2026-03-24' },
          wordlistsSummary: { wordlistCount: 0, categoryCount: 0 },
          recentActivity: [{ id: 'a1', type: 'VOCAB_ADDED', target: 'resilient', createdAt: now }],
        }),
      });
    }

    // Progress leaderboard
    if (url.includes('/api/progress/leaderboard') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          topStreakUsers: [{ userId: 'u1', username: 'alice', value: 7 }],
          topAddedUsers: [{ userId: 'u2', username: 'bob', value: 21 }],
          topReviewUsers: [{ userId: 'u3', username: 'charlie', value: 15 }],
          topTranslatedWords: [{ userId: 'w1', username: 'resilient', value: 3 }],
        }),
      });
    }

    return route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Not mocked', url }),
    });
  });

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

