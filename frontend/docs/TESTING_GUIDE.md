# Testing Guide

## Setup Complete ✅

Your testing framework is now configured with:
- **Jest** - Test runner
- **@testing-library/react** - React component testing
- **@testing-library/jest-dom** - Custom matchers

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## Test Files Created

### 1. Configuration Files
- ✅ `jest.config.js` - Jest configuration
- ✅ `jest.setup.js` - Test setup and mocks
- ✅ `__mocks__/` - Mock files for static assets

### 2. Example Tests
- ✅ `src/components/layout/__tests__/Header.test.js` - Header component tests
- ✅ `src/lib/booking/__tests__/BookingManager.test.ts` - BookingManager tests
- ✅ `src/app/booking/components/__tests__/BookingForm.test.js` - BookingForm tests

## Testing Best Practices

### ✅ DO

1. **Test User Behavior**
   ```js
   // ✅ Good - Test what user sees
   expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
   ```

2. **Use Accessible Queries**
   ```js
   // ✅ Good - Use role-based queries
   screen.getByRole('button', { name: 'Submit' })
   screen.getByLabelText('Email')
   screen.getByPlaceholderText('Enter email')
   ```

3. **Test Async Behavior**
   ```js
   await waitFor(() => {
     expect(mockFunction).toHaveBeenCalled();
   });
   ```

4. **Use screen Object**
   ```js
   // ✅ Good
   import { render, screen } from '@testing-library/react';
   
   render(<Component />);
   screen.getByText('Hello');
   ```

### ❌ DON'T

1. **Don't Test Implementation Details**
   ```js
   // ❌ Bad - Testing internal state
   expect(component.state.isVisible).toBe(true);
   
   // ✅ Good - Testing user-visible behavior
   expect(screen.getByText('Hello')).toBeInTheDocument();
   ```

2. **Don't Query by Class**
   ```js
   // ❌ Bad - Fragile selector
   container.querySelector('.btn-primary')
   
   // ✅ Good - Semantic selector
   screen.getByRole('button', { name: 'Submit' })
   ```

3. **Avoid Unnecessary Tests**
   ```js
   // ❌ Bad - Testing React itself
   it('calls setState', () => {
     component.setState({ value: 'test' });
     expect(component.state.value).toBe('test');
   });
   ```

## Test Coverage Goals

- **Minimum**: 50% coverage
- **Good**: 70% coverage
- **Excellent**: 80%+ coverage

## Quick Test Creation

### Component Test Template
```js
import { render, screen } from '@testing-library/react';
import Component from '../Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByRole('...')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    // Test user interactions
  });
});
```

## Common Patterns

### Testing with Hooks
```js
import { renderHook } from '@testing-library/react';

it('returns correct values', () => {
  const { result } = renderHook(() => useCustomHook());
  expect(result.current.value).toBe(expected);
});
```

### Testing Async Operations
```js
it('loads data', async () => {
  render(<Component />);
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('Loaded!')).toBeInTheDocument();
  });
});
```

### Testing User Events
```js
import { fireEvent } from '@testing-library/react';

it('handles click', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  fireEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

## Next Steps

1. ✅ Run `npm test` to see tests passing
2. 📝 Write tests for critical components
3. 📊 Check coverage with `npm run test:coverage`
4. 🔄 Integrate tests into CI/CD pipeline

## Resources

- [Testing Library Documentation](https://testing-library.com/)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

