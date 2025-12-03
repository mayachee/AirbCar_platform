/**
 * Utility functions for user data normalization and formatting
 */

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const normalizeUserData = (data) => {
  if (!data) return {};
  
  return {
    id: data.id || data.pk || data.user_id || null,
    email: data.email || data.email_address || null,
    username: data.username || data.user_name || data.user || null,
    first_name: data.first_name || data.firstName || data.firstname || data.given_name || null,
    last_name: data.last_name || data.lastName || data.lastname || data.family_name || data.surname || null,
    phone_number: data.phone_number || data.phoneNumber || data.phone || data.mobile || data.telephone || null,
    address: data.address || data.street_address || data.full_address || null,
    city: data.city || data.city_name || null,
    postal_code: data.postal_code || data.postalCode || data.zip_code || data.zip || null,
    country_of_residence: data.country_of_residence || data.countryOfResidence || data.country || data.residence_country || null,
    nationality: data.nationality || data.nationality_country || null,
    default_currency: data.default_currency || data.defaultCurrency || data.currency || null,
    date_of_birth: data.date_of_birth || data.dateOfBirth || data.birthday || data.birth_date || null,
    profile_picture: data.profile_picture || data.profilePicture || data.profile_picture_url || data.avatar || data.profile_image || null,
    license_number: data.license_number || data.licenseNumber || data.driving_license_number || data.dl_number || null,
    license_origin_country: data.license_origin_country || data.licenseOriginCountry || data.dl_country || null,
    issue_date: data.issue_date || data.issueDate || data.license_issue_date || null,
    id_verification_status: data.id_verification_status || data.idVerificationStatus || data.verification_status || data.verificationStatus || data.id_status || null,
    id_front_document_url: data.id_front_document_url || data.idFrontDocumentUrl || data.id_front || data.front_document || data.id_document_front || null,
    id_back_document_url: data.id_back_document_url || data.idBackDocumentUrl || data.id_back || data.back_document || data.id_document_back || null,
    is_active: data.is_active !== undefined ? data.is_active : (data.isActive !== undefined ? data.isActive : (data.active !== undefined ? data.active : true)),
    is_superuser: data.is_superuser || data.isSuperuser || data.superuser || false,
    is_staff: data.is_staff || data.isStaff || data.staff || false,
    is_partner: data.is_partner || data.isPartner || data.partner || false,
    role: data.role || data.user_role || data.account_type || null,
    date_joined: data.date_joined || data.dateJoined || data.created_at || data.created || data.registration_date || null,
    last_login: data.last_login || data.lastLogin || data.last_logged_in || data.last_session || null,
    email_verified: data.email_verified !== undefined ? data.email_verified : (data.emailVerified !== undefined ? data.emailVerified : (data.verified !== undefined ? data.verified : false)),
    is_verified: data.is_verified !== undefined ? data.is_verified : (data.isVerified !== undefined ? data.isVerified : false),
    partner: data.partner || data.partner_info || data.partnerInfo || null,
    // Keep all original data for reference
    _raw: data
  };
};

export const getUserRole = (displayData) => {
  return displayData?.is_superuser ? 'Super Admin' :
         displayData?.is_staff ? 'Staff' :
         displayData?.is_partner ? 'Partner' :
         displayData?.role || 'User';
};

export const getUserName = (displayData) => {
  return displayData?.first_name && displayData?.last_name
    ? `${displayData.first_name} ${displayData.last_name}`
    : displayData?.username || displayData?.email || 'User';
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'accepted':
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'rejected':
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

