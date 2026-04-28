import { test, expect, Page } from '@playwright/test'

/**
 * V1 · Marketplace Board smoke test.
 *
 * Hermetic: stubs the backend so the test passes without a running Django.
 * Asserts:
 *   1. The page renders the "Inter-Agency Marketplace" heading.
 *   2. The shared B2B sub-nav is mounted with its five tabs.
 *   3. The empty-state copy shows when the network has no B2B inventory.
 */

const FAKE_JWT = 'header.eyJ1c2VyX2lkIjoxLCJyb2xlIjoicGFydG5lciJ9.sig'

/**
 * Pretend the user is logged in. We don't need a real token because the
 * marketplace page checks data via API responses, which we mock; the token
 * just keeps the apiClient from wiping localStorage on a 401.
 */
async function fakeLogin(page: Page) {
  await page.addInitScript((token) => {
    window.localStorage.setItem('access_token', token)
    window.localStorage.setItem('refresh_token', token)
  }, FAKE_JWT)
}

/**
 * Hermetic backend stub. Intercepts every outbound request to the Django
 * API base (localhost:8000 in dev, the Render host in prod) and serves
 * deterministic empty responses keyed by path. Anything not explicitly
 * mocked returns 200 / {} so a stray prefetch never trips a 401 redirect.
 */
async function stubB2bApi(page: Page) {
  const json = (body: unknown) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
  // String-predicate route — runs against the full URL, no glob ambiguity.
  await page.route(
    (url) => /(?:localhost:8000|airbcar-backend\.onrender\.com)\/.*/.test(url.toString()),
    (route) => {
      const u = new URL(route.request().url())
      const path = u.pathname
      if (path.startsWith('/partners/b2b/listings')) {
        return route.fulfill(json({ data: [], count: 0 }))
      }
      if (path.startsWith('/partners/car-shares')) {
        return route.fulfill(json({ data: [] }))
      }
      if (path.startsWith('/users/me')) {
        return route.fulfill(
          json({ id: 1, email: 'tester@airbcar.dev', role: 'partner', is_partner: true }),
        )
      }
      // Catch-all so auth context bootstrap & accidental prefetches never
      // surface as ERR_CONNECTION_REFUSED.
      return route.fulfill(json({}))
    },
  )
}

test.describe('B2B V1 · Marketplace Board', () => {
  test.beforeEach(async ({ page }) => {
    await fakeLogin(page)
    await stubB2bApi(page)
  })

  test('renders heading, sub-nav, and empty state when network is empty', async ({ page }) => {
    await page.goto('/en/partner/b2b')

    // 1. Heading
    await expect(
      page.getByRole('heading', { name: 'Inter-Agency Marketplace' }),
    ).toBeVisible()

    // 2. Sub-nav — five tabs, all clickable links
    const subnav = page.getByRole('navigation').first()
    for (const label of ['Marketplace', 'Deals', 'Browse', 'My Requests', 'Fleet Map']) {
      await expect(subnav.getByRole('link', { name: label })).toBeVisible()
    }

    // 3. Empty state when both offers and requests are []
    await expect(page.getByText('Nothing posted in this view yet.')).toBeVisible()
  })

  test('switches to "Offering" tab without leaving the page', async ({ page }) => {
    await page.goto('/en/partner/b2b')

    const offeringTab = page.getByRole('button', { name: /^Offering$/ })
    await offeringTab.click()

    // Empty state still renders since there are no offers.
    await expect(page.getByText('Nothing posted in this view yet.')).toBeVisible()
    await expect(page).toHaveURL(/\/en\/partner\/b2b\/?$/)
  })
})
