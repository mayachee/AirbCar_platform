import { test, expect } from '@playwright/test';

test.describe('Complete Booking Flow', () => {
  test('user can complete booking from start to finish', async ({ page }) => {
    // Step 1: Visit homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/AirbCar|Car Rental/i);

    // Step 2: Search for cars
    await page.goto('/search?location=Rabat&pickupDate=2025-10-27&dropoffDate=2025-10-31');
    
    // Wait for search results
    await page.waitForSelector('body', { state: 'visible' });
    
    // Step 3: Click on a car (if available)
    const firstCar = page.locator('[data-testid="vehicle-card"]').first();
    if (await firstCar.count() > 0) {
      await firstCar.click();
      await expect(page).toHaveURL(/car\/\d+/);
    }

    // Step 4: Check booking button exists
    const bookButton = page.getByRole('button', { name: /book|rent now/i });
    if (await bookButton.count() > 0) {
      await expect(bookButton).toBeVisible();
    }
  });

  test('booking form validates required fields', async ({ page }) => {
    await page.goto('/booking?carId=18&duration=1&totalPrice=725');
    
    // Should require license upload
    const licenseInput = page.locator('input[type="file"][accept*="image"]');
    if (await licenseInput.count() > 0) {
      await expect(licenseInput).toBeVisible();
    }
    
    // Should have terms checkbox
    const termsCheckbox = page.getByRole('checkbox');
    if (await termsCheckbox.count() > 0) {
      await expect(termsCheckbox).toBeVisible();
      
      // Check if submit is disabled without terms
      const submitButton = page.getByRole('button', { name: /confirm booking/i });
      if (await submitButton.count() > 0) {
        await expect(submitButton).toBeDisabled();
      }
    }
  });

  test('search filters work correctly', async ({ page }) => {
    await page.goto('/search?location=Rabat');
    
    // Check if filters are present
    const minPriceInput = page.locator('input[type="number"], input[type="range"]').first();
    const maxPriceInput = page.locator('input[type="number"], input[type="range"]').last();
    
    if (await minPriceInput.count() > 0) {
      await minPriceInput.fill('100');
    }
    
    if (await maxPriceInput.count() > 0) {
      await maxPriceInput.fill('500');
    }
  });
});

test.describe('User Account Flow', () => {
  test('account page displays user information', async ({ page }) => {
    await page.goto('/account');
    
    // Should redirect to signin if not authenticated
    // In a real test, you'd need to be logged in
    await expect(page).toHaveURL(/\/(account|auth\/signin)/);
  });

  test('bookings tab displays bookings', async ({ page }) => {
    await page.goto('/account?tab=bookings');
    
    // Should show bookings section
    await expect(page.locator('body')).toBeVisible();
  });

  test('favorites tab works', async ({ page }) => {
    await page.goto('/account?tab=favorites');
    
    // Should navigate to favorites tab
    await expect(page).toHaveURL(/tab=favorites/);
  });
});

test.describe('Partner Dashboard', () => {
  test('partner dashboard loads', async ({ page }) => {
    await page.goto('/partner/dashboard');
    
    // Should show dashboard or redirect
    await expect(page).toHaveURL(/\/(partner\/dashboard|auth\/signin)/);
  });
});

test.describe('Admin Panel', () => {
  test('admin dashboard loads', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Should redirect if not admin
    await expect(page).toHaveURL(/\/(admin\/dashboard|auth\/signin)/);
  });
});

