import { test, expect } from 'playwright-test-coverage';

const ADMIN_USER = {
  id: 1,
  name: '常用名字',
  email: 'a@jwt.com',
  roles: [{ role: 'admin' }],
};

test('admin can open and close a franchise (mocked)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
  });

  await page.route('**/api/user/me', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: ADMIN_USER.id,
        name: ADMIN_USER.name,
        email: ADMIN_USER.email,
        roles: ADMIN_USER.roles,
      }),
    });
  });

  let franchises = [
    {
      id: '1',
      name: 'Test Franchise',
      admins: [{ name: ADMIN_USER.name, email: ADMIN_USER.email }],
      stores: [],
    },
  ];

  await page.route('**/api/franchise**', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ franchises, more: false }),
      });
    }
    if (request.method() === 'POST') {
      const newFranchise = {
        id: '2',
        name: 'New Franchise',
        admins: [{ name: ADMIN_USER.name, email: ADMIN_USER.email }],
        stores: [],
      };
      franchises = [newFranchise, ...franchises];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(newFranchise),
      });
    }
    if (request.method() === 'DELETE') {
      franchises = franchises.filter((f) => f.id !== '2');
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok' }) });
    }
    return route.continue();
  });

  await page.goto('http://localhost:5173/admin-dashboard');
  await expect(page.getByText('Franchises')).toBeVisible();

  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await expect(page).toHaveURL(/\/admin-dashboard\/create-franchise$/);
  await page.getByPlaceholder('franchise name').fill('New Franchise');
  await page.getByPlaceholder('franchisee admin email').fill(ADMIN_USER.email);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page).toHaveURL(/\/admin-dashboard$/);

  await page.getByRole('row', { name: /New Franchise/ }).getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/\/admin-dashboard\/close-franchise$/);
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/\/admin-dashboard$/);
});
