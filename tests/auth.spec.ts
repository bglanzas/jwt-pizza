import { test, expect } from 'playwright-test-coverage';

const ADMIN_USER = {
  id: 1,
  name: '常用名字',
  email: 'a@jwt.com',
  password: 'admin',
  roles: [{ role: 'admin' }],
};

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
        user: { id: ADMIN_USER.id, name: ADMIN_USER.name, email: ADMIN_USER.email, roles: ADMIN_USER.roles },
        token: 'test-token',
      }),
    });
  });

  await page.goto('http://localhost:5173/login');
  await page.getByPlaceholder('Email address').fill(ADMIN_USER.email);
  await page.getByPlaceholder('Password').fill(ADMIN_USER.password);
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
      body: JSON.stringify({ id: ADMIN_USER.id, name: ADMIN_USER.name, email: ADMIN_USER.email, roles: ADMIN_USER.roles }),
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

test('register uses mocked auth response', async ({ page }) => {
  await page.route('**/api/auth', async (route) => {
    const request = route.request();
    if (request.method() !== 'POST') {
      return route.continue();
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 3, name: 'New User', email: 'new@jwt.com', roles: [{ role: 'diner' }] },
        token: 'new-user-token',
      }),
    });
  });

  await page.goto('http://localhost:5173/register');
  await page.getByPlaceholder('Full name').fill('New User');
  await page.getByPlaceholder('Email address').fill('new@jwt.com');
  await page.getByPlaceholder('Password').fill('password123');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
});
