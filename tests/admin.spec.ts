import { test, expect } from 'playwright-test-coverage';

type MockUser = {
  id: number;
  name: string;
  email: string;
  roles: { role: string; objectId?: string }[];
};

async function mockAdminSession(page: any, initialUsers: MockUser[]) {
  await page.addInitScript((seedUsers: MockUser[]) => {
    localStorage.setItem('token', 'admin-token');

    let users = [...seedUsers];
    const adminUser = { id: 1, name: 'Admin', email: 'admin@jwt.com', roles: [{ role: 'admin' }] };
    const jsonHeaders = { 'Content-Type': 'application/json' };
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();

      if (url.includes('/api/user/me')) {
        return new Response(JSON.stringify(adminUser), { status: 200, headers: jsonHeaders });
      }

      if (url.includes('/api/user')) {
        if (method === 'GET') {
          const parsed = new URL(url, window.location.origin);
          const pageParam = Number(parsed.searchParams.get('page') || '1');
          const nameParam = parsed.searchParams.get('name') || '*';
          let responseUsers = [...users];

          if (nameParam.includes('Two')) {
            responseUsers = responseUsers.filter((user) => user.name.includes('Two'));
          }

          if (pageParam === 2) {
            responseUsers = [{ id: 12, name: 'Diner Three', email: 'diner3@jwt.com', roles: [{ role: 'diner' }] }];
          }

          const more = pageParam === 1;
          return new Response(JSON.stringify({ users: responseUsers, more }), { status: 200, headers: jsonHeaders });
        }
        if (method === 'DELETE') {
          const userId = Number(url.split('/').pop());
          users = users.filter((user) => user.id !== userId);
          return new Response(JSON.stringify({ message: 'deleted' }), { status: 200, headers: jsonHeaders });
        }
      }

      if (url.includes('/api/franchise')) {
        if (method === 'GET') {
          return new Response(
            JSON.stringify({
              franchises: [
                {
                  id: 5,
                  name: 'West Franchise',
                  admins: [{ id: 1, name: 'Admin', email: 'admin@jwt.com' }],
                  stores: [{ id: 9, name: 'SLC', totalRevenue: 12 }],
                },
              ],
              more: false,
            }),
            { status: 200, headers: jsonHeaders }
          );
        }
      }

      if (method === 'OPTIONS') {
        return new Response(null, { status: 204 });
      }

      return originalFetch(input, init);
    };
  }, initialUsers);
}

test('admin can list and delete users (mocked)', async ({ page }) => {
  await mockAdminSession(page, [
    { id: 10, name: 'Diner One', email: 'diner1@jwt.com', roles: [{ role: 'diner' }] },
    { id: 11, name: 'Diner Two', email: 'diner2@jwt.com', roles: [{ role: 'diner' }] },
  ]);

  await page.goto('http://localhost:5173/admin-dashboard');
  await expect(page.getByRole('main')).toContainText('Diner One');
  await expect(page.getByRole('main')).toContainText('Diner Two');

  await page.getByPlaceholder('Filter users').fill('Two');
  await page.getByRole('button', { name: 'Submit' }).first().click();
  await expect(page.getByRole('main')).not.toContainText('Diner One');
  await expect(page.getByRole('main')).toContainText('Diner Two');

  await page.getByRole('button', { name: '»' }).first().click();
  await expect(page.getByRole('main')).toContainText('Diner Three');

  await page.getByRole('button', { name: '«' }).first().click();
  await expect(page.getByRole('main')).toContainText('Diner Two');

  await page.getByPlaceholder('Filter users').fill('');
  await page.getByRole('button', { name: 'Submit' }).first().click();

  await page.getByRole('button', { name: 'Delete' }).first().click();

  await expect(page.getByRole('main')).not.toContainText('Diner One');
  await expect(page.getByRole('main')).toContainText('Diner Two');

  await expect(page.getByRole('main')).toContainText('West Franchise');
  await expect(page.getByRole('main')).toContainText('SLC');
  await page.getByRole('button', { name: 'Close' }).first().click();
  await expect(page).toHaveURL(/\/admin-dashboard\/close-franchise/);

  await page.goto('http://localhost:5173/admin-dashboard');
  await page.getByRole('button', { name: 'Close' }).nth(1).click();
  await expect(page).toHaveURL(/\/admin-dashboard\/close-store/);

  await page.goto('http://localhost:5173/admin-dashboard');
  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await expect(page).toHaveURL(/\/admin-dashboard\/create-franchise/);
});
