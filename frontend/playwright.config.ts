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
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],

  expect: {
    timeout: 5_000,
  },

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
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
