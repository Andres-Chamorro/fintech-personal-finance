import { test, expect } from '@playwright/test';

test.describe('Categories E2E', () => {
  const testPassword = 'Test1234';

  test.beforeEach(async ({ page }) => {
    const testEmail = `test-cats-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@fintech.com`;

    await page.goto('/register');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Cats');
    await page.click('button[type="submit"]');
    await page.waitForURL('/login', { timeout: 10000 });

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    await page.goto('/categories');
    await expect(page).toHaveURL('/categories', { timeout: 5000 });
  });

  test('should display default categories', async ({ page }) => {
    await expect(page.locator('h3:has-text("Alimentación")')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('h3:has-text("Transporte")')).toBeVisible();
    await expect(page.locator('h3:has-text("Salario")')).toBeVisible();
  });

  test('should create a new category', async ({ page }) => {
    await page.click('button:has-text("Nueva Categoría")');
    await expect(page.locator('h2:has-text("Nueva Categoría")')).toBeVisible();

    await page.locator('form input[type="text"]').fill('Mascotas');
    await page.locator('form textarea').fill('Gastos de mascotas');
    await page.locator('form button[type="submit"]').click();

    await expect(page.locator('text=creada exitosamente')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h3:has-text("Mascotas")')).toBeVisible();
  });

  test('should edit an existing category', async ({ page }) => {
    // Create a category first
    await page.click('button:has-text("Nueva Categoría")');
    await page.locator('form input[type="text"]').fill('Temporada');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('text=creada exitosamente')).toBeVisible({ timeout: 5000 });

    // Click edit on the new category
    const card = page.locator('div').filter({ hasText: 'Temporada' }).locator('button:has-text("Editar")');
    await card.first().click();

    await expect(page.locator('h2:has-text("Editar Categoría")')).toBeVisible();

    await page.locator('form input[type="text"]').fill('Temporada Actualizada');
    await page.locator('form button[type="submit"]').click();

    await expect(page.locator('text=actualizada exitosamente')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Temporada Actualizada')).toBeVisible();
  });

  test('should delete a category', async ({ page }) => {
    // Create a category to delete
    await page.click('button:has-text("Nueva Categoría")');
    await page.locator('form input[type="text"]').fill('Para Eliminar');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('text=creada exitosamente')).toBeVisible({ timeout: 5000 });

    page.on('dialog', (dialog) => dialog.accept());

    const card = page.locator('div').filter({ hasText: 'Para Eliminar' }).locator('button:has-text("Eliminar")');
    await card.first().click();

    await expect(page.locator('text=eliminada')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate with back button', async ({ page }) => {
    await page.click('button:has-text("Volver")');
    await expect(page).toHaveURL('/dashboard', { timeout: 3000 });
  });
});
