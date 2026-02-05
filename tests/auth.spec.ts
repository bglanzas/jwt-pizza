import { test, expect } from 'playwright-test-coverage';

test('login uses mocked auth response', async ({ page }) => {
  await page.route('**/api/auth', async (route) => {
    const request = route.request();
    if (request.method() !== 'PUT') {
      return route.continue();
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 1, name: 'Test User', email: 'test@test.com', roles: [] },
        token: 'test-token',
      }),
    });
  });

  await page.goto('http://localhost:5173/login');
  await page.getByPlaceholder('Email address').fill('test@test.com');
  await page.getByPlaceholder('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
});

test('logout clears session and returns to home', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
  });

  await page.route('**/api/user/me', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 1, name: 'Test User', email: 'test@test.com', roles: [] }),
    });
  });

  await page.route('**/api/auth', async (route) => {
    const request = route.request();
    if (request.method() !== 'DELETE') {
      return route.continue();
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok' }) });
  });

  await page.goto('http://localhost:5173/logout');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
});

