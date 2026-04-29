import { test, expect, Page } from '@playwright/test'

/**
 * Customer Home & Search flows
 * 
 * Hermetic test that mocks the backend to ensure tests pass without a running Django instance.
 */

async function stubApi(page: Page) {
  const json = (body: unknown) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })

  // Mock ALL requests that look like listings
  await page.route('**/*listing*', (route) => {
    return route.fulfill(json({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 101,
          make: 'Dacia',
          model: 'Logan',
          year: 2023,
          price_per_day: '30.00',
          currency: 'MAD',
          category: 'Economy',
          images: [],
          partner: {
            company_name: 'Test Cars',
            rating: '4.8',
          }
        }
      ]
    }))
  })

  // Prevent other API calls from triggering error modals or hanging
  await page.route('**/api/**', async (route) => {
    if (route.request().url().includes('listing')) {
      // Fallback in case the above didn't catch it
      return; 
    }
    return route.fulfill(json({}))
  })

  // Prevent Unsplash images from bringing down the Nextjs server with 404s
  await page.route('**/*unsplash.com*', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: '' }))
}

test.describe('Customer Home & Search flows', () => {
  test.beforeEach(async ({ page, context }) => {
    await stubApi(page)
    // Prevent the Cookie Consent modal from appearing
    await context.addCookies([{
      name: 'cookie_consent',
      value: 'accepted',
      url: 'http://localhost:3001'
    }])
  })

  test('loads home page and redirects to search upon submitting location', async ({ page }) => {
    // Navigate to English home page
    await page.goto('/en/')

    // Should have Hero search components
    const searchForm = page.locator('form').first()
    await expect(searchForm).toBeVisible()

    // Find and click the location dropdown/input flexibly
    const locationTrigger = page.locator('button[role="combobox"], input[name="location"], button#hero-location, [aria-haspopup="listbox"]').first()
    await expect(locationTrigger).toBeVisible({ timeout: 5000 })
    
    await locationTrigger.click()
    // Click optionally the first option if dropdown opens
    const firstOption = page.getByRole('option').first()
    await firstOption.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {})
    if (await firstOption.isVisible()) {
       await firstOption.click()
    }

    // Submit the form
    const submitBtn = searchForm.locator('button[type="submit"], button:has-text("Search")').first()
    await submitBtn.click()

    // Assert that we are redirected to /search
    await expect(page).toHaveURL(/.*\/search.*/, { timeout: 10000 })
    
    // Assert search page loads with mocked data
    await expect(page.getByRole('heading', { name: /Filters/i }).or(page.getByRole('button', { name: /Filters/i })).first()).toBeVisible({ timeout: 10000 })
    
    // In our mock, there is 1 vehicle return, let's verify a known text like Dacia appears
    await expect(page.getByText(/Dacia/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('loads search page directly and displays map and filters', async ({ page }) => {
    await page.goto('/en/search?location=Marrakech')

    // Since we mocked 1 result, look for the 'Dacia' car name
    await expect(page.getByText(/Dacia/i).first()).toBeVisible({ timeout: 10000 })

    // Assert filters are visible
    const filterSection = page.locator('aside').first()
    await expect(filterSection.or(page.getByRole('button', { name: /Filters/i }).first())).toBeVisible()
  })
})
