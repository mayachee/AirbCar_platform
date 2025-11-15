import { apiClient } from '@/lib/api/client';

class SearchService {
  // Search vehicles with filters
  async searchVehicles(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filter parameters
      if (filters.location) params.append('location', filters.location);
      if (filters.pickupDate) params.append('pickup_date', filters.pickupDate);
      if (filters.returnDate) params.append('return_date', filters.returnDate);
      if (filters.priceRange) {
        params.append('min_price', filters.priceRange[0]);
        params.append('max_price', filters.priceRange[1]);
      }
      if (filters.transmission?.length) {
        params.append('transmission', filters.transmission.join(','));
      }
      if (filters.fuelType?.length) {
        params.append('fuel_type', filters.fuelType.join(','));
      }
      if (filters.seats?.length) {
        params.append('seats', filters.seats.join(','));
      }
      if (filters.style?.length) {
        params.append('style', filters.style.join(','));
      }
      if (filters.brand?.length) {
        params.append('brand', filters.brand.join(','));
      }
      if (filters.verified) {
        params.append('verified', 'true');
      }
      
      const queryString = params.toString();
      
      // Build params object for apiClient
      const queryParams = {};
      params.forEach((value, key) => {
        queryParams[key] = value;
      });
      
      // Increase timeout for search (60 seconds - large dataset, complex queries)
      return await apiClient.get('/listings/', queryParams, { timeout: 60000 });
    } catch (error) {
      console.error('Error searching vehicles:', error);
      throw error;
    }
  }

  // Get vehicle by ID
  async getVehicleById(id) {
    try {
      return await apiClient.get(`/listings/${id}/`, undefined, { timeout: 20000 });
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw error;
    }
  }

  // Get featured/popular vehicles
  async getFeaturedVehicles() {
    try {
      // Increase timeout for featured vehicles (60 seconds - large dataset)
      return await apiClient.get('/listings/', { featured: 'true' }, { timeout: 60000 });
    } catch (error) {
      console.error('Error fetching featured vehicles:', error);
      throw error;
    }
  }

  // Get similar vehicles
  async getSimilarVehicles(vehicleId) {
    try {
      return await apiClient.get(`/listings/${vehicleId}/similar/`);
    } catch (error) {
      console.error('Error fetching similar vehicles:', error);
      throw error;
    }
  }

  // Get available dates for a vehicle
  async getVehicleAvailability(vehicleId, startDate, endDate) {
    try {
      return await apiClient.get(
        `/listings/${vehicleId}/availability/?start_date=${startDate}&end_date=${endDate}`
      );
    } catch (error) {
      console.error('Error fetching vehicle availability:', error);
      throw error;
    }
  }
}

export const searchService = new SearchService();
