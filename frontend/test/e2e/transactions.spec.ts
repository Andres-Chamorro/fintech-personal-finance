import { test, expect } from '@playwright/test';

test.describe('Transactions E2E', () => {
  const testPassword = 'Test1234';

  test.beforeEach(async ({ page }) => {
    const testEmail = `test-trans-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@fintech.com`;

    // Register and login before each test
    await page.goto('/register');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Trans');
    await page.click('button[type="submit"]');
    await page.waitForURL('/login', { timeout: 10000 });

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to transactions and wait for page to be ready
    await page.goto('/transactions');
    await page.locator('h1:has-text("Transacciones")').waitFor({ state: 'visible', timeout: 10000 });
  });

  test('should create a new transaction', async ({ page }) => {
    await page.click('button:has-text("Nueva Transacción")');
    await expect(page.locator('h2:has-text("Nueva Transacción")')).toBeVisible();

    await page.selectOption('select[name="type"]', 'expense');
    await page.fill('input[type="number"]', '50000');
    await page.locator('form input[type="text"]').fill('Test E2E transaction');

    const today = new Date().toISOString().split('T')[0];
    await page.locator('form input[type="date"]').fill(today);

    await page.click('button:has-text("Crear")');

    await expect(page.locator('text=creada exitosamente')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Test E2E transaction')).toBeVisible();
  });

  test('should prevent creating transaction with future date', async ({ page }) => {
    await page.click('button:has-text("Nueva Transacción")');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    await page.selectOption('select[name="type"]', 'expense');
    await page.fill('input[type="number"]', '50000');
    await page.locator('form input[type="text"]').fill('Future transaction');

    await page.locator('form input[type="date"]').evaluate((el: HTMLInputElement) => {
      el.removeAttribute('max');
    });
    await page.locator('form input[type="date"]').fill(futureDateStr);

    await page.click('button:has-text("Crear")');

    await expect(page.locator('text=/no puede ser futura|fecha futura|Error/i').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('should edit an existing transaction', async ({ page }) => {
    // Create a transaction first
    await page.click('button:has-text("Nueva Transacción")');
    await expect(page.locator('h2:has-text("Nueva Transacción")')).toBeVisible();
    await page.selectOption('select[name="type"]', 'expense');
    await page.fill('input[type="number"]', '30000');
    await page.locator('form input[type="text"]').fill('Original description');
    const today = new Date().toISOString().split('T')[0];
    await page.locator('form input[type="date"]').fill(today);
    await page.click('button:has-text("Crear")');
    await expect(page.locator('text=Original description')).toBeVisible({ timeout: 5000 });

    // Wait for table to stabilize after re-fetch
    await page.waitForTimeout(500);

    // Click edit button
    await page.locator('button:has-text("Editar")').first().click();

    // Wait for edit modal to be fully ready
    await expect(page.locator('h2:has-text("Editar Transacción")')).toBeVisible();
    await page.locator('form input[type="text"]').waitFor({ state: 'attached', timeout: 5000 });

    // Update description
    await page.locator('form input[type="text"]').fill('Updated description');
    await page.click('button:has-text("Actualizar")');

    await expect(page.locator('text=actualizada exitosamente')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Updated description')).toBeVisible();
  });

  test('should delete a transaction', async ({ page }) => {
    // Register dialog handler BEFORE any action that might trigger it
    page.on('dialog', (dialog) => dialog.accept());

    // Create a transaction
    await page.click('button:has-text("Nueva Transacción")');
    await expect(page.locator('h2:has-text("Nueva Transacción")')).toBeVisible();
    await page.selectOption('select[name="type"]', 'income');
    await page.fill('input[type="number"]', '100000');
    await page.locator('form input[type="text"]').fill('To be deleted');
    const today = new Date().toISOString().split('T')[0];
    await page.locator('form input[type="date"]').fill(today);
    await page.click('button:has-text("Crear")');
    await expect(page.locator('text=To be deleted')).toBeVisible({ timeout: 5000 });

    // Wait for table to stabilize
    await page.waitForTimeout(500);

    // Click delete
    await page.locator('button:has-text("Eliminar")').first().click();

    // Verify success toast
    await expect(page.locator('text=eliminada')).toBeVisible({ timeout: 5000 });
  });

  test('should filter transactions by type', async ({ page }) => {
    // Create income transaction
    await page.click('button:has-text("Nueva Transacción")');
    await expect(page.locator('h2:has-text("Nueva Transacción")')).toBeVisible();
    await page.selectOption('select[name="type"]', 'income');
    await page.fill('input[type="number"]', '200000');
    await page.locator('form input[type="text"]').fill('Income test');
    const today = new Date().toISOString().split('T')[0];
    await page.locator('form input[type="date"]').fill(today);
    await page.click('button:has-text("Crear")');
    await expect(page.locator('text=creada exitosamente')).toBeVisible({ timeout: 5000 });

    // Wait for modal to close and list to refresh
    await page.locator('h2:has-text("Nueva Transacción")').waitFor({ state: 'hidden', timeout: 5000 });

    // Create expense transaction
    await page.click('button:has-text("Nueva Transacción")');
    await expect(page.locator('h2:has-text("Nueva Transacción")')).toBeVisible();
    await page.selectOption('select[name="type"]', 'expense');
    await page.fill('input[type="number"]', '50000');
    await page.locator('form input[type="text"]').fill('Expense test');
    await page.locator('form input[type="date"]').fill(today);
    await page.click('button:has-text("Crear")');
    await expect(page.locator('text=creada exitosamente')).toBeVisible({ timeout: 5000 });

    // Wait for modal to close
    await page.locator('h2:has-text("Nueva Transacción")').waitFor({ state: 'hidden', timeout: 5000 });

    // Filter by income
    const filterTypeSelect = page.locator('select').first();
    await filterTypeSelect.selectOption('income');
    await expect(page.locator('text=Income test')).toBeVisible({ timeout: 3000 });

    // Filter by expense
    await filterTypeSelect.selectOption('expense');
    await expect(page.locator('text=Expense test')).toBeVisible({ timeout: 3000 });
  });

  test('should navigate with back button', async ({ page }) => {
    await page.click('button:has-text("Volver")');
    await expect(page).toHaveURL('/dashboard', { timeout: 3000 });
  });
});
