import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { execFile as execFileCallback } from 'node:child_process';

const execFile = promisify(execFileCallback);

function cliBinary(): string {
  const candidates = [
    resolve(process.cwd(), 'dist/bin/ppr-linux-x86_64'),
    resolve(process.cwd(), 'target/release/ppr'),
    resolve(process.cwd(), 'target/debug/ppr')
  ];
  const binary = candidates.find(existsSync);
  if (!binary) throw new Error('Build the ppr binary before exercising the CLI claim.');
  return binary;
}

test('landing page states the job and offers the sample first action', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Proxy Policy Rehearsal — test proxy rules');
  await expect(page.getByRole('heading', { name: 'Test proxy rules before deployment' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' }).first()).toBeVisible();
  await expect(page.getByText('For self-hosted operators who need to protect visitors and monitors from bad proxy rules.')).toBeVisible();
});

test('@claim:sample-demo loads a labelled nine-decision sample and reset restores it', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.getByRole('heading', { name: 'Test the sample proxy policy' })).toBeVisible();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#result-count')).toHaveText('9/9 pass');
  await expect(page.locator('#result-rows tr')).toHaveCount(9);
  await page.locator('#policy-input').fill('{"trustedProxyPrefix":"10.","monitorIp":"203.0.113.99","cases":[]}');
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  await expect(page.locator('#policy-input')).toHaveValue(/203\.0\.113\.42/);
  await expect(page.locator('#result-count')).toHaveText('9/9 pass');
});

test('@claim:mock-dns changes the expected decision matrix from fixture data', async ({ page }) => {
  await page.goto('/demo/');
  const sample = await page.locator('#policy-input').inputValue();
  await page.locator('#policy-input').fill(sample.replace('203.0.113.42', '203.0.113.99'));
  await page.getByRole('button', { name: 'Run rehearsal' }).click();
  await expect(page.locator('#result-count')).toHaveText('3 regressions');
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  await expect(page.locator('#result-count')).toHaveText('9/9 pass');
});

test('@claim:local-browser-matrix calculates the sample without a third-party request or upload', async ({ page }) => {
  const requests: Array<{ url: string; method: string }> = [];
  page.on('request', (request) => requests.push({ url: request.url(), method: request.method() }));
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Run rehearsal' }).click();
  await expect(page.locator('#result-count')).toHaveText('9/9 pass');
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((request) => new URL(request.url).origin === 'http://127.0.0.1:4173')).toBe(true);
  expect(requests.every((request) => request.method === 'GET')).toBe(true);
});

test('@claim:offline-reload reloads the visited sample while offline', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/demo/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Test the sample proxy policy' })).toBeVisible();
  await expect(page.locator('#result-count')).toHaveText('9/9 pass');
  await expect(page.locator('#network-status')).toContainText('Offline');
  await context.close();
});

test('@claim:demo-isolation keeps real data untouched and discards demo storage on exit', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ppr:real:fixture', 'keep-this-real-value'));
  await page.goto('/demo/');
  await page.locator('#policy-input').fill('{oops');
  expect(await page.evaluate(() => localStorage.getItem('ppr:real:fixture'))).toBe('keep-this-real-value');
  expect(await page.evaluate(() => localStorage.getItem('demo:ppr:fixture'))).toBe('{oops');
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\?start=real$/);
  expect(await page.evaluate(() => localStorage.getItem('ppr:real:fixture'))).toBe('keep-this-real-value');
  expect(await page.evaluate(() => localStorage.getItem('demo:ppr:fixture'))).toBeNull();
});

test('@claim:free-core runs the browser sample without an account', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.locator('#result-count')).toHaveText('9/9 pass');
  await expect(page.getByRole('textbox', { name: 'Sample fixture (JSON)' })).toBeEditable();
  await expect(page.getByText(/sign in|create account/i)).toHaveCount(0);
});

test('@claim:one-binary runs the bundled CLI sample from the public executable', async () => {
  const { stdout, stderr } = await execFile(cliBinary(), ['demo']);
  expect(stderr).toBe('');
  expect(stdout).toContain('bundled sample data in a temporary directory');
  expect(stdout).toMatch(/Sample fixture: .*ppr-demo-.*monitor-policy\.yaml/);
  expect(stdout).toContain('9 passed · 0 failed · 0 unchecked · 9 decisions');
});

test('@claim:fixture-files-only rejects a remote-looking path instead of fetching it', async () => {
  await expect(execFile(cliBinary(), ['test', 'https://policy.example/fixture.yaml'])).rejects.toMatchObject({
    code: 2,
    stderr: expect.stringContaining('cannot read https://policy.example/fixture.yaml')
  });
});

test('@claim:no-proxy-service exposes no server command', async () => {
  await expect(execFile(cliBinary(), ['serve'])).rejects.toMatchObject({
    code: 2,
    stderr: expect.stringContaining("unrecognized subcommand 'serve'")
  });
});

test('recovers from invalid input and has no serious accessibility violations', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/demo/');
  await page.locator('#policy-input').fill('{oops');
  await page.locator('#policy-input').press('Control+Enter');
  await expect(page.getByRole('alert')).toContainText('not valid JSON');
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  await expect(page.locator('#result-count')).toHaveText('9/9 pass');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  expect(errors).toEqual([]);
});

test('legal, demo query, and designed 404 routes have product titles and headings', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page).toHaveTitle('Privacy — Proxy Policy Rehearsal');
  await expect(page.locator('h1')).toHaveText('Privacy');
  await page.goto('/terms/');
  await expect(page).toHaveTitle('Terms — Proxy Policy Rehearsal');
  await expect(page.locator('h1')).toHaveText('Terms');
  await page.goto('/?demo=1');
  await expect(page).toHaveTitle('Demo — Proxy Policy Rehearsal');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#result-count')).toHaveText('9/9 pass');
  await page.goto('/404.html');
  await expect(page).toHaveTitle('Page not found — Proxy Policy Rehearsal');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to homepage' })).toBeVisible();
});

test('keyboard skip link and reduced-motion mobile layout work', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
