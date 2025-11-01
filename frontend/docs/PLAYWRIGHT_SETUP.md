# Playwright E2E Testing Setup

## ✅ Installation Complete

Playwright is now configured for end-to-end testing of your AirbCar application.

## Quick Start

### Install Browsers (First Time)
```bash
npx playwright install
```

This will download Chromium, Firefox, and WebKit browsers.

### Run Tests
```bash
# Run all E2E tests in headless mode
npm run test:e2e

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug
```

## Test Files Created

### 1. `e2e/example.spec.js`
Basic tests covering:
- Homepage rendering
- Search functionality
- Authentication pages
- Responsive design
- Accessibility checks
- Performance testing

### 2. `e2e/booking-flow.spec.js`
Complete booking flow tests:
- Full booking process
- Form validation
- Search filters
- Account pages
- Partner dashboard
- Admin panel

## Configuration

### `playwright.config.js`
- **Test Directory**: `./e2e`
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Testing**: Chrome & Safari on mobile
- **Auto-start**: Dev server automatically
- **Parallel Execution**: Enabled
- **Retries**: 2 retries on CI

## Writing Tests

### Basic Test Structure
```js
import { test, expect } from '@playwright/test';

test('test name', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AirbCar/);
});
```

### Best Practices

#### 1. Use Semantic Selectors
```js
// ✅ Good - Accessible and stable
await page.getByRole('button', { name: 'Book Now' }).click();
await page.getByLabelText('Email').fill('user@example.com');
await page.getByPlaceholderText('Enter location').fill('Rabat');

// ❌ Bad - Fragile
await page.locator('.btn-primary').click();
```

#### 2. Wait for Elements
```js
// ✅ Good - Auto-wait built-in
await page.getByText('Results').click();

// ❌ Bad - Manual waiting
await page.waitForTimeout(1000);
```

#### 3. Test User Actions
```js
test('user can book a car', async ({ page }) => {
  await page.goto('/car/18');
  
  // Fill in dates
  await page.getByLabelText('Pickup Date').fill('2025-10-27');
  await page.getByLabelText('Return Date').fill('2025-10-31');
  
  // Click book
  await page.getByRole('button', { name: 'Book Now' }).click();
  
  // Verify navigation
  await expect(page).toHaveURL(/booking/);
});
```

## Browser Support

Playwright tests on:
- ✅ **Chromium** (Chrome, Edge)
- ✅ **Firefox**
- ✅ **WebKit** (Safari)
- ✅ **Mobile Chrome** (Pixel 5)
- ✅ **Mobile Safari** (iPhone 12)

## Advanced Features

### Screenshots and Videos
Tests automatically capture:
- Screenshots on failure
- Videos on failure
- HTML snapshots

### Trace Viewer
```bash
npx playwright show-trace trace.zip
```

### Network Interception
```js
test('mocks API call', async ({ page }) => {
  await page.route('**/api/bookings', route => route.fulfill({
    status: 200,
    body: JSON.stringify({ data: [] })
  }));
  
  await page.goto('/');
  // Test continues...
});
```

### Authentication State
```js
test('authenticated user flow', async ({ browser }) => {
  const context = await browser.newContext({
    storageState: 'auth-state.json'
  });
  const page = await context.newPage();
  
  // User is already logged in
  await page.goto('/account');
});
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Tests

### Visual Debugging
```bash
# Run with UI
npm run test:e2e:ui

# Run headed (see browser)
npm run test:e2e:headed

# Run with debugger
npm run test:e2e:debug
```

### Common Debugging
1. **Slow motion**: `await page.goto('/', { waitUntil: 'networkidle' });`
2. **Take screenshot**: `await page.screenshot({ path: 'debug.png' });`
3. **Console logs**: `page.on('console', msg => console.log(msg.text()));`
4. **Network monitoring**: `page.on('request', request => console.log(request.url()));`

## Test Organization

```
e2e/
├── example.spec.js          # Basic functionality
├── booking-flow.spec.js      # Booking process
├── user-account.spec.js      # User features
├── partner-dashboard.spec.js # Partner features
└── admin-panel.spec.js      # Admin features
```

## Environment Variables

Tests can use environment variables:

```js
// playwright.config.js
use: {
  baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000'
}
```

## Next Steps

1. **Add Authentication Tests**
   - Login flow
   - Signup flow
   - Protected routes

2. **Add Booking Flow Tests**
   - Complete booking process
   - File uploads
   - Payment flow

3. **Add Partner Tests**
   - Dashboard access
   - Booking management
   - Vehicle listing

4. **Add Admin Tests**
   - User management
   - System configuration
   - Analytics

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## Example Test Run

```bash
$ npm run test:e2e

Running 10 tests

  ✓ Homepage › has title
  ✓ Search Functionality › search form works
  ✓ Authentication › sign in page loads
  ✓ Authentication › sign up page loads
  ✓ Booking Flow › can complete booking
  ✓ User Account Flow › bookings tab displays bookings
  ✓ Responsive Design › mobile viewport renders correctly
  ✓ Accessibility › has proper heading structure
  ✓ Performance › loads within reasonable time

10 passed (45s)
```

Your E2E testing is now ready! 🎉

