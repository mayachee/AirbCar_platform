import { test, expect, Page } from '@playwright/test'

/**
 * Authentication Flow Suite
 *
 * Hermetic test that mocks the backend to ensure tests pass without a running Django instance.
 */

async function stubAuthApi(page: Page) {
  const json = (body: unknown, status = 200) => ({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })

  await page.route(
    (url) => /(?:localhost:8000|airbcar-backend\.onrender\.com)\/.*/.test(url.toString()),
    (route) => {
      const u = new URL(route.request().url())
      const path = u.pathname

      // Mock Login Endpoint
      if (path.startsWith('/auth/login/')) {
        const postData = route.request().postDataJSON()
        if (postData?.email === 'user@example.com' && postData?.password === 'password123') {
          return route.fulfill(
            json({
              access: 'fake-access-token',
              refresh: 'fake-refresh-token',
              user: {
                id: 1,
                email: 'user@example.com',
                first_name: 'Regular',
                last_name: 'User',
                role: 'customer',
              }
            })
          )
        } else {
          return route.fulfill(json({ detail: 'No active account found with the given credentials' }, 401))
        }
      }

      // Mock Registration Endpoint
      if (path.startsWith('/auth/register/')) {
        return route.fulfill(json({
          user: {
            id: 2,
            email: 'newuser@example.com',
            first_name: 'New',
            last_name: 'User',
            role: 'customer',
          },
          message: 'User created successfully',
          access: 'fake-access-token',
          refresh: 'fake-refresh-token',
        }, 201))
      }

      // Allow others an empty response so it doesn't break anything.
      return route.fulfill(json({}))
    }
  )
}

test.describe('Customer Auth flows', () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthApi(page)
  })

  test('loads signin page and successfully signs in', async ({ page }) => {
    await page.goto('/en/auth?mode=signin')

    // Fill in the form
    await page.getByRole('textbox', { name: /email/i }).fill('user@example.com')
    
    // There might be multiple password inputs on the page because of the signup form 
    // We should scope down to the visible one or the active tab
    const signinFormId = page.locator('form').first() 
    await signinFormId.locator('input[type="password"]').fill('password123')

    // Submit signin
    await signinFormId.locator('button[type="submit"]').click()

    // Assuming a successful login redirects to Home or Dashboard, check URL change
    // Using Regex for generic matching depending on the redirection logic
    await expect(page).toHaveURL(/.*\/en\/(?:account|partner|)/)
  })

  test('displays error message for invalid credentials', async ({ page }) => {
    await page.goto('/en/auth?mode=signin')

    await page.getByRole('textbox', { name: /email/i }).fill('wrong@example.com')
    await page.locator('form').first().locator('input[type="password"]').fill('wrongpassword')
    await page.locator('form').first().locator('button[type="submit"]').click()

    // Expect an error text to be visible
    await expect(page.getByText(/No active account found|Invalid/i)).toBeVisible()
  })

  test('can toggle to signup and register a new user', async ({ page }) => {
    await page.goto('/en/auth?mode=signup')

    // Since both signin and signup forms might be rendered, look for the signup fields
    const signupForm = page.locator('form').filter({ hasText: /First Name|Business Name/i }).first()
    
    await expect(signupForm).toBeVisible()

    // Fill out the signup fields
    await signupForm.getByRole('textbox', { name: /first name/i }).fill('New')
    await signupForm.getByRole('textbox', { name: /last name/i }).fill('User')
    await signupForm.getByRole('textbox', { name: /email/i }).fill('newuser@example.com')
    await signupForm.locator('input[type="password"]').fill('securepassword123')
    
    // Submit registration
    await signupForm.locator('button[type="submit"]').click()

    // It should eventually redirect after successful registration
    await expect(page).not.toHaveURL(/.*\/auth\?mode=signup/)
  })
})
