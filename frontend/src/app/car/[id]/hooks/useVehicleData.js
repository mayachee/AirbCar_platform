'use client'

import { useState, useEffect } from 'react'
import { vehicleService } from '@/features/vehicle/services/vehicleService'

export function useVehicleData(vehicleId) {
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!vehicleId) {
      setLoading(false)
      return
    }

    const fetchVehicle = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await vehicleService.getVehicle(parseInt(vehicleId))
        
        // Normalize vehicle data to ensure images and features are always arrays
        const vehicleData = response.data || {}
        const normalizedVehicle = {
          ...vehicleData,
          images: Array.isArray(vehicleData.images) 
            ? vehicleData.images.filter(img => img) // Remove any null/undefined images
            : vehicleData.image 
              ? [vehicleData.image] // If single image field exists, convert to array
              : [], // Default to empty array
          features: Array.isArray(vehicleData.features) 
            ? vehicleData.features 
            : (vehicleData.available_features && Array.isArray(vehicleData.available_features))
              ? vehicleData.available_features
              : [], // Ensure features is always an array
          name: vehicleData.name || `${vehicleData.brand || vehicleData.make || ''} ${vehicleData.model || ''}`.trim() || 'Vehicle',
          price: vehicleData.price || vehicleData.dailyRate || vehicleData.price_per_day || 0,
          fuelType: vehicleData.fuelType || vehicleData.fuel_type || vehicleData.fuel || 'N/A',
          seats: vehicleData.seats || vehicleData.seating_capacity || 0,
        }
        
        setVehicle(normalizedVehicle)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vehicle data')
        console.error('Error fetching vehicle:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicle()
  }, [vehicleId])

  return { vehicle, loading, error }
}

