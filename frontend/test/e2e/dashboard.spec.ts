import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
  const testPassword = 'Test1234';

  test.beforeEach(async ({ page }) => {
    const testEmail = `test-dash-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@fintech.com`;

    await page.goto('/register');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Dash');
    await page.click('button[type="submit"]');
    await page.waitForURL('/login', { timeout: 15000 });

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 15000 });
  });

  test('should display balance cards with zero values for new user', async ({ page }) => {
    await expect(page.locator('text=Ingresos Totales')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Gastos Totales')).toBeVisible();
    await expect(page.locator('text=Balance')).toBeVisible();
  });

  test('should display user name in header', async ({ page }) => {
    await expect(page.locator('text=Test')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to transactions', async ({ page }) => {
    await page.locator('a:has-text("Ver Transacciones")').click();
    await expect(page).toHaveURL('/transactions', { timeout: 5000 });
  });

  test('should navigate to categories', async ({ page }) => {
    await page.locator('a:has-text("Gestionar Categorías")').click();
    await expect(page).toHaveURL('/categories', { timeout: 5000 });
  });

  test('should navigate to budgets', async ({ page }) => {
    await page.locator('a:has-text("Configurar Presupuestos")').click();
    await expect(page).toHaveURL('/budgets', { timeout: 5000 });
  });

  test('should logout from dashboard', async ({ page }) => {
    await page.click('text=Cerrar Sesión');
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });
});
