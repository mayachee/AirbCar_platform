# Testing Guide - AirbCar Frontend

## Testing Stack

### 1. Unit & Integration Tests (Jest + React Testing Library)
Location: `src/**/*.test.js`, `src/**/*.test.ts`

```bash
# Run all unit tests
npm test

# Run in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### 2. End-to-End Tests (Playwright)
Location: `e2e/**/*.spec.js`

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

## Test Coverage

### Current Test Files

#### Unit Tests (Jest)
- ✅ `Header.test.js` - Header component
- ✅ `BookingManager.test.ts` - Booking logic
- ✅ `BookingForm.test.js` - Booking form component

#### E2E Tests (Playwright)
- ✅ `example.spec.js` - Basic functionality
- ✅ `booking-flow.spec.js` - Complete booking flow

### Coverage Goals
- **Minimum**: 50%
- **Good**: 70%
- **Excellent**: 80%+

## Running All Tests

```bash
# Run everything
npm test && npm run test:e2e

# Or sequentially
npm test
npm run test:e2e
```

## Writing New Tests

### Jest Unit Test Example
```js
import { render, screen } from '@testing-library/react';
import Component from './Component';

test('renders component', () => {
  render(<Component />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Playwright E2E Test Example
```js
import { test, expect } from '@playwright/test';

test('user can search cars', async ({ page }) => {
  await page.goto('/search');
  await page.getByLabel('Location').fill('Rabat');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL(/search/);
});
```

## Continuous Integration

### GitHub Actions Workflows
- `.github/workflows/playwright.yml` - E2E tests on push/PR

### Test Pipeline
1. Lint code
2. Run unit tests
3. Build application
4. Run E2E tests
5. Upload reports

## Resources

- 📘 [Jest Setup](./docs/TESTING_GUIDE.md)
- 🎭 [Playwright Setup](./docs/PLAYWRIGHT_SETUP.md)
- 📊 [Code Quality](./docs/CODE_QUALITY.md)
- 🎫 [Booking Integration](./docs/BOOKING_INTEGRATION.md)

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm test` | Run Jest unit tests |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:e2e` | Run Playwright E2E |
| `npm run test:e2e:ui` | E2E with UI |
| `npm run test:e2e:debug` | Debug E2E tests |

## Best Practices

### Unit Tests
- ✅ Test behavior, not implementation
- ✅ Use accessible queries
- ✅ Keep tests focused
- ✅ Mock external dependencies

### E2E Tests
- ✅ Test user workflows
- ✅ Use semantic selectors
- ✅ Test critical paths
- ✅ Include edge cases

### Both
- ✅ Clear test names
- ✅ Independent tests
- ✅ Fast execution
- ✅ Reliable results

