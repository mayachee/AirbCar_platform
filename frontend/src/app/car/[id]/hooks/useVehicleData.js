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
        
        const response = await apiClient.get(`/listings/${vehicleId}/`)
        
        // Handle different response structures
        const vehicleData = response?.data?.data || response?.data || response
        
        if (vehicleData) {
          setVehicle(vehicleData)
        } else {
          setError('Vehicle not found')
        }
      } catch (err) {
        console.error('Error fetching vehicle:', err)
        setError(err.message || 'Failed to load vehicle details')
      } finally {
        setLoading(false)
      }
    }

    fetchVehicle()
  }, [vehicleId])

  return { vehicle, loading, error }
}

