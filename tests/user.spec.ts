import { test, expect } from 'playwright-test-coverage';

type MockUser = {
  id: number;
  name: string;
  email: string;
  password: string;
  roles: { role: string; objectId?: string }[];
};

async function mockUserSession(page: any, initialUser: MockUser) {
  let user = { ...initialUser };

  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
  });

  await page.route('**/api/user/me', async (route: any) => {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) });
  });

  await page.route('**/api/user/**', async (route: any) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }
    if (request.method() !== 'PUT') {
      return route.continue();
    }
    const updated = request.postDataJSON();
    user = { ...user, ...updated, roles: user.roles };
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user, token: 'updated-token' }),
    });
  });

  await page.route('**/api/order', async (route: any) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }
    if (request.method() !== 'GET') {
      return route.continue();
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ orders: [] }),
    });
  });

  await page.route('**/api/auth', async (route: any) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }
    if (request.method() === 'PUT') {
      const body = request.postDataJSON();
      if (body.email !== user.email || body.password !== user.password) {
        return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'unauthorized' }) });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user, token: 'login-token' }),
      });
    }
    if (request.method() === 'DELETE') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'ok' }) });
    }
    return route.continue();
  });
}

test('updateUser', async ({ page }) => {
  await mockUserSession(page, {
    id: 7,
    name: 'pizza diner',
    email: 'pizza.diner@jwt.com',
    password: 'diner',
    roles: [{ role: 'diner' }],
  });

  const userMeResponse = page.waitForResponse('**/api/user/me');
  await page.goto('http://localhost:5173/diner-dashboard');
  await userMeResponse;

  await expect(page.getByRole('main')).toContainText('pizza diner');
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').first().fill('pizza dinerx');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
  await expect(page.getByRole('main')).toContainText('pizza dinerx');

  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', { name: 'Email address' }).fill('pizza.diner@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.goto('http://localhost:5173/diner-dashboard');
  await expect(page.getByRole('main')).toContainText('pizza dinerx');
});

test('updateUser updates email and password and persists after login (mocked)', async ({ page }) => {
  await mockUserSession(page, {
    id: 101,
    name: 'pizza diner',
    email: 'pizza.diner@jwt.com',
    password: 'diner',
    roles: [{ role: 'diner' }],
  });

  const userMeResponse = page.waitForResponse('**/api/user/me');
  await page.goto('http://localhost:5173/diner-dashboard');
  await userMeResponse;

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').nth(1).fill('pizza.diner+new@jwt.com');
  await page.getByRole('textbox').nth(2).fill('newdinerpass');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
  await expect(page.getByRole('main')).toContainText('pizza.diner+new@jwt.com');

  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', { name: 'Email address' }).fill('pizza.diner+new@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('newdinerpass');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
  const userMeResponseAfterLogin = page.waitForResponse('**/api/user/me');
  await page.goto('http://localhost:5173/diner-dashboard');
  await userMeResponseAfterLogin;
  await expect(page.getByRole('main')).toContainText('pizza.diner+new@jwt.com');
});

test('updateUser updates email only and persists after login (mocked)', async ({ page }) => {
  await mockUserSession(page, {
    id: 103,
    name: 'pizza diner',
    email: 'pizza.diner@jwt.com',
    password: 'diner',
    roles: [{ role: 'diner' }],
  });

  const userMeResponse = page.waitForResponse('**/api/user/me');
  await page.goto('http://localhost:5173/diner-dashboard');
  await userMeResponse;
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').nth(1).fill('pizza.diner+email@jwt.com');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
  await expect(page.getByRole('main')).toContainText('pizza.diner+email@jwt.com');

  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', { name: 'Email address' }).fill('pizza.diner+email@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
});

test('updateUser updates password only and persists after login (mocked)', async ({ page }) => {
  await mockUserSession(page, {
    id: 104,
    name: 'pizza diner',
    email: 'pizza.diner@jwt.com',
    password: 'diner',
    roles: [{ role: 'diner' }],
  });

  const userMeResponse = page.waitForResponse('**/api/user/me');
  await page.goto('http://localhost:5173/diner-dashboard');
  await userMeResponse;
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').nth(2).fill('newdinerpass');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', { name: 'Email address' }).fill('pizza.diner@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('newdinerpass');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
});

test('updateUser keeps franchisee role when updating profile (mocked)', async ({ page }) => {
  await mockUserSession(page, {
    id: 202,
    name: 'Franchise Owner',
    email: 'owner@jwt.com',
    password: 'ownerpass',
    roles: [{ role: 'franchisee', objectId: 'fr-1' }],
  });

  const userMeResponse = page.waitForResponse('**/api/user/me');
  await page.goto('http://localhost:5173/diner-dashboard');
  await userMeResponse;
  await expect(page.getByRole('main')).toContainText('Franchisee on fr-1');

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').first().fill('Franchise Owner X');
  await page.getByRole('textbox').nth(1).fill('owner+new@jwt.com');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
  await expect(page.getByRole('main')).toContainText('Franchise Owner X');
  await expect(page.getByRole('main')).toContainText('owner+new@jwt.com');
  await expect(page.getByRole('main')).toContainText('Franchisee on fr-1');
});

test('updateUser keeps admin role when updating profile (mocked)', async ({ page }) => {
  await mockUserSession(page, {
    id: 303,
    name: 'Admin User',
    email: 'admin@jwt.com',
    password: 'adminpass',
    roles: [{ role: 'admin' }],
  });

  const userMeResponse = page.waitForResponse('**/api/user/me');
  await page.goto('http://localhost:5173/diner-dashboard');
  await userMeResponse;
  await expect(page.getByRole('main')).toContainText('admin');

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').first().fill('Admin User X');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
  await expect(page.getByRole('main')).toContainText('Admin User X');
  await expect(page.getByRole('main')).toContainText('admin');
});
