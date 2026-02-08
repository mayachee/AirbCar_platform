import { useState, useCallback } from 'react';
import { bookingService } from '@/services/api';

export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadBookings = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage('');
      const allBookings = await bookingService.getBookings();
      const upcomingBookings = await bookingService.getUpcomingBookings().catch(() => []);
      
      // Combine and deduplicate
      const combined = [...(Array.isArray(allBookings) ? allBookings : [allBookings.data || []].flat())];
      const upcoming = Array.isArray(upcomingBookings) ? upcomingBookings : (upcomingBookings.data || []);
      
      const allIds = new Set(combined.map(b => b.id));
      const newBookings = upcoming.filter(b => !allIds.has(b.id));
      const all = [...combined, ...newBookings];
      
      setBookings(all);
      if (showRefreshing) {
        setSuccessMessage('Bookings updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setErrorMessage('Failed to load bookings. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setSuccessMessage, setErrorMessage]);

  const filterBookings = useCallback((bookings, tab, statusFilter, searchTerm, sortBy) => {
    let filtered = [...bookings];
    const now = new Date();

    // Tab filter
    if (tab === 'upcoming') {
      filtered = filtered.filter(b => {
        const startDate = new Date(b.start_time || b.start_date || b.pickup_date);
        const isValidDate = !isNaN(startDate.getTime());
        const status = (b.status || '').toLowerCase();
        
        // Valid statuses for upcoming
        const validStatuses = ['pending', 'accepted', 'confirmed'];
        const hasValidStatus = validStatuses.includes(status) || 
                              (status && !['cancelled', 'rejected', 'completed'].includes(status));
        
        if (!hasValidStatus) return false;
        
        // Always show pending bookings regardless of date (new bookings)
        if (status === 'pending') return true;
        
        // For other statuses, must have valid date and be in future
        return isValidDate && startDate >= now;
      });
    } else if (tab === 'past') {
      filtered = filtered.filter(b => {
        const startDate = new Date(b.start_time || b.start_date || b.pickup_date);
        const isValidDate = !isNaN(startDate.getTime());
        const status = (b.status || '').toLowerCase();
        
        // Show as past if:
        // 1. Start date is in the past AND status is not pending
        // 2. OR status is completed/cancelled/rejected
        const pastStatuses = ['completed', 'cancelled', 'rejected'];
        if (pastStatuses.includes(status)) return true;
        if (status === 'pending') return false; // Don't show pending in past
        
        return isValidDate && startDate < now;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => {
        const vehicleName = `${b.listing?.make || ''} ${b.listing?.model || ''}`.toLowerCase();
        const location = (b.listing?.location || '').toLowerCase();
        const bookingId = b.id?.toString() || '';
        return vehicleName.includes(term) || location.includes(term) || bookingId.includes(term);
      });
    }

    // Sort bookings
    filtered.sort((a, b) => {
      if (sortBy === 'price') {
        const priceA = a.price || a.total_price || 0;
        const priceB = b.price || b.total_price || 0;
        return priceB - priceA; // Highest first
      } else if (sortBy === 'status') {
        const statusOrder = { 'pending': 0, 'accepted': 1, 'confirmed': 2, 'completed': 3, 'cancelled': 4, 'rejected': 5 };
        const orderA = statusOrder[a.status?.toLowerCase()] ?? 99;
        const orderB = statusOrder[b.status?.toLowerCase()] ?? 99;
        return orderA - orderB;
      } else {
        // Sort by date (default)
        const dateA = new Date(a.start_time || a.start_date || a.pickup_date);
        const dateB = new Date(b.start_time || b.start_date || b.pickup_date);
        return tab === 'upcoming' ? dateA - dateB : dateB - dateA;
      }
    });

    return filtered;
  }, []);

  const calculateCounts = useCallback((bookings) => {
    const now = new Date();
    
    const upcomingCount = bookings.filter(b => {
      const startDate = new Date(b.start_time || b.start_date || b.pickup_date);
      const isValidDate = !isNaN(startDate.getTime());
      const status = (b.status || '').toLowerCase();
      
      const validStatuses = ['pending', 'accepted', 'confirmed'];
      const hasValidStatus = validStatuses.includes(status) || 
                            (status && !['cancelled', 'rejected', 'completed'].includes(status));
      
      if (!hasValidStatus) return false;
      if (status === 'pending') return true;
      return isValidDate && startDate >= now;
    }).length;

    const pastCount = bookings.filter(b => {
      const startDate = new Date(b.start_time || b.start_date || b.pickup_date);
      const isValidDate = !isNaN(startDate.getTime());
      const status = (b.status || '').toLowerCase();
      
      const pastStatuses = ['completed', 'cancelled', 'rejected'];
      if (pastStatuses.includes(status)) return true;
      if (status === 'pending') return false;
      
      return isValidDate && startDate < now;
    }).length;

    return { upcomingCount, pastCount };
  }, []);

  return {
    bookings,
    filteredBookings,
    setFilteredBookings,
    loading,
    refreshing,
    successMessage,
    errorMessage,
    setSuccessMessage,
    setErrorMessage,
    loadBookings,
    filterBookings,
    calculateCounts
  };
}

