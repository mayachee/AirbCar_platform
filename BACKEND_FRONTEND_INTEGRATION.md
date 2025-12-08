# Backend-Frontend Integration Improvements

This document outlines all improvements made to enhance the connection between the Django backend and Next.js frontend.

## 🚀 Enhanced API Client

### New Features

#### 1. **Automatic Token Refresh**
- Automatically refreshes expired access tokens
- Seamless token renewal without user interruption
- Handles 401 errors by attempting token refresh before failing

#### 2. **Request/Response Interceptors**
- **Request Interceptors**: Modify requests before sending (add headers, logging, etc.)
- **Response Interceptors**: Process responses before returning
- **Error Interceptors**: Enhance error messages and handling

#### 3. **Connection Health Monitoring**
- Real-time connection status tracking (`online`, `offline`, `degraded`)
- Automatic health checks every 30 seconds
- Monitors browser online/offline events
- Connection status component for visual feedback

#### 4. **Exponential Backoff Retry**
- Automatic retry on network errors and 5xx server errors
- Exponential backoff: 1s, 2s, 4s, 8s, max 10s
- Configurable retry count (default: 3 attempts)
- Smart retry logic (only retries on recoverable errors)

#### 5. **Request Queuing**
- Queues requests when offline
- Automatically processes queue when connection restored
- Prevents request loss during network interruptions

#### 6. **Improved Error Handling**
- Better error messages with context
- Network error detection and handling
- Timeout error handling with clear messages
- CORS error detection
- HTML error page detection (404 handling)

#### 7. **Enhanced Caching**
- Client-side response caching
- Cache invalidation on mutations
- Configurable cache TTL
- Cache statistics

## 📦 New Components

### 1. Enhanced API Client (`enhancedClient.ts`)
- Drop-in replacement for existing `apiClient`
- All features of original client plus enhancements
- Backward compatible

### 2. Connection Monitor (`connectionMonitor.tsx`)
- Visual indicator of API connection status
- Shows queued requests
- Real-time updates
- Optional detailed view

### 3. API Health Hook (`useApiHealth.ts`)
- React hook for monitoring API health
- Returns connection status, queue length, latency
- Automatic health checks
- Easy integration in any component

## 🔧 Integration Guide

### Using Enhanced Client

```typescript
import { enhancedApiClient } from '@/lib/api/enhancedClient';

// Use enhanced client (automatically handles retries, token refresh, etc.)
const response = await enhancedApiClient.get('/bookings/');
```

### Adding Interceptors

```typescript
import { enhancedApiClient } from '@/lib/api/enhancedClient';
import { requestIdInterceptor, loggingInterceptor } from '@/lib/api/interceptors';

// Add request interceptor
enhancedApiClient.addRequestInterceptor(requestIdInterceptor);
enhancedApiClient.addRequestInterceptor(loggingInterceptor);
```

### Using Connection Monitor

```tsx
import ConnectionMonitor from '@/lib/api/connectionMonitor';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <ConnectionMonitor />
    </>
  );
}
```

### Using API Health Hook

```tsx
import { useApiHealth } from '@/hooks/useApiHealth';

export default function MyComponent() {
  const { status, isOnline, latency, hasQueuedRequests } = useApiHealth();
  
  return (
    <div>
      {!isOnline && <p>Connection offline. Requests will be queued.</p>}
      {hasQueuedRequests && <p>Processing queued requests...</p>}
      {latency && <p>API latency: {latency}ms</p>}
    </div>
  );
}
```

## 🎯 Benefits

### 1. **Reliability**
- Automatic retry on failures
- Token refresh prevents authentication errors
- Request queuing prevents data loss

### 2. **User Experience**
- Seamless token refresh (no login interruptions)
- Visual connection status
- Better error messages
- Offline request queuing

### 3. **Performance**
- Response caching reduces API calls
- Connection health monitoring prevents unnecessary requests
- Exponential backoff prevents server overload

### 4. **Developer Experience**
- Interceptors for easy customization
- Health monitoring hooks
- Better error messages for debugging
- Type-safe API calls

## 🔄 Migration Path

### Option 1: Gradual Migration
- Keep using `apiClient` for existing code
- Use `enhancedApiClient` for new features
- Both clients work simultaneously

### Option 2: Full Migration
- Replace all `apiClient` imports with `enhancedApiClient`
- Update services to use enhanced client
- Test thoroughly

## 📊 Monitoring

### Connection Status
- **Online**: All requests go through normally
- **Degraded**: Some requests may fail, but retries are active
- **Offline**: Requests are queued until connection restored

### Metrics Available
- Connection status
- Queue length
- Last health check time
- API latency
- Cache statistics

## 🛠️ Configuration

### Environment Variables
```env
NEXT_PUBLIC_DJANGO_API_URL=https://airbcar-backend.onrender.com
NEXT_PUBLIC_API_URL=https://airbcar-backend.onrender.com
```

### Client Configuration
```typescript
// Retry settings
enhancedApiClient.retryCount = 3; // Default: 3
enhancedApiClient.baseRetryDelay = 1000; // Default: 1000ms
enhancedApiClient.maxRetryDelay = 10000; // Default: 10000ms

// Health check interval
enhancedApiClient.healthCheckInterval = 30000; // Default: 30s
```

## 🐛 Error Handling Improvements

### Before
- Generic error messages
- No retry logic
- Token expiration causes full logout
- Network errors not handled gracefully

### After
- Contextual error messages
- Automatic retry with backoff
- Seamless token refresh
- Offline request queuing
- Connection status awareness

## 📝 Example Usage

### Basic Request
```typescript
const response = await enhancedApiClient.get('/bookings/');
```

### With Retry
```typescript
// Automatic retry on 5xx errors
const response = await enhancedApiClient.get('/bookings/', undefined, {
  timeout: 120000
});
```

### With Cache Invalidation
```typescript
// After creating a booking, invalidate bookings cache
await enhancedApiClient.post('/bookings/', bookingData);
enhancedApiClient.invalidateCache('/bookings/');
```

### Check Connection Status
```typescript
const status = enhancedApiClient.getConnectionStatus();
if (status === 'offline') {
  // Show offline message
}
```

## 🎉 Summary

The enhanced API client provides:
- ✅ Automatic token refresh
- ✅ Request/response interceptors
- ✅ Connection health monitoring
- ✅ Exponential backoff retry
- ✅ Request queuing
- ✅ Better error handling
- ✅ Response caching
- ✅ Visual connection status

All improvements are backward compatible and can be adopted gradually.

