import { test, expect } from 'playwright-test-coverage';

test('home page renders core sections', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await expect(page.getByRole('link', { name: 'Order' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
});

test('static pages render (about and history)', async ({ page }) => {
  await page.goto('http://localhost:5173/about');
  await expect(page.getByRole('heading', { name: 'The secret sauce' })).toBeVisible();

  await page.goto('http://localhost:5173/history');
  await expect(page.getByRole('heading', { name: 'Mama Rucci, my my' })).toBeVisible();
});
