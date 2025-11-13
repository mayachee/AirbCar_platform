/**
 * API Types and Interfaces
 * Centralized type definitions for API requests and responses
 */

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ApiError {
  message: string;
  status: number;
  details?: any;
  code?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number>;
  skipAuth?: boolean;
  cache?: RequestCache;
  timeout?: number; // Timeout in milliseconds (default: 10000)
}

export interface CacheConfig {
  key: string;
  ttl?: number; // Time to live in milliseconds
  strategy?: 'cache-first' | 'network-first' | 'stale-while-revalidate';
}

// Model types
export interface BaseEntity {
  id: number;
  created_at?: string;
  updated_at?: string;
}

export interface User extends BaseEntity {
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: 'customer' | 'partner' | 'admin';
  is_active: boolean;
  profile_picture?: string;
}

export interface Vehicle extends BaseEntity {
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  price_per_day: number;
  location: string;
  pictures: string[];
  description?: string;
  available: boolean;
  owner?: number; // Partner ID
}

export interface Booking extends BaseEntity {
  listing: number | Vehicle;
  start_time: string;
  end_time: string;
  price: number;
  status: 'pending' | 'confirmed' | 'accepted' | 'completed' | 'cancelled' | 'rejected';
  request_message?: string;
  rejection_reason?: string;
  customer?: number | User;
  driver_license?: string;
  total_price?: number;
}

export interface Favorite extends BaseEntity {
  user: number;
  vehicle: number | Vehicle;
}

export interface Partner extends BaseEntity {
  user: number | User;
  company_name?: string;
  business_license?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  vehicles: Vehicle[];
}

export interface ListingFilters {
  location?: string;
  pickup_date?: string;
  return_date?: string;
  min_price?: number;
  max_price?: number;
  transmission?: string;
  fuel_type?: string;
  seats?: number;
  make?: string;
  model?: string;
  year?: number;
  page?: number;
  page_size?: number;
}

