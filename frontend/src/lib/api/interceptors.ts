/**
 * API Interceptors
 * Pre-configured interceptors for common use cases
 */

import type { RequestConfig } from './types';

/**
 * Request interceptor to add request ID for tracking
 */
export function requestIdInterceptor(config: RequestConfig): RequestConfig {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Request-ID': requestId,
    },
  };
}

/**
 * Request interceptor to log requests in development
 */
export function loggingInterceptor(config: RequestConfig): RequestConfig {
  if (process.env.NODE_ENV === 'development') {
    console.log('📤 API Request:', {
      method: config.method || 'GET',
      url: config.params ? '...' : '',
      timestamp: new Date().toISOString(),
    });
  }
  return config;
}

/**
 * Response interceptor to log responses in development
 */
export async function responseLoggingInterceptor(response: Response): Promise<Response> {
  if (process.env.NODE_ENV === 'development') {
    const clonedResponse = response.clone();
    try {
      const data = await clonedResponse.json();
      console.log('📥 API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Not JSON, skip logging
    }
  }
  return response;
}

/**
 * Error interceptor to enhance error messages
 */
export function errorEnhancerInterceptor(error: any): any {
  if (error instanceof Error) {
    // Add helpful context to errors
    if ((error as any).isNetworkError) {
      error.message = `Network error: ${error.message}. Please check your internet connection.`;
    }
    if ((error as any).isTimeoutError) {
      error.message = `Request timeout: ${error.message}. The server may be slow or unavailable.`;
    }
  }
  return error;
}

