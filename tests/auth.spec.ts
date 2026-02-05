import { test, expect } from 'playwright-test-coverage';

const ADMIN_USER = {
  id: 1,
  name: '常用名字',
  email: 'a@jwt.com',
  password: 'admin',
  roles: [{ role: 'admin' }],
};

const FRANCHISEE_USER = {
  id: 2,
  name: 'Franchise Owner',
  email: 'owner@jwt.com',
  password: 'owner',
  roles: [{ role: 'franchisee' }],
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

test('purchase flow uses mocked endpoints', async ({ page }) => {
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
