import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testPassword = 'Test1234';

  test('should register a new user successfully', async ({ page }) => {
    const testEmail = `test-${Date.now()}@fintech.com`;
    await page.goto('/register');

    // Fill registration form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'User');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success toast
    await expect(page.locator('text=Cuenta creada exitosamente')).toBeVisible({
      timeout: 5000,
    });

    // Should redirect to login (after 2 second delay in the component)
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should show error (either inline or toast)
    await expect(
      page.locator('text=/error|inválido|correo/i').first()
    ).toBeVisible({ timeout: 3000 });
  });

  test('should login with valid credentials', async ({ page }) => {
    // First register
    await page.goto('/register');
    const uniqueEmail = `test-login-${Date.now()}@fintech.com`;
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Login');
    await page.click('button[type="submit"]');
    await page.waitForURL('/login', { timeout: 10000 });

    // Now login
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should see success toast and redirect to dashboard
    await expect(page.locator('text=/Inicio de sesión exitoso/i')).toBeVisible({
      timeout: 5000,
    });
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'nonexistent@fintech.com');
    await page.fill('input[type="password"]', 'WrongPassword1');
    await page.click('button[type="submit"]');

    // Should show error toast or message
    await expect(page.locator('text=/error|inválid|incorrecta/i').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/register');
    const uniqueEmail = `test-logout-${Date.now()}@fintech.com`;
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'Logout');
    await page.click('button[type="submit"]');
    await page.waitForURL('/login', { timeout: 10000 });

    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Click logout
    await page.click('text=Cerrar Sesión');

    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 3000 });
  });
});
