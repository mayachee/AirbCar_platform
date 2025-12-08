/**
 * Enhanced API Client
 * Improved connection between frontend and backend with:
 * - Automatic token refresh
 * - Request/response interceptors
 * - Connection health monitoring
 * - Exponential backoff retry
 * - Request queuing
 */

import type { ApiResponse, ApiError, RequestConfig } from './types';
import { cacheManager } from './cache';

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  config: RequestConfig;
  url: string;
}

export class EnhancedApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private retryCount = 3;
  private baseRetryDelay = 1000;
  private maxRetryDelay = 10000;
  private requestQueue: PendingRequest[] = [];
  private isProcessingQueue = false;
  private isRefreshingToken = false;
  private refreshTokenPromise: Promise<string | null> | null = null;
  private connectionStatus: 'online' | 'offline' | 'degraded' = 'online';
  private lastHealthCheck: number = 0;
  private healthCheckInterval = 30000; // 30 seconds

  // Interceptors
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>> = [];
  private responseInterceptors: Array<(response: Response) => Response | Promise<Response>> = [];
  private errorInterceptors: Array<(error: any) => any | Promise<any>> = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Monitor connection health
    if (typeof window !== 'undefined') {
      this.startHealthMonitoring();
    }
  }

  // Interceptor methods
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: Response) => Response | Promise<Response>) {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: (error: any) => any | Promise<any>) {
    this.errorInterceptors.push(interceptor);
  }

  // Connection health monitoring
  private startHealthMonitoring() {
    // Monitor online/offline events
    window.addEventListener('online', () => {
      this.connectionStatus = 'online';
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.connectionStatus = 'offline';
    });

    // Periodic health check
    setInterval(() => {
      this.checkHealth();
    }, this.healthCheckInterval);
  }

  private async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseURL}/api/health/`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        this.connectionStatus = 'online';
        this.lastHealthCheck = Date.now();
      } else {
        this.connectionStatus = 'degraded';
      }
    } catch (error) {
      this.connectionStatus = 'offline';
    }
  }

  // Token refresh mechanism
  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshingToken && this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.isRefreshingToken = true;
    this.refreshTokenPromise = (async () => {
      try {
        const refreshToken = typeof window !== 'undefined' 
          ? localStorage.getItem('refresh_token') 
          : null;

        if (!refreshToken) {
          return null;
        }

        const response = await fetch(`${this.baseURL}/api/token/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();
          const newAccessToken = data.access;
          
          if (typeof window !== 'undefined' && newAccessToken) {
            localStorage.setItem('access_token', newAccessToken);
            if (data.refresh) {
              localStorage.setItem('refresh_token', data.refresh);
            }
          }
          
          return newAccessToken;
        } else {
          // Refresh token expired or invalid
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          }
          return null;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
      } finally {
        this.isRefreshingToken = false;
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  // Request queuing for offline/rate limiting
  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0 && this.connectionStatus === 'online') {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          const result = await this.executeRequest(request.url, request.config);
          request.resolve(result);
        } catch (error) {
          request.reject(error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private async executeRequest<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
      timeout = 120000, // 120 seconds default
      skipAuth = false,
      cache = 'default'
    } = config;

    // Apply request interceptors
    let finalConfig = config;
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    // Build URL
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
    const requestHeaders: Record<string, string> = { ...this.defaultHeaders, ...headers };

    // Add authentication
    if (!skipAuth && typeof window !== 'undefined') {
      let token = localStorage.getItem('access_token');
      
      // If no token, try to refresh
      if (!token) {
        token = await this.refreshAccessToken();
      }
      
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Handle FormData
    const isFormData = body instanceof FormData;
    if (isFormData) {
      delete requestHeaders['Content-Type'];
    }

    // Create abort controller for timeout
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
        
        if (fetchError.name === 'AbortError') {
          const timeoutError = new Error(`Request timeout: The server did not respond within ${Math.round(timeout / 1000)} seconds.`);
          (timeoutError as any).isTimeoutError = true;
          (timeoutError as any).url = url;
          throw timeoutError;
        }
        
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response);
      }

      // Handle 401 - try token refresh
      if (response.status === 401 && !skipAuth) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          // Retry request with new token
          requestHeaders['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
            signal: controller.signal,
          });
        } else {
          // Refresh failed, redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            if (window.location.pathname !== '/auth/signin') {
              window.location.href = '/auth/signin?redirect=' + encodeURIComponent(window.location.pathname);
            }
          }
          throw new Error('Authentication failed. Please log in again.');
        }
      }

      if (!response.ok) {
        return this.handleErrorResponse(response, url);
      }

      // Parse response
      const result = await this.parseResponse<T>(response, method);
      
      // Cache GET responses
      if (method === 'GET' && cache !== 'no-store') {
        cacheManager.set(url, result);
      }

      return result;
    } catch (error) {
      // Apply error interceptors
      for (const interceptor of this.errorInterceptors) {
        error = await interceptor(error);
      }
      
      return this.handleError(error, url);
    }
  }

  private async parseResponse<T>(response: Response, method: string): Promise<ApiResponse<T>> {
    // Handle 204 No Content
    if (response.status === 204) {
      return { data: null as any, success: true, message: 'Success' };
    }

    // Check if response has content
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
      return { data: null as any, success: true, message: 'Success' };
    }

    const text = await response.text();
    if (!text || text.trim() === '') {
      return { data: null as any, success: true, message: 'Success' };
    }

    try {
      const data = JSON.parse(text);
      return {
        data,
        success: true,
        message: data.message,
        meta: data.meta
      };
    } catch (parseError) {
      return {
        data: text as any,
        success: true,
        message: 'Success'
      };
    }
  }

  private async handleErrorResponse(response: Response, url: string): Promise<never> {
    let errorData: any = {};
    let errorText = '';

    try {
      errorText = await response.text();
      
      if (errorText && (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<!doctype'))) {
        errorData = {
          detail: response.status === 404 
            ? `Endpoint not found: ${url}`
            : `Server returned HTML response (status ${response.status})`,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        };
      } else if (errorText) {
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = {
            detail: errorText,
            error: `HTTP ${response.status}: ${response.statusText}`,
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
      errorData = {
        detail: `HTTP ${response.status}: ${response.statusText}`,
        error: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status
      };
    }

    const errorMessage = errorData.detail || errorData.error || errorData.message || `HTTP ${response.status}`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).data = errorData;
    
    throw error;
  }

  private async handleError(error: any, url: string): Promise<never> {
    // Network errors
    if (error instanceof TypeError || 
        error?.name === 'TypeError' ||
        (error instanceof Error && (
          error.message.includes('fetch') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError')
        ))) {
      
      const networkError = new Error(`Unable to connect to the server at ${this.baseURL}`);
      (networkError as any).isNetworkError = true;
      (networkError as any).url = url;
      throw networkError;
    }

    // Re-throw if already processed
    if (error instanceof Error && (error as any).status) {
      throw error;
    }

    // Unknown errors
    const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred';
    const unknownError = new Error(errorMessage);
    (unknownError as any).originalError = error;
    throw unknownError;
  }

  // Exponential backoff retry
  private async retryWithBackoff<T>(
    fn: () => Promise<ApiResponse<T>>,
    attempt = 0
  ): Promise<ApiResponse<T>> {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt < this.retryCount && this.shouldRetry(error)) {
        const delay = Math.min(
          this.baseRetryDelay * Math.pow(2, attempt),
          this.maxRetryDelay
        );
        
        await this.delay(delay);
        return this.retryWithBackoff(fn, attempt + 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx errors
    if (error instanceof Error && (error as any).status) {
      const status = (error as any).status;
      return status >= 500 || status === 429; // Server errors or rate limit
    }
    
    // Retry on network errors
    return error instanceof TypeError || (error as any).isNetworkError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    // Queue request if offline
    if (this.connectionStatus === 'offline') {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({
          resolve,
          reject,
          config,
          url: `${this.baseURL}${endpoint}`
        });
      });
    }

    // Execute with retry
    return this.retryWithBackoff(() => this.executeRequest<T>(endpoint, config));
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string | number>,
    config?: Omit<RequestConfig, 'method' | 'params'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params, ...config });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, ...config });
  }

  async put<T>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, ...config });
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, ...config });
  }

  async delete<T>(
    endpoint: string,
    config?: Omit<RequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', ...config });
  }

  // Utility methods
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  invalidateCache(pattern?: string): void {
    if (pattern) {
      cacheManager.invalidate(pattern);
    } else {
      cacheManager.clear();
    }
  }

  clearCache(): void {
    cacheManager.clear();
  }

  getConnectionStatus(): 'online' | 'offline' | 'degraded' {
    return this.connectionStatus;
  }

  getQueueLength(): number {
    return this.requestQueue.length;
  }
}

// Create singleton instance
export const enhancedApiClient = new EnhancedApiClient(API_BASE_URL);

