import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('has title', async ({ page }) => {
    await page.goto('/');
    
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/AirbCar|Car Rental/i);
  });

  test('has navigation', async ({ page }) => {
    await page.goto('/');
    
    // Look for navigation elements
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});

test.describe('Search Functionality', () => {
  test('search form works', async ({ page }) => {
    await page.goto('/');
    
    // Fill search form
    const locationInput = page.getByPlaceholderText(/location/i).or(page.getByLabelText(/location/i));
    await locationInput.fill('Rabat');
    
    const pickupDate = page.getByLabelText(/pickup|start/i);
    await pickupDate.fill('2025-10-27');
    
    const returnDate = page.getByLabelText(/return|dropoff|end/i);
    await returnDate.fill('2025-10-31');
    
    // Click search button
    await page.getByRole('button', { name: /search|find/i }).click();
    
    // Should navigate to search page
    await expect(page).toHaveURL(/search/);
  });
});

test.describe('Authentication', () => {
  test('sign in page loads', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check for sign in form
    await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();
    
    // Check for email and password fields
    await expect(page.getByLabelText(/email/i)).toBeVisible();
    await expect(page.getByLabelText(/password/i)).toBeVisible();
  });

  test('sign up page loads', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Check for sign up form
    await expect(page.getByRole('heading', { name: /sign up|register|create/i })).toBeVisible();
  });
});

test.describe('Booking Flow', () => {
  test('can navigate to booking page', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to search
    await page.goto('/search?location=Rabat');
    
    // Should show search results
    const content = await page.textContent('body');
    expect(content).toContain('Rabat');
  });
});

test.describe('Responsive Design', () => {
  test('mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await page.goto('/');
    
    // Should still be usable on mobile
    await expect(page).toHaveTitle(/.+/);
  });

  test('tablet viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.goto('/');
    
    await expect(page).toHaveTitle(/.+/);
  });
});

test.describe('Accessibility', () => {
  test('has proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    const h1 = page.getByRole('heading', { level: 1 });
    if (await h1.count() > 0) {
      await expect(h1.first()).toBeVisible();
    }
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const alt = await images.nth(i).getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    }
  });
});

test.describe('Performance', () => {
  test('loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds (adjust based on your needs)
    expect(loadTime).toBeLessThan(10000);
  });
});

