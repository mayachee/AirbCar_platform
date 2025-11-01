import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/constants'
import type { Vehicle, VehicleFilters } from '@/types'

/**
 * Vehicle Service - Complete API integration
 */
export class VehicleService {
  async getVehicles(filters: VehicleFilters = {}) {
    const params = new URLSearchParams()
    
    if (filters.location) params.append('location', filters.location)
    if (filters.brand) {
      const brand = Array.isArray(filters.brand) ? filters.brand.join(',') : filters.brand
      params.append('brand', brand)
    }
    if (filters.priceRange) {
      params.append('min_price', filters.priceRange[0].toString())
      params.append('max_price', filters.priceRange[1].toString())
    }
    if (filters.fuelType) {
      const fuelType = Array.isArray(filters.fuelType) ? filters.fuelType.join(',') : filters.fuelType
      params.append('fuel_type', fuelType)
    }
    if (filters.transmission) {
      const transmission = Array.isArray(filters.transmission) ? filters.transmission.join(',') : filters.transmission
      params.append('transmission', transmission)
    }
    if (filters.seats) {
      const seats = Array.isArray(filters.seats) ? filters.seats.join(',') : filters.seats
      params.append('seats', seats)
    }
    
    const queryString = params.toString()
    const endpoint = queryString ? `/listings/?${queryString}` : '/listings/'
    
    return apiClient.get(endpoint)
  }

  async getVehicle(vehicleId: number) {
    return apiClient.get(`/listings/${vehicleId}/`)
  }

  async createVehicle(vehicleData: Partial<Vehicle>) {
    return apiClient.post('/listings/', vehicleData)
  }

  async updateVehicle(vehicleId: number, vehicleData: Partial<Vehicle>) {
    return apiClient.put(`/listings/${vehicleId}/`, vehicleData)
  }

  async patchVehicle(vehicleId: number, vehicleData: Partial<Vehicle>) {
    return apiClient.patch(`/listings/${vehicleId}/`, vehicleData)
  }

  async deleteVehicle(vehicleId: number) {
    return apiClient.delete(`/listings/${vehicleId}/`)
  }

  async searchVehicles(searchParams: VehicleFilters) {
    const params = new URLSearchParams()
    
    if (searchParams.location) params.append('location', searchParams.location)
    if (searchParams.brand) {
      const brand = Array.isArray(searchParams.brand) ? searchParams.brand.join(',') : searchParams.brand
      params.append('brand', brand)
    }
    if (searchParams.priceRange) {
      params.append('min_price', searchParams.priceRange[0].toString())
      params.append('max_price', searchParams.priceRange[1].toString())
    }
    if (searchParams.fuelType) {
      const fuelType = Array.isArray(searchParams.fuelType) ? searchParams.fuelType.join(',') : searchParams.fuelType
      params.append('fuel_type', fuelType)
    }
    if (searchParams.transmission) {
      const transmission = Array.isArray(searchParams.transmission) ? searchParams.transmission.join(',') : searchParams.transmission
      params.append('transmission', transmission)
    }
    if (searchParams.seats) {
      const seats = Array.isArray(searchParams.seats) ? searchParams.seats.join(',') : searchParams.seats
      params.append('seats', seats)
    }
    
    const queryString = params.toString()
    const endpoint = queryString ? `/listings/search/?${queryString}` : '/listings/search/'
    
    return apiClient.get(endpoint)
  }

  async getFeaturedVehicles() {
    return apiClient.get('/listings/featured/')
  }

  async getPopularVehicles() {
    return apiClient.get('/listings/popular/')
  }

  async getVehicleReviews(vehicleId: number) {
    return apiClient.get(`/listings/${vehicleId}/reviews/`)
  }

  async addVehicleReview(vehicleId: number, reviewData: any) {
    return apiClient.post(`/listings/${vehicleId}/reviews/`, reviewData)
  }

  async toggleFavorite(vehicleId: number) {
    // POST to create a favorite, or use the existing one if it exists
    return apiClient.post('/favorites/', { listing: vehicleId })
  }

  async getFavorites() {
    return apiClient.get('/favorites/')
  }

  async removeFavorite(vehicleId: number) {
    // Find the favorite by listing ID and delete it
    try {
      const favorites = await this.getFavorites();
      const favoriteList = favorites.data || [];
      const favorite = favoriteList.find((fav: any) => fav.listing?.id === vehicleId || fav.listing === vehicleId);
      if (favorite) {
        return apiClient.delete(`/favorites/${favorite.id}/`);
      } else {
        throw new Error('Favorite not found');
      }
    } catch (error) {
      throw error;
    }
  }
}

// Create and export a singleton instance
export const vehicleService = new VehicleService()