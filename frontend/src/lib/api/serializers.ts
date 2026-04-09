/**
 * API Serializers
 * Transform data between API format and application format
 */

import type { User, Vehicle, Booking, Favorite, Partner } from './types';

export class UserSerializer {
  static fromApi(data: any): User {
    return {
      id: data.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone_number: data.phone_number,
      role: data.role || 'customer',
      is_active: data.is_active ?? true,
      profile_picture: data.profile_picture,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  static toApi(user: Partial<User>): any {
    return {
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      role: user.role
    };
  }
}

export class VehicleSerializer {
  static fromApi(data: any): Vehicle {
    return {
      id: data.id,
      make: data.make,
      model: data.model,
      year: data.year,
      color: data.color,
      license_plate: data.license_plate,
      transmission: data.transmission,
      fuel_type: data.fuel_type,
      seats: data.seats,
      price_per_day: data.price_per_day,
      security_deposit: data.security_deposit,
      location: data.location,
      pictures: data.pictures || [],
      description: data.description,
      available: data.available ?? true,
      owner: data.owner,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  static toApi(vehicle: Partial<Vehicle>): any {
    return {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      license_plate: vehicle.license_plate,
      transmission: vehicle.transmission,
      fuel_type: vehicle.fuel_type,
      seats: vehicle.seats,
      price_per_day: vehicle.price_per_day,
      security_deposit: vehicle.security_deposit,
      location: vehicle.location,
      pictures: vehicle.pictures,
      description: vehicle.description,
      available: vehicle.available
    };
  }
}

export class BookingSerializer {
  static fromApi(data: any): Booking {
    return {
      id: data.id,
      listing: typeof data.listing === 'object' ? data.listing : data.listing,
      start_time: data.start_time,
      end_time: data.end_time,
      price: data.price,
      status: data.status || 'pending',
      request_message: data.request_message,
      rejection_reason: data.rejection_reason,
      customer: typeof data.customer === 'object' ? data.customer : data.customer,
      driver_license: data.driver_license,
      total_price: data.total_price,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  static toApi(booking: Partial<Booking>): any {
    return {
      listing: booking.listing,
      start_time: booking.start_time,
      end_time: booking.end_time,
      price: booking.price,
      request_message: booking.request_message,
      driver_license: booking.driver_license
    };
  }
}

export class FavoriteSerializer {
  static fromApi(data: any): Favorite {
    return {
      id: data.id,
      user: data.user,
      vehicle: typeof data.vehicle === 'object' ? data.vehicle : data.vehicle,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  static toApi(favorite: Partial<Favorite>): any {
    return {
      vehicle: typeof favorite.vehicle === 'object' ? favorite.vehicle.id : favorite.vehicle
    };
  }
}

export class PartnerSerializer {
  static fromApi(data: any): Partner {
    return {
      id: data.id,
      user: typeof data.user === 'object' ? data.user : data.user,
      company_name: data.company_name,
      business_license: data.business_license,
      verification_status: data.verification_status || 'pending',
      vehicles: data.vehicles || [],
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  static toApi(partner: Partial<Partner>): any {
    return {
      company_name: partner.company_name,
      business_license: partner.business_license
    };
  }
}

