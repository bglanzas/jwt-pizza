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

test('purchase flow uses mocked endpoints', async ({ page }) => {
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

  await page.route('**/api/order/menu', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: '1', title: 'Veggie', description: 'A garden of delight', image: 'pizza1.png', price: 0.05 },
      ]),
    });
  });

  await page.route('**/api/franchise**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        franchises: [
          { id: '1', name: 'Test Franchise', stores: [{ id: '1', name: 'Store 1' }] },
        ],
        more: false,
      }),
    });
  });

  await page.route('**/api/order', async (route) => {
    const request = route.request();
    if (request.method() !== 'POST') {
      return route.continue();
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        order: {
          id: '101',
          franchiseId: '1',
          storeId: '1',
          date: '2024-06-05T05:14:40.000Z',
          items: [{ menuId: '1', description: 'Veggie', price: 0.05 }],
        },
        jwt: 'test-jwt',
      }),
    });
  });

  await page.goto('http://localhost:5173/menu');
  await page.getByRole('combobox').selectOption('1');
  await page.getByRole('button', { name: /Veggie/ }).click();
  await page.getByRole('button', { name: 'Checkout' }).click();

  await expect(page).toHaveURL(/\/payment$/);
  await page.getByRole('button', { name: 'Pay now' }).click();

  await expect(page).toHaveURL(/\/delivery$/);
  await expect(page.getByText('order ID:')).toBeVisible();
});
