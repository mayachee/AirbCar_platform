'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'

export function useVehicleData(vehicleId) {
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!vehicleId) {
      setError('Vehicle ID is required')
      setLoading(false)
      return
    }

    const fetchVehicle = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Increase timeout to 90 seconds for vehicle details (backend may be slow)
        const response = await apiClient.get(`/listings/${vehicleId}/`, undefined, { timeout: 90000 })
        
        // Handle different response structures
        const vehicleData = response?.data?.data || response?.data || response
        
        if (vehicleData) {
          setVehicle(vehicleData)
        } else {
          setError('Vehicle not found')
        }
      } catch (err) {
        console.error('Error fetching vehicle:', err)
        
        // Handle timeout errors specifically
        if (err?.isTimeoutError || err?.message?.includes('timeout')) {
          setError('The server is taking too long to respond. Please try again in a moment.')
        } else if (err?.status === 404) {
          setError('Vehicle not found')
        } else {
          setError(err.message || 'Failed to load vehicle details')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchVehicle()
  }, [vehicleId])

  return { vehicle, loading, error }
}

