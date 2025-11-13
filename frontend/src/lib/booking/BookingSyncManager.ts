/**
 * Real-time Booking Synchronization Manager
 * Ensures booking updates are reflected across all modules
 */

import { EventEmitter } from 'events';

export class BookingSyncManager extends EventEmitter {
  private static instance: BookingSyncManager;
  private lastSyncTime: number = Date.now();
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.startAutoSync();
  }

  static getInstance(): BookingSyncManager {
    if (!BookingSyncManager.instance) {
      BookingSyncManager.instance = new BookingSyncManager();
    }
    return BookingSyncManager.instance;
  }

  /**
   * Start automatic synchronization every 30 seconds
   */
  private startAutoSync() {
    this.syncInterval = setInterval(() => {
      this.notifyChange('sync');
    }, 30000); // 30 seconds
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Notify all modules of a booking change
   */
  notifyChange(type: 'created' | 'updated' | 'status_changed' | 'sync', data?: any) {
    this.lastSyncTime = Date.now();
    this.emit('booking-changed', { type, data, timestamp: this.lastSyncTime });
  }

  /**
   * Subscribe to booking changes
   */
  subscribe(callback: (event: { type: string; data?: any; timestamp: number }) => void) {
    this.on('booking-changed', callback);
    return () => this.off('booking-changed', callback);
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): number {
    return this.lastSyncTime;
  }
}

export const bookingSync = BookingSyncManager.getInstance();

