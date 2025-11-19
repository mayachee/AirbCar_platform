import { useState, useEffect } from 'react'
import { vehicleService } from '@/features/vehicle/services/vehicleService'
import { formatVehicleData } from '../utils/formatVehicleData'

/**
 * Custom hook for fetching and managing vehicle data
 * @param {string|number} vehicleId - Vehicle ID to fetch
 * @returns {Object} Vehicle data, loading state, and error
 */
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
        
        const response = await vehicleService.getVehicle(parseInt(vehicleId))
        
        if (response.data) {
          const formattedData = formatVehicleData(response.data)
          setVehicle(formattedData)
        } else {
          setError('Vehicle data not found')
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

