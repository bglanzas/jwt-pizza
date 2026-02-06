import { test, expect } from 'playwright-test-coverage';

const ADMIN_USER = {
  id: 1,
  name: '常用名字',
  email: 'a@jwt.com',
  roles: [{ role: 'admin' }],
};

test('payment submits order and navigates to delivery (mocked)', async ({ page }) => {
  const order = {
    franchiseId: '1',
    storeId: '1',
    items: [{ menuId: '1', description: 'Veggie', price: 0.05 }],
  };

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
          id: '201',
          franchiseId: order.franchiseId,
          storeId: order.storeId,
          date: '2024-06-05T05:14:40.000Z',
          items: order.items,
        },
        jwt: 'test-jwt',
      }),
    });
  });

  await page.goto('http://localhost:5173/');
  await page.evaluate((stateOrder) => {
    window.history.pushState({ state: { order: stateOrder } }, '', '/payment');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, order);

  await expect(page).toHaveURL(/\/payment$/);
  await page.getByRole('button', { name: 'Pay now' }).click();
  await expect(page).toHaveURL(/\/delivery$/);
});

test('payment shows error on failed order (mocked)', async ({ page }) => {
  const order = {
    franchiseId: '1',
    storeId: '1',
    items: [{ menuId: '1', description: 'Veggie', price: 0.05 }],
  };

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

  await page.route('**/api/order', async (route) => {
    const request = route.request();
    if (request.method() !== 'POST') {
      return route.continue();
    }
    return route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'order failed' }),
    });
  });

  await page.goto('http://localhost:5173/');
  await page.evaluate((stateOrder) => {
    window.history.pushState({ state: { order: stateOrder } }, '', '/payment');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, order);

  await expect(page).toHaveURL(/\/payment$/);
  await page.getByRole('button', { name: 'Pay now' }).click();
  await expect(page.getByText('order failed')).toBeVisible();
});

test('delivery verify shows valid response (mocked)', async ({ page }) => {
  const order = {
    id: '201',
    franchiseId: '1',
    storeId: '1',
    items: [{ menuId: '1', description: 'Veggie', price: 0.05 }],
  };

  await page.route('**/api/order/verify', async (route) => {
    const request = route.request();
    if (request.method() !== 'POST') {
      return route.continue();
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'valid', payload: { orderId: order.id } }),
    });
  });

  await page.goto('http://localhost:5173/');
  await page.evaluate((state) => {
    window.history.pushState({ state }, '', '/delivery');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, { order, jwt: 'test-jwt' });

  await expect(page).toHaveURL(/\/delivery$/);
  await page.getByRole('button', { name: 'Verify' }).click();
  const modalHeader = page.locator('#hs-jwt-modal h3');
  await expect(modalHeader).toContainText('valid');
});
