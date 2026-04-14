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
    
    // Convert URLSearchParams to object for apiClient
    const paramsObj: Record<string, string | number> = {}
    params.forEach((value, key) => {
      paramsObj[key] = value
    })
    
    // Increase timeout for vehicle search (60 seconds - large dataset, complex queries)
    return apiClient.get('/listings/', paramsObj, { timeout: 60000 })
  }

  async getVehicle(vehicleId: number) {
    // Increase timeout for vehicle details (60 seconds - may include complex relationships)
    return apiClient.get(`/listings/${vehicleId}/`, undefined, { timeout: 60000 })
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
    return apiClient.post('/favorites/', { listing_id: vehicleId, listing: vehicleId })
  }

  async getFavorites() {
    // Increase timeout for favorites (60 seconds - may include full listing details)
    return apiClient.get('/favorites/', undefined, { timeout: 60000 })
  }

  async removeFavorite(vehicleId: number) {
    // Find the favorite by listing ID and delete it
    try {
      const favorites = await this.getFavorites();
      
      // Handle different response structures - use type assertion for flexibility
      const favoritesResponse = favorites as any;
      let favoriteList: any[] = [];
      
      if (Array.isArray(favoritesResponse.data)) {
        favoriteList = favoritesResponse.data;
      } else if (Array.isArray(favoritesResponse.favorites)) {
        favoriteList = favoritesResponse.favorites;
      } else if (Array.isArray(favoritesResponse)) {
        favoriteList = favoritesResponse;
      } else if (favoritesResponse.data && Array.isArray(favoritesResponse.data.data)) {
        favoriteList = favoritesResponse.data.data;
      } else if (favoritesResponse.data && Array.isArray(favoritesResponse.data.favorites)) {
        favoriteList = favoritesResponse.data.favorites;
      }
      
      // Ensure favoriteList is an array
      if (!Array.isArray(favoriteList)) {
        console.warn('favoriteList is not an array:', favoriteList);
        favoriteList = [];
      }
      
      const favorite = favoriteList.find((fav: any) => {
        const listingId = fav.listing?.id || fav.listing || fav.listing_id;
        return listingId === vehicleId || listingId === String(vehicleId);
      });
      
      if (favorite && favorite.id) {
        return apiClient.delete(`/favorites/${favorite.id}/`);
      } else {
        throw new Error('Favorite not found');
      }
    } catch (error) {
      throw error;
    }
  }

  // --- SOCIAL LAYER ---

  async getVehicleComments(vehicleId: number) {
    return apiClient.get(`/listings/${vehicleId}/comments/`);
  }

  async addVehicleComment(vehicleId: number, content: string) {
    return apiClient.post(`/listings/${vehicleId}/comments/`, { content });
  }

  async getVehicleReactions(vehicleId: number) {
    return apiClient.get(`/listings/${vehicleId}/reactions/`);
  }

  async addVehicleReaction(vehicleId: number, reaction: string = 'like') {
    return apiClient.post(`/listings/${vehicleId}/reactions/`, { reaction });
  }

  async removeVehicleReaction(vehicleId: number) {
    return apiClient.delete(`/listings/${vehicleId}/reactions/`);
  }
}

// Create and export a singleton instance
export const vehicleService = new VehicleService()