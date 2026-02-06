import { test, expect } from 'playwright-test-coverage';

const FRANCHISEE_USER = {
  id: 2,
  name: 'Franchise Owner',
  email: 'owner@jwt.com',
  roles: [{ role: 'franchisee' }],
};

test('franchisee can open and close a store (mocked)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
  });

  await page.route('**/api/user/me', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: FRANCHISEE_USER.id,
        name: FRANCHISEE_USER.name,
        email: FRANCHISEE_USER.email,
        roles: FRANCHISEE_USER.roles,
      }),
    });
  });

  let franchise = {
    id: '10',
    name: 'Owner Franchise',
    admins: [{ name: FRANCHISEE_USER.name, email: FRANCHISEE_USER.email }],
    stores: [{ id: '100', name: 'Main Store' }],
  };

  await page.route('**/api/franchise/**', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([franchise]),
      });
    }
    if (request.method() === 'POST') {
      const newStore = { id: '101', name: 'New Store' };
      franchise = { ...franchise, stores: [...franchise.stores, newStore] };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(newStore),
      });
    }
    if (request.method() === 'DELETE') {
      franchise = { ...franchise, stores: [] };
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok' }) });
    }
    return route.continue();
  });

  await page.goto('http://localhost:5173/franchise-dashboard');
  await expect(page.getByText('Owner Franchise')).toBeVisible();

  await page.getByRole('button', { name: 'Create store' }).click();
  await expect(page).toHaveURL(/\/franchise-dashboard\/create-store$/);
  await page.getByPlaceholder('store name').fill('New Store');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page).toHaveURL(/\/franchise-dashboard$/);

  await page.getByRole('row', { name: /Main Store/ }).getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/\/franchise-dashboard\/close-store$/);
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/\/franchise-dashboard$/);
});
