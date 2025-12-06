/**
 * Account Data Type Definitions
 * Centralized type definitions for account data structure
 */

/**
 * @typedef {Object} AccountData
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} email - User's email address
 * @property {string} phoneNumber - User's phone number
 * @property {string} dateOfBirth - User's date of birth (YYYY-MM-DD)
 * @property {string} placeOfBirth - User's place of birth / nationality
 * @property {string} profileImage - Profile picture URL
 * @property {string} address - User's street address
 * @property {string} city - User's city
 * @property {string} country - User's country of residence
 * @property {string} postalCode - User's postal/zip code
 * @property {string} licenseNumber - Driver's license number
 * @property {string} licenseCountry - Country that issued the license
 * @property {string} licenseIssueDate - License issue date (YYYY-MM-DD)
 * @property {string} licenseExpiryDate - License expiry date (YYYY-MM-DD)
 * @property {string} idFrontDocumentUrl - URL to front side of identity document
 * @property {string} idBackDocumentUrl - URL to back side of identity document
 * @property {File|null} idFrontDocumentFile - Front document file being uploaded
 * @property {File|null} idBackDocumentFile - Back document file being uploaded
 * @property {string} idFrontDocumentPreview - Preview URL for front document
 * @property {string} idBackDocumentPreview - Preview URL for back document
 * @property {string} licenseFrontDocumentUrl - URL to front side of driver license
 * @property {string} licenseBackDocumentUrl - URL to back side of driver license
 * @property {File|null} licenseFrontDocumentFile - Front license document file being uploaded
 * @property {File|null} licenseBackDocumentFile - Back license document file being uploaded
 * @property {string} licenseFrontDocumentPreview - Preview URL for front license document
 * @property {string} licenseBackDocumentPreview - Preview URL for back license document
 */

/**
 * Default account data structure
 */
export const DEFAULT_ACCOUNT_DATA = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  dateOfBirth: '',
  placeOfBirth: '',
  profileImage: '/default-avatar.svg',
  address: '',
  city: '',
  country: '',
  postalCode: '',
  licenseNumber: '',
  licenseCountry: '',
  licenseIssueDate: '',
  licenseExpiryDate: '',
  idFrontDocumentUrl: '',
  idBackDocumentUrl: '',
  idFrontDocumentFile: null,
  idBackDocumentFile: null,
  idFrontDocumentPreview: '',
  idBackDocumentPreview: '',
  licenseFrontDocumentUrl: '',
  licenseBackDocumentUrl: '',
  licenseFrontDocumentFile: null,
  licenseBackDocumentFile: null,
  licenseFrontDocumentPreview: '',
  licenseBackDocumentPreview: ''
};

/**
 * Required fields for profile completion
 */
export const REQUIRED_FIELDS = [
  'firstName',
  'lastName',
  'phoneNumber',
  'licenseFrontDocumentUrl',
  'licenseBackDocumentUrl'
];

/**
 * Optional but recommended fields
 */
export const RECOMMENDED_FIELDS = [
  'dateOfBirth',
  'idFrontDocumentUrl',
  'idBackDocumentUrl'
];

/**
 * Validate account data field
 * @param {string} fieldName - Name of the field
 * @param {any} value - Value to validate
 * @returns {Object} Validation result with isValid and error message
 */
export const validateField = (fieldName, value) => {
  const trimmedValue = typeof value === 'string' ? value.trim() : value;

  switch (fieldName) {
    case 'email':
      if (!trimmedValue) return { isValid: false, error: 'Email is required' };
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedValue)) {
        return { isValid: false, error: 'Please enter a valid email address' };
      }
      return { isValid: true, error: null };

    case 'phoneNumber':
      if (!trimmedValue) return { isValid: false, error: 'Phone number is required' };
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(trimmedValue)) {
        return { isValid: false, error: 'Please enter a valid phone number' };
      }
      return { isValid: true, error: null };

    case 'dateOfBirth':
    case 'licenseIssueDate':
    case 'licenseExpiryDate':
      if (trimmedValue) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(trimmedValue)) {
          return { isValid: false, error: 'Please enter a valid date (YYYY-MM-DD)' };
        }
        const date = new Date(trimmedValue);
        if (isNaN(date.getTime())) {
          return { isValid: false, error: 'Please enter a valid date' };
        }
      }
      return { isValid: true, error: null };

    case 'firstName':
    case 'lastName':
      if (!trimmedValue) {
        return { isValid: false, error: `${fieldName === 'firstName' ? 'First' : 'Last'} name is required` };
      }
      if (trimmedValue.length < 2) {
        return { isValid: false, error: 'Name must be at least 2 characters' };
      }
      return { isValid: true, error: null };

    case 'address':
      // Address is optional - only validate format if provided
      if (trimmedValue && trimmedValue.length < 3) {
        return { isValid: false, error: 'Address must be at least 3 characters if provided' };
      }
      return { isValid: true, error: null };

    case 'city':
      // City is optional - only validate format if provided
      if (trimmedValue && trimmedValue.length < 2) {
        return { isValid: false, error: 'City must be at least 2 characters if provided' };
      }
      return { isValid: true, error: null };

    case 'country':
      if (!trimmedValue) {
        return { isValid: false, error: 'Country is required' };
      }
      if (trimmedValue.length < 2) {
        return { isValid: false, error: 'Country must be at least 2 characters' };
      }
      return { isValid: true, error: null };

    case 'licenseFrontDocumentUrl':
      if (!trimmedValue) {
        return { isValid: false, error: 'Driver\'s license front document is required' };
      }
      return { isValid: true, error: null };

    case 'licenseBackDocumentUrl':
      if (!trimmedValue) {
        return { isValid: false, error: 'Driver\'s license back document is required' };
      }
      return { isValid: true, error: null };

    default:
      return { isValid: true, error: null };
  }
};

/**
 * Validate complete account data
 * @param {AccountData} accountData - Account data to validate
 * @returns {Object} Validation result with isValid and errors object
 */
export const validateAccountData = (accountData) => {
  const errors = {};

  // Validate required fields
  REQUIRED_FIELDS.forEach(field => {
    // Special handling for license documents - check for URL or file
    if (field === 'licenseFrontDocumentUrl') {
      const hasUrl = accountData.licenseFrontDocumentUrl?.trim();
      const hasFile = accountData.licenseFrontDocumentFile;
      if (!hasUrl && !hasFile) {
        errors[field] = 'Driver\'s license front document is required';
      }
    } else if (field === 'licenseBackDocumentUrl') {
      const hasUrl = accountData.licenseBackDocumentUrl?.trim();
      const hasFile = accountData.licenseBackDocumentFile;
      if (!hasUrl && !hasFile) {
        errors[field] = 'Driver\'s license back document is required';
      }
    } else {
      const validation = validateField(field, accountData[field]);
      if (!validation.isValid) {
        errors[field] = validation.error;
      }
    }
  });

  // Validate optional fields if they have values
  Object.keys(accountData).forEach(field => {
    if (!REQUIRED_FIELDS.includes(field) && accountData[field]) {
      const validation = validateField(field, accountData[field]);
      if (!validation.isValid) {
        errors[field] = validation.error;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Calculate profile completion percentage
 * @param {AccountData} accountData - Account data
 * @returns {number} Completion percentage (0-100)
 */
export const calculateProfileCompletion = (accountData) => {
  const allFields = [...REQUIRED_FIELDS, ...RECOMMENDED_FIELDS];
  const completedFields = allFields.filter(field => {
    const value = accountData[field];
    return value && (typeof value === 'string' ? value.trim() !== '' : value !== null);
  }).length;
  
  return Math.round((completedFields / allFields.length) * 100);
};

/**
 * Map backend user data to frontend account data format
 * @param {Object} userData - User data from backend (snake_case)
 * @returns {AccountData} Account data in frontend format (camelCase)
 */
export const mapBackendToFrontend = (userData) => {
  if (!userData || typeof userData !== 'object') {
    console.warn('⚠️ mapBackendToFrontend: Invalid userData', userData);
    return {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      placeOfBirth: '',
      profileImage: '/default-avatar.svg',
      address: '',
      city: '',
      country: '',
      postalCode: '',
      licenseNumber: '',
      licenseCountry: '',
      licenseIssueDate: '',
      licenseExpiryDate: '',
      idFrontDocumentUrl: '',
      idBackDocumentUrl: '',
      idFrontDocumentFile: null,
      idBackDocumentFile: null,
      idFrontDocumentPreview: '',
      idBackDocumentPreview: '',
      licenseFrontDocumentUrl: '',
      licenseBackDocumentUrl: '',
      licenseFrontDocumentFile: null,
      licenseBackDocumentFile: null,
      licenseFrontDocumentPreview: '',
      licenseBackDocumentPreview: ''
    };
  }
  
  // Helper to safely get value (handle null, undefined, "None" string)
  const getValue = (value, defaultValue = '') => {
    if (value === null || value === undefined || value === 'None' || value === '') {
      return defaultValue;
    }
    return value;
  };
  
  // Helper to format date
  const formatDate = (dateValue) => {
    if (!dateValue || dateValue === 'None') return '';
    if (typeof dateValue === 'string') {
      // If it's already a string, return it (should be YYYY-MM-DD)
      return dateValue;
    }
    // If it's a date object, format it
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };
  
  return {
    firstName: getValue(userData.first_name),
    lastName: getValue(userData.last_name),
    email: getValue(userData.email),
    phoneNumber: getValue(userData.phone_number),
    dateOfBirth: formatDate(userData.date_of_birth),
    placeOfBirth: getValue(userData.nationality) || getValue(userData.place_of_birth),
    profileImage: getValue(userData.profile_picture_url) || getValue(userData.profile_picture) || '/default-avatar.svg',
    address: getValue(userData.address),
    city: getValue(userData.city),
    country: getValue(userData.country_of_residence) || getValue(userData.country),
    postalCode: getValue(userData.postal_code),
    licenseNumber: getValue(userData.license_number),
    licenseCountry: getValue(userData.license_origin_country) || getValue(userData.license_country),
    licenseIssueDate: formatDate(userData.issue_date) || formatDate(userData.license_issue_date),
    licenseExpiryDate: formatDate(userData.expiry_date) || formatDate(userData.license_expiry_date),
    idFrontDocumentUrl: getValue(userData.id_front_document_url),
    idBackDocumentUrl: getValue(userData.id_back_document_url),
    idFrontDocumentFile: null,
    idBackDocumentFile: null,
    idFrontDocumentPreview: '',
    idBackDocumentPreview: '',
    licenseFrontDocumentUrl: getValue(userData.license_front_document_url),
    licenseBackDocumentUrl: getValue(userData.license_back_document_url),
    licenseFrontDocumentFile: null,
    licenseBackDocumentFile: null,
    licenseFrontDocumentPreview: '',
    licenseBackDocumentPreview: ''
  };
};

/**
 * Map frontend account data to backend format
 * @param {AccountData} accountData - Account data in frontend format (camelCase)
 * @returns {Object} User data in backend format (snake_case)
 */
export const mapFrontendToBackend = (accountData) => {
  const backendData = {
    first_name: accountData.firstName || null,
    last_name: accountData.lastName || null,
    phone_number: accountData.phoneNumber || null,
    date_of_birth: accountData.dateOfBirth || null,
    address: accountData.address || null,
    city: accountData.city || null,
    country_of_residence: accountData.country || null,
    postal_code: accountData.postalCode || null,
    license_number: accountData.licenseNumber || null,
    license_origin_country: accountData.licenseCountry || null,
    issue_date: accountData.licenseIssueDate || null,
    expiry_date: accountData.licenseExpiryDate || null,
    nationality: accountData.placeOfBirth || null
  };

  // Remove null/undefined/empty string values
  Object.keys(backendData).forEach(key => {
    if (backendData[key] === null || backendData[key] === undefined || backendData[key] === '') {
      delete backendData[key];
    }
  });

  return backendData;
};

