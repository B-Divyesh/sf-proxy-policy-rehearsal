import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('rehearses locally and has no serious accessibility violations', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Test the gate before traffic arrives.' })).toBeVisible();
  await page.getByRole('button', { name: 'Run rehearsal' }).click();
  await expect(page.locator('#result-count')).toHaveText('9/9 pass');
  await page.locator('#policy-input').fill('{oops');
  await page.locator('#policy-input').press('Control+Enter');
  await expect(page.getByRole('alert')).toContainText('not valid JSON');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  expect(errors).toEqual([]);
});

test('legal pages and keyboard path work', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.locator('h1')).toHaveText('Privacy');
  await page.goto('/terms/');
  await expect(page.locator('h1')).toHaveText('Terms');
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
});

test('the visited shell works offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Test the gate before traffic arrives.' })).toBeVisible();
  await expect(page.locator('#network-status')).toContainText('Offline');
});
