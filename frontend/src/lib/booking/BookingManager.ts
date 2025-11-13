/**
 * Unified Booking Manager
 * Centralizes booking management across Account, Admin, and Partner Dashboard
 */

import { apiClient, cacheManager } from '@/lib/api';
import { bookingSync } from './BookingSyncManager';
import type { Booking, ApiResponse } from '@/lib/api/types';

export class BookingManager {
  /**
   * Fetch bookings for current user with role-based filtering
   */
  static async getUserBookings(role: string): Promise<Booking[]> {
    try {
      const response = await apiClient.get<Booking[]>('/bookings/');
      return response.data;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  }

  /**
   * Fetch bookings for partner (their listings)
   */
  static async getPartnerBookings(): Promise<Booking[]> {
    try {
      const response = await apiClient.get<Booking[]>('/bookings/pending-requests/');
      return response.data;
    } catch (error) {
      console.error('Error fetching partner bookings:', error);
      throw error;
    }
  }

  /**
   * Fetch all bookings (Admin only)
   */
  static async getAllBookings(filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Booking[]> {
    try {
      const params: Record<string, string> = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.dateFrom) params.date_from = filters.dateFrom;
      if (filters?.dateTo) params.date_to = filters.dateTo;

      const response = await apiClient.get<Booking[]>('/bookings/', params);
      return response.data;
    } catch (error) {
      console.error('Error fetching all bookings:', error);
      throw error;
    }
  }

  /**
   * Create a new booking
   */
  static async createBooking(bookingData: FormData): Promise<Booking> {
    try {
      // Invalidate booking caches
      cacheManager.invalidate('bookings');
      cacheManager.invalidate('pending-requests');
      
      const response = await apiClient.post<Booking>('/bookings/', bookingData);
      
      // Notify all modules of the new booking
      bookingSync.notifyChange('created', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Update booking status (accept/reject/cancel)
   */
  static async updateBookingStatus(
    bookingId: number,
    action: 'accept' | 'reject' | 'cancel',
    reason?: string
  ): Promise<Booking> {
    try {
      let response: ApiResponse<Booking>;

      switch (action) {
        case 'accept':
          response = await apiClient.post(`/bookings/${bookingId}/accept/`);
          break;
        case 'reject':
          response = await apiClient.post(`/bookings/${bookingId}/reject/`, { 
            rejection_reason: reason 
          });
          break;
        case 'cancel':
          response = await apiClient.post(`/bookings/${bookingId}/cancel/`, {
            cancellation_reason: reason
          });
          break;
      }

      // Invalidate caches after update
      cacheManager.invalidate('bookings');
      cacheManager.invalidate('pending-requests');
      cacheManager.invalidate('upcoming');

      // Notify all modules of the status change
      bookingSync.notifyChange('status_changed', {
        bookingId,
        action,
        updatedBooking: response.data
      });

      return response.data;
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }

  /**
   * Get booking statistics for different views
   */
  static getBookingStats(bookings: Booking[]) {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed' || b.status === 'accepted').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      revenue: bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (parseFloat(b.total_price || b.price || '0')), 0)
    };
  }

  /**
   * Filter bookings by status and date
   */
  static filterBookings(
    bookings: Booking[],
    filters: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Booking[] {
    return bookings.filter(booking => {
      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (booking.status !== filters.status) return false;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const bookingDate = new Date(booking.start_time || booking.created_at);
        
        if (filters.dateFrom && bookingDate < new Date(filters.dateFrom)) {
          return false;
        }
        
        if (filters.dateTo && bookingDate > new Date(filters.dateTo)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Group bookings by status for dashboard views
   */
  static groupBookingsByStatus(bookings: Booking[]) {
    return {
      pending: bookings.filter(b => b.status === 'pending'),
      upcoming: bookings.filter(b => 
        ['confirmed', 'accepted'].includes(b.status) && 
        new Date(b.start_time) > new Date()
      ),
      active: bookings.filter(b => 
        ['confirmed', 'accepted'].includes(b.status) && 
        new Date(b.start_time) <= new Date() && 
        new Date(b.end_time) >= new Date()
      ),
      completed: bookings.filter(b => b.status === 'completed'),
      cancelled: bookings.filter(b => b.status === 'cancelled'),
      past: bookings.filter(b => 
        new Date(b.end_time || b.end_time) < new Date()
      )
    };
  }
}

export default BookingManager;

