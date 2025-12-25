/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApiResponse, RequestConfig, PaginatedResponse } from './types';
import { cacheManager } from './cache';

// API Client for making HTTP requests to the backend
const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private retryCount = 3;
  private retryDelay = 1000;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
      timeout = method === 'GET' ? 90000 : 90000, // 90s for all requests (Render free tier can be slow, especially with file uploads)
      skipAuth = false,
      cache = 'default'
    } = config;

    // Build URL with query parameters (remove /api/v1 prefix - backend doesn't use it)
    let url = `${this.baseURL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Check cache for GET requests
    if (method === 'GET' && cache !== 'no-store') {
      const cached = cacheManager.get(url);
      if (cached !== null) {
        return cached;
      }
    }

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      ...headers,
    };

    // Add authentication token if not skipped
    if (!skipAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Handle body - check if it's FormData
    const isFormData = body instanceof FormData;
    
    // Only add Content-Type for non-FormData bodies
    if (!isFormData) {
      requestHeaders['Content-Type'] = 'application/json';
    } else {
      // Remove Content-Type for FormData - browser will set it with boundary
      delete requestHeaders['Content-Type'];
    }

    // Add timeout to prevent hanging requests
    // Use timeout from config or default (60s for GET, 30s for others)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      let response: Response;
      try {
        response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
          signal: controller.signal,
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Handle AbortError (timeout)
        if (fetchError.name === 'AbortError') {
          const timeoutSeconds = Math.round(timeout / 1000);
          const timeoutError = new Error(`Request timeout: The server at ${this.baseURL} did not respond within ${timeoutSeconds} seconds.`);
          (timeoutError as any).isTimeoutError = true;
          (timeoutError as any).url = url;
          (timeoutError as any).timeout = timeoutSeconds;
          throw timeoutError;
        }
        
        // Re-throw to be handled by handleError
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        // Parse error response
        let errorData: any = {};
        let errorText = '';
        try {
          errorText = await response.text();
          
          // Check if response is HTML (usually means 404 page not found)
          if (errorText && (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<!doctype'))) {
            // This is an HTML error page (likely 404)
            if (response.status === 404) {
              errorData = { 
                detail: `Endpoint not found: ${url}`,
                error: 'Endpoint not found',
                status: 404
              };
            } else {
              errorData = { 
                detail: `Server returned HTML response (status ${response.status}). Endpoint may not exist or server error occurred.`,
                error: `HTTP ${response.status}: ${response.statusText}`,
                status: response.status
              };
            }
          } else if (errorText) {
            // Try to parse as JSON
            try {
              errorData = JSON.parse(errorText);
              // Log parsed error data only when helpful (avoid noisy expected 4xx in console)
              if (errorData && typeof errorData === 'object') {
                // If errorData is empty, add default error message
                if (Object.keys(errorData).length === 0) {
                  errorData = {
                    error: `HTTP ${response.status}: ${response.statusText}`,
                    detail: errorText || `Server returned empty error response`,
                    status: response.status
                  };
                }
                const debugErrors = process.env.NEXT_PUBLIC_DEBUG_API_ERRORS === 'true';
                const shouldLog = debugErrors || response.status >= 500;
                if (shouldLog) {
                  console.error('Parsed error data:', errorData);
                }
              }
            } catch (parseError) {
              // If JSON parsing fails, use the text as error message
              console.error('Failed to parse error as JSON:', parseError);
              errorData = { 
                detail: errorText || `HTTP ${response.status}: ${response.statusText}`,
                error: errorText || `HTTP ${response.status}: ${response.statusText}`,
                status: response.status
              };
            }
          } else {
            errorData = { 
              detail: `HTTP ${response.status}: ${response.statusText}`,
              error: `HTTP ${response.status}: ${response.statusText}`,
              status: response.status
            };
          }
        } catch (e) {
          // If text reading fails, use empty object
          console.error('Failed to read error response:', e);
          errorData = { 
            detail: `HTTP ${response.status}: ${response.statusText}`,
            error: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status
          };
        }
        
        // Only log server-side failures by default (reduce console noise)
        if (response.status >= 500 || process.env.NEXT_PUBLIC_DEBUG_API_ERRORS === 'true') {
          console.error(`HTTP ${response.status} Error Response:`, errorText?.substring(0, 200) || 'No response text');
        }
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
          // Clear invalid token
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            // Redirect to login if we're on client side
            if (window.location.pathname !== '/auth/signin') {
              window.location.href = '/auth/signin?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
            }
          }
          const error = new Error(errorData.detail || errorData.error || errorData.message || 'Unauthorized. Please log in again.');
          (error as any).status = 401;
          throw error;
        }
        
        // Handle 403 Forbidden
        if (response.status === 403) {
          const errorMessage = errorData.detail || errorData.error || errorData.message || 'You do not have permission to perform this action.';
          const error = new Error(errorMessage);
          (error as any).status = 403;
          throw error;
        }
        
        // Handle 404 - endpoint doesn't exist
        if (response.status === 404) {
          const error = new Error(errorData.detail || errorData.error || errorData.message || 'Endpoint not found');
          (error as any).status = 404;
          throw error;
        }
        
        // Handle other errors - include full errorData for validation errors
        const errorMessage = errorData.detail || errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).data = errorData; // Attach full error data for field-specific validation errors
        throw error;
      }

      // Handle 204 No Content (common for DELETE requests)
      if (response.status === 204) {
        const result: ApiResponse<T> = {
          data: null as any,
          success: true,
          message: 'Success',
        };
        return result;
      }

      // Check if response has content before parsing JSON
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      
      // If content-length is explicitly 0, return empty data without trying to parse
      if (contentLength === '0') {
        const result: ApiResponse<T> = {
          data: null as any,
          success: true,
          message: 'Success',
        };
        return result;
      }

      // For DELETE requests, be more lenient with empty responses
      // Read as text first to check if response is actually empty
      if (method === 'DELETE') {
        try {
          const text = await response.text();
          if (!text || text.trim() === '') {
            const result: ApiResponse<T> = {
              data: null as any,
              success: true,
              message: 'Success',
            };
            return result;
          }
          // If there's text, try to parse as JSON
          try {
            const data = JSON.parse(text);
            const result: ApiResponse<T> = {
              data,
              success: true,
              message: data.message,
              meta: data.meta
            };
            return result;
          } catch {
            // If JSON parsing fails, return empty (DELETE usually returns empty on success)
            const result: ApiResponse<T> = {
              data: null as any,
              success: true,
              message: 'Success',
            };
            return result;
          }
        } catch {
          // If reading fails, return empty result for DELETE
          const result: ApiResponse<T> = {
            data: null as any,
            success: true,
            message: 'Success',
          };
          return result;
        }
      }

      // For other methods, try to parse JSON with error handling
      try {
        // Always read as text first to check if response is empty before parsing
        // This prevents "Unexpected end of JSON input" errors
        const text = await response.text();
        
        // If response is empty, return empty result
        if (!text || text.trim() === '') {
          const result: ApiResponse<T> = {
            data: null as any,
            success: true,
            message: 'Success',
          };
          // Cache successful GET responses even if empty
          if (method === 'GET' && cache !== 'no-store') {
            cacheManager.set(url, result);
          }
          return result;
        }

        // Try to parse as JSON
        try {
          const data = JSON.parse(text);
          const result: ApiResponse<T> = {
            data,
            success: true,
            message: data.message,
            meta: data.meta
          };
          // Cache successful GET responses
          if (method === 'GET' && cache !== 'no-store') {
            cacheManager.set(url, result);
          }
          return result;
        } catch (parseError) {
          // If JSON parsing fails, check content type
          // If it was supposed to be JSON, log a warning
          if (contentType && contentType.includes('application/json')) {
            console.warn('Failed to parse JSON response, returning text as data:', parseError);
          }
          // Return text as data (for non-JSON responses)
          const result: ApiResponse<T> = {
            data: text as any,
            success: true,
          };
          return result;
        }
      } catch (readError) {
        // If reading fails, return empty result
        console.warn('Failed to read response, returning empty result:', readError);
        const result: ApiResponse<T> = {
          data: null as any,
          success: true,
          message: 'Success',
        };
        return result;
      }
    } catch (error) {
      return this.handleError(error, url);
    }
  }

  private async handleError(error: any, url: string): Promise<never> {
    // If error is already an Error and has a status property, just rethrow it
    if (error instanceof Error && (error as any).status) {
      throw error;
    }
    
    // Network error - likely backend not running or CORS issue
    if (error instanceof TypeError || 
        error?.name === 'TypeError' ||
        (error instanceof Error && (
          error.message.includes('fetch') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.message.includes('Network request failed') ||
          error.message.includes('ERR_INTERNET_DISCONNECTED') ||
          error.message.includes('ERR_CONNECTION_REFUSED') ||
          error.message.includes('ERR_NAME_NOT_RESOLVED')
        )) ||
        (error?.code === 'NETWORK_ERROR' || error?.code === 'ERR_NETWORK')) {
      
      // Extract the base URL for cleaner error message
      const baseUrl = this.baseURL;
      const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
      
      let friendlyMessage = `Unable to connect to the server at ${baseUrl}.`;
      
      if (isLocalhost) {
        friendlyMessage += `\n\nThe backend server is not running. To start it:\n\n` +
          `Option 1 - Using Docker Compose:\n` +
          `  docker-compose up\n\n` +
          `Option 2 - Manual Django server:\n` +
          `  cd backend/airbcar_backend\n` +
          `  python manage.py runserver\n\n` +
          `Once the server is running, refresh this page.`;
      } else {
        friendlyMessage += `\n\nPlease ensure:
- The backend server is running
- The server is accessible at ${baseUrl}
- Your internet connection is active
- CORS is properly configured on the backend`;
      }
      
      console.error('🔴 Network Error:', {
        message: friendlyMessage,
        url,
        baseUrl,
        originalError: error?.message || error?.toString() || error,
        errorType: error?.constructor?.name || typeof error,
        stack: error?.stack
      });
      
      const networkError = new Error(friendlyMessage);
      (networkError as any).isNetworkError = true;
      (networkError as any).isConnectionError = true;
      (networkError as any).url = url;
      (networkError as any).baseUrl = baseUrl;
      (networkError as any).originalError = error;
      throw networkError;
    }
    
    // CORS error
    if (error instanceof Error && (
      error.message.includes('CORS') ||
      error.message.includes('Cross-Origin') ||
      error.message.includes('Access-Control')
    )) {
      const corsMessage = `CORS error: The server at ${this.baseURL} is blocking cross-origin requests. Please check CORS configuration on the backend.`;
      console.error('🔴 CORS Error:', corsMessage);
      const corsError = new Error(corsMessage);
      (corsError as any).isCorsError = true;
      (corsError as any).url = url;
      throw corsError;
    }
    
    if (error instanceof Error) {
      // Skip logging if this is a timeout error - it's already been logged or is expected
      if (!(error as any).isTimeoutError) {
        // Only log meaningful error details, avoid logging entire error objects
        const errorDetails: any = {
          message: error.message || 'Unknown error',
          url: url || 'unknown',
        };
        
        // Add helpful properties if they exist
        if ((error as any).status) errorDetails.status = (error as any).status;
        if ((error as any).isNetworkError) errorDetails.type = 'network';
        if ((error as any).isCorsError) errorDetails.type = 'cors';
        if (error.stack && process.env.NODE_ENV === 'development') {
          errorDetails.stack = error.stack.split('\n').slice(0, 5).join('\n'); // First 5 lines only
        }
        
        // Only log if there's meaningful information
        if (errorDetails.message !== 'Unknown error' || errorDetails.type) {
          console.error('⚠️ API Error:', errorDetails);
        }
      }
      throw error;
    }
    
    // Handle unknown error types
    const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred';
    const unknownError = new Error(errorMessage);
    (unknownError as any).originalError = error;
    
    // Only log if we have meaningful information
    if (errorMessage !== 'An unexpected error occurred') {
      console.error('⚠️ Unknown Error:', {
        message: errorMessage,
        url: url || 'unknown',
        errorType: typeof error
      });
    }
    
    throw unknownError;
  }

  private async retryRequest<T>(
    fn: () => Promise<ApiResponse<T>>,
    attempts = 0
  ): Promise<ApiResponse<T>> {
    try {
      return await fn();
    } catch (error) {
      if (attempts < this.retryCount && this.shouldRetry(error)) {
        await this.delay(this.retryDelay * (attempts + 1));
        return this.retryRequest(fn, attempts + 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    if (error instanceof Error && (error as any).status) {
      const status = (error as any).status;
      // Retry on network errors or 5xx errors
      return status >= 500;
    }
    // Retry on network errors
    return error instanceof TypeError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T>(
    endpoint: string, 
    params?: Record<string, string | number>,
    config?: Omit<RequestConfig, 'method' | 'params'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params, ...config });
  }

  async getPaginated<T>(
    endpoint: string,
    params?: Record<string, string | number>
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    return this.get<PaginatedResponse<T>>(endpoint, params);
  }

  async post<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, ...config });
  }

  async put<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, ...config });
  }

  async patch<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, ...config });
  }

  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', ...config });
  }

  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  // Invalidate cache for a specific pattern
  invalidateCache(pattern?: string): void {
    if (pattern) {
      cacheManager.invalidate(pattern);
    } else {
      cacheManager.clear();
    }
  }

  // Clear all cache
  clearCache(): void {
    cacheManager.clear();
  }

  // Get cache stats
  getCacheStats() {
    return cacheManager.getStats();
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Re-export enhanced client for optional use
export { enhancedApiClient } from './enhancedClient';
