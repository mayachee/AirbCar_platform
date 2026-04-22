// API Constants
export const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/login/',
    REGISTER: '/api/register/',
    REFRESH: '/api/token/refresh/',
    LOGOUT: '/api/logout/',
    PROFILE: '/users/me/',
    VERIFY_TOKEN: '/api/verify-token/',
    VERIFY_ADMIN: '/api/verify-admin/',
    VERIFY_EMAIL: '/api/verify-email/',
    VERIFY_EMAIL_GET: '/verify-email/',
    PASSWORD_RESET_REQUEST: '/api/password-reset/',
    PASSWORD_RESET_CONFIRM: (uidb64, token) => `/api/reset-password/${uidb64}/${token}/`,
    CHANGE_PASSWORD: '/users/me/change-password/',
    FORGOT_PASSWORD: '/api/password-reset/',
    RESET_PASSWORD: '/api/reset-password/',
    RESEND_VERIFICATION: '/users/resend-verification/',
  },
  USERS: {
    LIST: '/users/',
    DETAIL: (id) => `/users/${id}/`,
    UPDATE: (id) => `/users/${id}/`,
    PATCH: (id) => `/users/${id}/`,
    DELETE: (id) => `/users/${id}/`,
    ME: '/users/me/',
  },
  LISTINGS: {
    LIST: '/listings/',
    DETAIL: (id) => `/listings/${id}/`,
    CREATE: '/listings/',
    UPDATE: (id) => `/listings/${id}/`,
    PATCH: (id) => `/listings/${id}/`,
    DELETE: (id) => `/listings/${id}/`,
    SEARCH: '/listings/search/',
    FAVORITES: '/favorites/',
    BY_PARTNER: (partnerId) => `/listings/?partner_id=${partnerId}`,
  },
  BOOKINGS: {
    LIST: '/bookings/',
    CREATE: '/bookings/',
    DETAIL: (id) => `/bookings/${id}/`,
    UPDATE: (id) => `/bookings/${id}/`,
  },
  REVIEWS: {
    LIST: '/reviews/',
    CREATE: '/reviews/',
    DETAIL: (id) => `/reviews/${id}/`,
    UPDATE: (id) => `/reviews/${id}/`,
    BY_LISTING: (listingId) => `/reviews/?listing=${listingId}`,
    BY_USER: (userId) => `/reviews/?user=${userId}`,
    CAN_REVIEW: '/reviews/can_review/',
    PUBLISH: (id) => `/reviews/${id}/publish/`,
    MY_LISTINGS: '/reviews/?my_listings=true',
  },
  PARTNERS: {
    LIST: '/partners/',
    CREATE: '/partners/',
    DETAIL: (id) => `/partners/${id}/`,
    UPDATE: (id) => `/partners/${id}/`,
    PATCH: (id) => `/partners/${id}/`,
    DELETE: (id) => `/partners/${id}/`,
    ME: '/partners/me/',
    REGISTER: '/partners/',
    DASHBOARD: '/partners/dashboard/',
  },
  ADMIN: {
    USERS: '/admin/users/',
    STATS: '/admin/stats/',
  },
  NEWSLETTER: {
    SUBSCRIBE: '/api/newsletter/subscribe/',
  }
}

// App Constants
export const APP_NAME = 'Airbcar'
export const APP_DESCRIPTION = 'Premium car rental platform in Morocco'

// UI Constants
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export const COLORS = {
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
  },
  secondary: {
    50: '#f0f9ff',
    500: '#3b82f6',
    600: '#2563eb',
  }
}

// Car Categories
export const CAR_CATEGORIES = [
  { id: 'economy', name: 'Economy', icon: '🚗' },
  { id: 'compact', name: 'Compact', icon: '🚙' },
  { id: 'intermediate', name: 'Intermediate', icon: '🚘' },
  { id: 'standard', name: 'Standard', icon: '🚖' },
  { id: 'premium', name: 'Premium', icon: '🚗' },
  { id: 'luxury', name: 'Luxury', icon: '🏎️' },
]

// Moroccan Cities - All major cities in Morocco
export const MOROCCAN_CITIES = [
  'Agadir',
  'Al Hoceima',
  'Azemmour',
  'Azrou',
  'Beni Mellal',
  'Berkane',
  'Berrechid',
  'Boujdour',
  'Casablanca', 
  'Chefchaouen',
  'Dakhla',
  'El Jadida',
  'Errachidia',
  'Essaouira',
  'Fes',
  'Figuig',
  'Guelmim',
  'Ifrane',
  'Imzouren',
  'Kenitra',
  'Khemisset',
  'Khenifra',
  'Khouribga',
  'Laayoune',
  'Larache',
  'Marrakech',
  'Meknes',
  'Mohammedia',
  'Nador',
  'Ouarzazate',
  'Oujda',
  'Rabat',
  'Safi',
  'Sale',
  'Sefrou',
  'Settat',
  'Sidi Ifni',
  'Sidi Kacem',
  'Tangier',
  'Taroudant',
  'Taza',
  'Tetouan',
  'Tiznit',
  'Touima',
  'Touissit',
  'Zagora'
].sort() // Sort alphabetically for better UX

// Moroccan city coordinates [lat, lng] — used by the search map
export const MOROCCAN_CITY_COORDS = {
  Agadir: [30.4278, -9.5981],
  'Al Hoceima': [35.2517, -3.9372],
  Azemmour: [33.2877, -8.3417],
  Azrou: [33.4344, -5.2212],
  'Beni Mellal': [32.3373, -6.3498],
  Berkane: [34.9214, -2.3198],
  Berrechid: [33.2653, -7.5877],
  Boujdour: [26.1253, -14.4844],
  Casablanca: [33.5731, -7.5898],
  Chefchaouen: [35.1715, -5.2696],
  Dakhla: [23.6848, -15.9579],
  'El Jadida': [33.2316, -8.5007],
  Errachidia: [31.9314, -4.4247],
  Essaouira: [31.5085, -9.7595],
  Fes: [34.0181, -5.0078],
  Figuig: [32.1093, -1.2266],
  Guelmim: [28.9870, -10.0574],
  Ifrane: [33.5228, -5.1106],
  Imzouren: [35.1503, -3.8519],
  Kenitra: [34.2610, -6.5802],
  Khemisset: [33.8244, -6.0661],
  Khenifra: [32.9350, -5.6681],
  Khouribga: [32.8811, -6.9063],
  Laayoune: [27.1536, -13.2033],
  Larache: [35.1933, -6.1562],
  Marrakech: [31.6295, -7.9811],
  Meknes: [33.8935, -5.5473],
  Mohammedia: [33.6866, -7.3830],
  Nador: [35.1681, -2.9287],
  Ouarzazate: [30.9335, -6.9370],
  Oujda: [34.6814, -1.9086],
  Rabat: [34.0209, -6.8416],
  Safi: [32.2994, -9.2372],
  Sale: [34.0531, -6.7985],
  Sefrou: [33.8311, -4.8339],
  Settat: [33.0000, -7.6167],
  'Sidi Ifni': [29.3797, -10.1725],
  'Sidi Kacem': [34.2214, -5.7086],
  Tangier: [35.7595, -5.8340],
  Taroudant: [30.4703, -8.8770],
  Taza: [34.2139, -4.0100],
  Tetouan: [35.5785, -5.3684],
  Tiznit: [29.6974, -9.7322],
  Touima: [34.8794, -2.3167],
  Touissit: [34.4833, -1.7333],
  Zagora: [30.3325, -5.8380],
}

// Default map view when no location is selected — Morocco centroid
export const MOROCCO_CENTER = [31.7917, -7.0926]
export const MOROCCO_DEFAULT_ZOOM = 6

// Pagination
export const ITEMS_PER_PAGE = 12
export const MAX_PAGINATION_PAGES = 5

// Form Validation
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+212|0)[5-7]\d{8}$/,
  PASSWORD_MIN_LENGTH: 8,
}

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  PARTNER: 'partner',
  ADMIN: 'admin',
}

// File Upload
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGES_PER_LISTING: 10,
}
