import { test, expect } from '@playwright/test';

test.describe('Budgets E2E', () => {
  const testPassword = 'Test1234';

  test.beforeEach(async ({ page }) => {
    const testEmail = `test-budgets-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@fintech.com`;

    // Register and login
    await page.goto('/register');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Budget');
    await page.click('button[type="submit"]');
    await page.waitForURL('/login', { timeout: 10000 });

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to budgets
    await page.goto('/budgets');
    await page.locator('h1:has-text("Presupuestos")').waitFor({ state: 'visible', timeout: 10000 });
  });

  test('should create a new budget', async ({ page }) => {
    // Open modal
    await page.click('button:has-text("Nuevo Presupuesto")');

    // Wait for modal
    await expect(page.locator('h2:has-text("Nuevo Presupuesto")')).toBeVisible();

    // Fill form - select first category (index 1 because index 0 is the placeholder)
    const currentDate = new Date();
    await page.locator('form select').first().selectOption({ index: 1 });

    await page.locator('form input[type="number"]').first().fill('500000');

    // Month select should default to current month
    const monthSelect = page.locator('form select').nth(1);
    await expect(monthSelect).toHaveValue(String(currentDate.getMonth() + 1));

    // Submit via form submit button
    await page.locator('form button[type="submit"]').click();

    // Verify success toast (green)
    await expect(page.locator('text=creado exitosamente')).toBeVisible({
      timeout: 5000,
    });

    // Verify budget appears (formatted as COP currency)
    await expect(
      page.locator('text=/500/').first()
    ).toBeVisible({ timeout: 3000 });
  });

  test('should prevent creating budget for past month', async ({ page }) => {
    await page.click('button:has-text("Nuevo Presupuesto")');

    const currentDate = new Date();
    const pastYear = currentDate.getFullYear() - 1;

    // Select category
    await page.locator('form select').first().selectOption({ index: 1 });
    await page.locator('form input[type="number"]').first().fill('300000');

    // Set past year
    const yearInput = page.locator('form input[type="number"]').nth(1);
    await yearInput.fill(String(pastYear));

    await page.locator('form button[type="submit"]').click();

    // Should show error toast (red)
    await expect(page.locator('text=/meses anteriores|pasado/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should prevent duplicate budgets', async ({ page }) => {
    // Create first budget
    await page.click('button:has-text("Nuevo Presupuesto")');
    await page.locator('form select').first().selectOption({ index: 1 });
    await page.locator('form input[type="number"]').first().fill('400000');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('text=creado exitosamente')).toBeVisible({ timeout: 5000 });

    // Try to create duplicate
    await page.click('button:has-text("Nuevo Presupuesto")');
    await page.locator('form select').first().selectOption({ index: 1 });
    await page.locator('form input[type="number"]').first().fill('500000');
    await page.locator('form button[type="submit"]').click();

    // Should show error toast
    await expect(page.locator('text=/Ya existe|duplicado|ya tiene/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should delete a budget', async ({ page }) => {
    // Create budget first
    await page.click('button:has-text("Nuevo Presupuesto")');
    await page.locator('form select').first().selectOption({ index: 1 });
    await page.locator('form input[type="number"]').first().fill('350000');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('text=creado exitosamente')).toBeVisible({ timeout: 5000 });

    // Handle confirmation dialog
    page.on('dialog', (dialog) => dialog.accept());

    // Click delete on first budget
    await page.locator('button:has-text("Eliminar")').first().click();

    // Verify success toast
    await expect(page.locator('text=eliminado')).toBeVisible({ timeout: 5000 });
  });

  test('should show budget alerts at 80%', async ({ page }) => {
    // Create a budget
    await page.click('button:has-text("Nuevo Presupuesto")');
    await page.locator('form select').first().selectOption({ index: 1 });
    await page.locator('form input[type="number"]').first().fill('100000');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('text=creado exitosamente')).toBeVisible({ timeout: 5000 });

    // Navigate to transactions to create expense
    await page.goto('/transactions');
    await page.locator('h1:has-text("Transacciones")').waitFor({ state: 'visible', timeout: 10000 });

    // Create transaction that reaches 80% of budget
    await page.click('button:has-text("Nueva Transacción")');

    // Select expense type using the modal's type select
    await page.selectOption('select[name="type"]', 'expense');
    await page.locator('form input[type="number"]').fill('80000');
    await page.locator('form input[type="text"]').fill('Test 80%');
    const today = new Date().toISOString().split('T')[0];
    await page.locator('form input[type="date"]').fill(today);

    // Select the category we created budget for (last select in the form is category)
    await page.locator('form select').last().selectOption({ index: 1 });

    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('text=creada exitosamente')).toBeVisible({ timeout: 5000 });

    // Go back to budgets
    await page.goto('/budgets');
    await page.locator('h1:has-text("Presupuestos")').waitFor({ state: 'visible', timeout: 10000 });

    // Should see warning alert
    await expect(page.locator('text=/ADVERTENCIA|80%/i')).toBeVisible({ timeout: 3000 });
  });

  test('should display budget values correctly', async ({ page }) => {
    // Create budget
    await page.click('button:has-text("Nuevo Presupuesto")');
    await page.locator('form select').first().selectOption({ index: 1 });
    await page.locator('form input[type="number"]').first().fill('600000');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('text=creado exitosamente')).toBeVisible({ timeout: 5000 });

    // Verify budget amount label is visible
    const budgetLabel = page.locator('text=Presupuesto:');
    await expect(budgetLabel).toBeVisible();

    // Verify the amount next to the label is visible and not white
    const budgetRow = page.locator('div.flex.justify-between.text-sm').filter({ hasText: 'Presupuesto:' });
    const amountSpan = budgetRow.locator('span').last();
    await expect(amountSpan).toBeVisible();

    // Color should not be white (rgb(255, 255, 255))
    const textColor = await amountSpan.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    expect(textColor).not.toBe('rgb(255, 255, 255)');
  });

  test('should navigate with back button', async ({ page }) => {
    await page.goto('/budgets');
    await page.locator('button:has-text("Volver")').waitFor({ state: 'visible', timeout: 5000 });
    await page.click('button:has-text("Volver")');
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });
});
