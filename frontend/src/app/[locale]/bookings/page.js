'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { bookingsService } from '@/services/api'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { BookingFilters, BookingCard, EmptyState, BookingDetailsModal } from './components'

export default function BookingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showBookingDetails, setShowBookingDetails] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
      return
    }
    
    if (user) {
      fetchBookings()
    }
  }, [user, authLoading, router])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await bookingsService.getBookings()
      const bookingsList = Array.isArray(data) ? data : (data?.data || [])
      setBookings(bookingsList)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError('Failed to load bookings. Please try again.')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    try {
      setCancelLoading(true)
      await bookingsService.cancelBooking(bookingId)
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' }
          : booking
      ))
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(prev => ({ ...prev, status: 'cancelled' }))
      }
    } catch (err) {
      console.error('Error cancelling booking:', err)
      setError('Failed to cancel booking. Please try again.')
    } finally {
      setCancelLoading(false)
    }
  }

  const getFilteredBookings = () => {
    const now = new Date()
    
    switch (filter) {
      case 'upcoming':
        return bookings.filter(booking => 
          new Date(booking.start_time) > now && booking.status !== 'cancelled'
        )
      case 'completed':
        return bookings.filter(booking => 
          new Date(booking.end_time) < now && booking.status === 'completed'
        )
      case 'cancelled':
        return bookings.filter(booking => booking.status === 'cancelled')
      default:
        return bookings
    }
  }

  const getUpcomingCount = () => {
    const now = new Date()
    return bookings.filter(booking => 
      new Date(booking.start_time) > now && booking.status !== 'cancelled'
    ).length
  }

  const getCompletedCount = () => {
    return bookings.filter(booking => booking.status === 'completed').length
  }

  const getCancelledCount = () => {
    return bookings.filter(booking => booking.status === 'cancelled').length
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    const diffInMs = end.getTime() - start.getTime()
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24)
    return Math.max(1, Math.ceil(diffInDays))
  }

  const openBookingDetails = (booking) => {
    setSelectedBooking(booking)
    setShowBookingDetails(true)
    document.body.style.overflow = 'hidden'
  }

  const closeBookingDetails = () => {
    setSelectedBooking(null)
    setShowBookingDetails(false)
    document.body.style.overflow = 'unset'
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-none h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Bookings</h1>
          <p className="text-gray-600 mt-2">Manage and track your car rental bookings</p>
        </div>

        {/* Filter Tabs */}
        <BookingFilters
          filter={filter}
          setFilter={setFilter}
          bookings={bookings}
          getFilteredBookings={getFilteredBookings}
          getUpcomingCount={getUpcomingCount}
          getCompletedCount={getCompletedCount}
          getCancelledCount={getCancelledCount}
        />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-none p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-none shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your bookings...</p>
          </div>
        )}

        {/* Bookings List */}
        {!loading && (
          <div className="space-y-4">
            {getFilteredBookings().length === 0 ? (
              <EmptyState filter={filter} />
            ) : (
              getFilteredBookings().map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  getStatusColor={getStatusColor}
                  formatDate={formatDate}
                  calculateDuration={calculateDuration}
                  onViewDetails={openBookingDetails}
                  onCancel={handleCancelBooking}
                  cancelLoading={cancelLoading}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <BookingDetailsModal
          selectedBooking={selectedBooking}
          onClose={closeBookingDetails}
          getStatusColor={getStatusColor}
          formatDate={formatDate}
          calculateDuration={calculateDuration}
          onCancel={handleCancelBooking}
          cancelLoading={cancelLoading}
        />
      )}

      <Footer />
    </div>
  )
}
