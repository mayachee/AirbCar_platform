import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for Airbcar E2E tests.
 *
 * Specs live in ./tests-e2e. Default run: `npm run test:e2e`.
 * - Local dev: starts `npm run dev` automatically on port 3001.
 * - CI / Vercel preview: set PLAYWRIGHT_BASE_URL=https://… before running
 *   to skip the local server and hit a remote target.
 */
const isCI = !!process.env.CI
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001'

export default defineConfig({
  testDir: './tests-e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // Run tests serially: the local Next.js dev server thrashes under
  // concurrent page loads (each page hit triggers fresh module compilation),
  // which causes ERR_CONNECTION_REFUSED in parallel runs. Serial keeps it
  // under 2 minutes for the current suite. Bump when we point baseURL at a
  // pre-built Vercel preview.
  workers: 1,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],

  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add 'firefox' / 'webkit' / mobile projects later when the suite stabilises.
  ],

  // Only manage the dev server when not pointed at a remote URL.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3001',
        reuseExistingServer: !isCI,
        timeout: 120_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
})
