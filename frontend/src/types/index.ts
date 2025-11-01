// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'partner' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  userId: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  licenseNumber?: string;
  licenseCountry?: string;
  licenseIssueDate?: string;
  profilePicture?: string;
}

// Vehicle Types
export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  transmission: 'manual' | 'automatic';
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  seats: number;
  style: 'sedan' | 'suv' | 'hatchback' | 'coupe' | 'convertible' | 'truck' | 'van';
  dailyRate: number;
  location: string;
  description?: string;
  features: string[];
  images: string[];
  verified: boolean;
  instantBooking: boolean;
  partnerId: string;
  partner?: Partner;
  rating?: number;
  reviewCount?: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFilters {
  priceRange?: [number, number];
  transmission?: string[];
  fuelType?: string[];
  seats?: string[];
  style?: string[];
  brand?: string[];
  features?: string[];
  verified?: boolean;
  instantBooking?: boolean;
  location?: string;
  pickupDate?: string;
  returnDate?: string;
}

// Booking Types
export interface Booking {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  customerId: string;
  customer?: User;
  partnerId: string;
  partner?: Partner;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  returnLocation: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingFormData {
  vehicleId: string;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  returnLocation: string;
  specialRequests?: string;
}

// Partner Types
export interface Partner {
  id: string;
  userId: string;
  user?: User;
  businessName: string;
  businessType: 'individual' | 'company';
  businessLicense?: string;
  taxId?: string;
  bankAccount?: string;
  isVerified: boolean;
  rating?: number;
  reviewCount?: number;
  totalBookings?: number;
  totalEarnings?: number;
  createdAt: string;
  updatedAt: string;
}

// Admin Types
export interface AdminStats {
  totalUsers: number;
  totalPartners: number;
  totalVehicles: number;
  totalBookings: number;
  totalRevenue: number;
  activeBookings: number;
  pendingVerifications: number;
  monthlyStats: MonthlyStats[];
}

export interface MonthlyStats {
  month: string;
  users: number;
  bookings: number;
  revenue: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role?: 'customer' | 'partner';
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface FormState {
  loading: boolean;
  error: string;
  success: string;
}

// Search Types
export interface SearchFilters {
  location: string;
  pickupDate: string;
  returnDate: string;
  priceRange?: [number, number];
  transmission?: string[];
  fuelType?: string[];
  seats?: string[];
  style?: string[];
  brand?: string[];
  features?: string[];
  verified?: boolean;
  instantBooking?: boolean;
}

export type SortOption = 'price_low' | 'price_high' | 'rating' | 'newest';

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

// Hook Return Types
export interface UseVehiclesReturn {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseBookingsReturn {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseSearchReturn {
  vehicles: Vehicle[];
  allVehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  sortBy: SortOption;
  updateFilters: (filters: Partial<SearchFilters>) => void;
  setSortBy: (sort: SortOption) => void;
  clearFilters: () => void;
  refetch: () => Promise<void>;
}