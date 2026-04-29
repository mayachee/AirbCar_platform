import { test, expect, Page } from '@playwright/test';

const FAKE_JWT = 'header.eyJ1c2VyX2lkIjoxLCJyb2xlIjoicGFydG5lciJ9.sig';

async function fakeLogin(page: Page) {
  await page.addInitScript((token) => {
    window.localStorage.setItem('access_token', token);
    window.localStorage.setItem('refresh_token', token);
    document.cookie = 'cookie_consent=accepted; path=/';
  }, FAKE_JWT);
}

async function stubPartnerApi(page: Page) {
  const json = (body: unknown) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

  await page.route(
    (url) => /(?:localhost:8000|airbcar-backend\.onrender\.com)\/.*/.test(url.toString()),
    (route) => {
      const u = new URL(route.request().url());
      const path = u.pathname;
      if (path.startsWith('/users/me')) {
        return route.fulfill(
          json({ id: 1, email: 'tester@airbcar.dev', role: 'partner', is_partner: true }),
        );
      }
      if (path.includes('/verify-token')) {
        return route.fulfill(
          json({ user: { id: 1, email: 'tester@airbcar.dev', role: 'partner', is_partner: true } }),
        );
      }
      if (path.startsWith('/partners/me')) {
        return route.fulfill(json({ data: { id: 10, user: 1, company_name: 'Test Agency', status: 'approved' } }));
      }
      // Return empty sets for lists, empty metrics for stats
      return route.fulfill(json({ 
        data: { data: [], results: [] }, 
        results: [], 
        count: 0,
        total_vehicles: 0,
        active_bookings: 0,
        monthly_earnings: 0,
        growth_rate: 0
      }));
    },
  );
}

test.describe('Partner Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await fakeLogin(page);
    await stubPartnerApi(page);
  });

  test('renders main dashboard overview with quick stats', async ({ page }) => {
    await page.goto('/en/partner/dashboard');
    
    // Check main quick stats titles are visible (using translations from en.json)
    await expect(page.getByText('Total Vehicles', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Active Bookings', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Pending Requests', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Monthly Earnings', { exact: true }).first()).toBeVisible();
  });

  test('navigates to Vehicles (Listings) tab via sidebar', async ({ page }) => {
    await page.goto('/en/partner/dashboard');
    
    // The sidebar contains links/buttons, 'Vehicles' is one of them. Next-intl 'nav_vehicles'
    // It might also have a badge with '0' inside the button accessible name.
    await page.getByRole('button', { name: /Vehicles/i }).click();
    
    // Assert we see the add vehicle option or active listings info
    await expect(page.getByRole('button', { name: /Add Vehicle/i })).toBeVisible();
  });

  test('navigates to Earnings tab via sidebar', async ({ page }) => {
    await page.goto('/en/partner/dashboard');
    
    // Earnings tab
    await page.getByRole('button', { name: /Earnings/i }).click();
    
    // Since stub returns 0s, we should at least see the basic UI elements for the Earnings page
    await expect(page.getByRole('heading', { name: /Earnings/i }).first()).toBeVisible();
  });

  test('navigates to Analytics tab via sidebar', async ({ page }) => {
    await page.goto('/en/partner/dashboard');
    
    // Analytics tab
    await page.getByRole('button', { name: /Analytics/i }).click();
    
    // Advanced Analytics component text
    await expect(page.getByText(/Analytics/i)).not.toHaveCount(0);
  });
});
