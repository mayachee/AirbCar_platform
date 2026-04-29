import { test, expect, Page } from '@playwright/test'

/**
 * Customer Dashboard Flow Suite
 *
 * Hermetic test configuring API mocks for account endpoints
 */

const FAKE_JWT = 'header.eyJ1c2VyX2lkIjoxLCJyb2xlIjoiY3VzdG9tZXIifQ.sig'

async function fakeCustomerLogin(page: Page) {
  await page.addInitScript((token) => {
    window.localStorage.setItem('access_token', token)
    window.localStorage.setItem('refresh_token', token)
  }, FAKE_JWT)
}

async function stubAccountApi(page: Page) {
  const json = (body: unknown) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })

  await page.route(
    (url) => /(?:localhost:8000|airbcar-backend\.onrender\.com)\/.*/.test(url.toString()),
    (route) => {
      const u = new URL(route.request().url())
      const path = u.pathname

      // Mock user profile
      if (path.startsWith('/users/me')) {
        return route.fulfill(json({
          id: 1,
          email: 'customer@example.com',
          username: 'customer',
          first_name: 'Regular',
          last_name: 'Customer',
          role: 'customer',
          phone_number: '123456789',
        }))
      }

      // Mock user profile extra data
      if (path.startsWith('/users/profile')) {
          return route.fulfill(json({
              user: 1,
              preferences: {}
          }))
      }

      // Mock upcoming/past bookings
      if (path.startsWith('/users/bookings') || path.startsWith('/bookings')) {
        return route.fulfill(json({
          count: 1,
          results: [
            {
              id: 999,
              status: 'confirmed',
              start_date: '2026-10-01',
              end_date: '2026-10-05',
              total_price: '150.00',
              listing: {
                id: 101,
                make: 'Renault',
                model: 'Clio',
                partner: { company_name: 'Test Partner' }
              }
            }
          ]
        }))
      }

      // Mock favorites
      if (path.startsWith('/favorites') || path.startsWith('/users/favorites')) {
        return route.fulfill(json({
          count: 0,
          results: []
        }))
      }

      // Allow others empty response
      return route.fulfill(json({}))
    }
  )
}

test.describe('Customer Dashboard flows', () => {
  test.beforeEach(async ({ page }) => {
    await fakeCustomerLogin(page)
    await stubAccountApi(page)
  })

  test('loads customer dashboard with correctly stubbed data', async ({ page }) => {
    await page.goto('/en/account')

    // Wait for the Welcome message to appear
    await expect(page.getByText(/Welcome back, Regular/i).or(page.getByRole('heading', { name: /Welcome back, Regular/i }))).toBeVisible()

    // Assert that the sidebar tabs are loaded
    await expect(page.getByRole('button', { name: /Profile/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Bookings/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Favorites/i })).toBeVisible()
  })

  test('navigates to Bookings tab and sees mock booking', async ({ page }) => {
    await page.goto('/en/account?tab=bookings')

    // The booking tab should be visible
    // Depending on the exact locale, "Bookings" or "Booking" will be present
    const bookingsTabHeaders = page.locator('button', { hasText: /Bookings/i })
    if (await bookingsTabHeaders.count() > 0) {
       await bookingsTabHeaders.first().click()
    }

    // Look for our mocked booking data
    await expect(page.getByText('Renault Clio').or(page.getByText('Renault'))).toBeVisible()
    // Status
    await expect(page.getByText(/Confirmed|150/i).first()).toBeVisible()
  })
})
