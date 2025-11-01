import { useState, useEffect } from 'react';
import { vehicleService } from '@/features/vehicle/services/vehicleService';
import type { Vehicle, VehicleFilters, UseVehiclesReturn } from '@/types';

export const useVehicles = (filters: VehicleFilters = {}): UseVehiclesReturn => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const response = await vehicleService.getVehicles(filters);
        setVehicles(response.data as Vehicle[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [JSON.stringify(filters)]);

  const refetch = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await vehicleService.getVehicles(filters);
      setVehicles(response.data as Vehicle[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { vehicles, loading, error, refetch };
};

export const useVehicle = (vehicleId: string) => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) return;

    const fetchVehicle = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const response = await vehicleService.getVehicle(parseInt(vehicleId));
        setVehicle(response.data as Vehicle);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [vehicleId]);

  return { vehicle, loading, error };
};

export const useVehicleManagement = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createVehicle = async (vehicleData: Partial<Vehicle>): Promise<Vehicle> => {
    try {
      setLoading(true);
      setError(null);
      const response = await vehicleService.createVehicle(vehicleData);
      return response.data as Vehicle;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateVehicle = async (vehicleId: string, vehicleData: Partial<Vehicle>): Promise<Vehicle> => {
    try {
      setLoading(true);
      setError(null);
      const response = await vehicleService.updateVehicle(parseInt(vehicleId), vehicleData);
      return response.data as Vehicle;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteVehicle = async (vehicleId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await vehicleService.deleteVehicle(parseInt(vehicleId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createVehicle,
    updateVehicle,
    deleteVehicle,
    loading,
    error
  };
};
