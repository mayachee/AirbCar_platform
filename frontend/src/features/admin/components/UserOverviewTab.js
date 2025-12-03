'use client';

import { Shield, Calendar, Clock, User, Mail, Phone, Cake, Image, Home, MapPin, Globe, Flag, CreditCard, FileText, ExternalLink, Building } from 'lucide-react';
import { formatDate } from '../utils/userUtils';
import { getUserRole } from '../utils/userUtils';

export default function UserOverviewTab({ displayData, userRole }) {
  const role = userRole || getUserRole(displayData);

  return (
    <div className="space-y-6">
      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-1">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">Role</span>
          </div>
          <p className="text-lg font-bold text-blue-900">{role}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-1">
            <Calendar className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-600">Member Since</span>
          </div>
          <p className="text-lg font-bold text-green-900">
            {displayData?.date_joined ? formatDate(displayData.date_joined) : 'N/A'}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-600">Last Login</span>
          </div>
          <p className="text-lg font-bold text-purple-900">
            {displayData?.last_login ? formatDate(displayData.last_login) : 'Never'}
          </p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Personal Information</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Basic Details</h4>
            
            <div>
              <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                <Mail className="h-3 w-3" />
                <span>Email Address</span>
              </label>
              <p className="text-sm text-gray-900 font-medium">{displayData?.email || 'N/A'}</p>
            </div>

            {displayData?.username && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Username</label>
                <p className="text-sm text-gray-900 font-medium">@{displayData.username}</p>
              </div>
            )}

            {displayData?.first_name && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">First Name</label>
                <p className="text-sm text-gray-900 font-medium">{displayData.first_name}</p>
              </div>
            )}

            {displayData?.last_name && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Last Name</label>
                <p className="text-sm text-gray-900 font-medium">{displayData.last_name}</p>
              </div>
            )}

            {displayData?.phone_number && (
              <div>
                <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                  <Phone className="h-3 w-3" />
                  <span>Phone Number</span>
                </label>
                <p className="text-sm text-gray-900 font-medium">{displayData.phone_number}</p>
              </div>
            )}

            {displayData?.date_of_birth && (
              <div>
                <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                  <Cake className="h-3 w-3" />
                  <span>Date of Birth</span>
                </label>
                <p className="text-sm text-gray-900 font-medium">
                  {formatDate(displayData.date_of_birth)}
                </p>
              </div>
            )}

            {displayData?.profile_picture && (
              <div>
                <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                  <Image className="h-3 w-3" />
                  <span>Profile Picture</span>
                </label>
                <div className="mt-2">
                  <img 
                    src={displayData.profile_picture} 
                    alt="Profile" 
                    className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <a 
                  href={displayData.profile_picture} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center space-x-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>View Full Image</span>
                </a>
              </div>
            )}
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Address & Location</h4>
            
            {displayData?.address && (
              <div>
                <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                  <Home className="h-3 w-3" />
                  <span>Address</span>
                </label>
                <p className="text-sm text-gray-900 font-medium">{displayData.address}</p>
              </div>
            )}

            {displayData?.city && (
              <div>
                <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                  <MapPin className="h-3 w-3" />
                  <span>City</span>
                </label>
                <p className="text-sm text-gray-900 font-medium">{displayData.city}</p>
              </div>
            )}

            {displayData?.postal_code && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Postal Code</label>
                <p className="text-sm text-gray-900 font-medium">{displayData.postal_code}</p>
              </div>
            )}

            {displayData?.country_of_residence && (
              <div>
                <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                  <Globe className="h-3 w-3" />
                  <span>Country of Residence</span>
                </label>
                <p className="text-sm text-gray-900 font-medium">{displayData.country_of_residence}</p>
              </div>
            )}

            {displayData?.nationality && (
              <div>
                <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                  <Flag className="h-3 w-3" />
                  <span>Nationality</span>
                </label>
                <p className="text-sm text-gray-900 font-medium">{displayData.nationality}</p>
              </div>
            )}

            {displayData?.default_currency && (
              <div>
                <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                  <CreditCard className="h-3 w-3" />
                  <span>Default Currency</span>
                </label>
                <p className="text-sm text-gray-900 font-medium">{displayData.default_currency}</p>
              </div>
            )}
          </div>

          {/* License & Verification */}
          <div className="space-y-4 md:col-span-3">
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">License & Verification</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {displayData?.license_number && (
                <div>
                  <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                    <FileText className="h-3 w-3" />
                    <span>License Number</span>
                  </label>
                  <p className="text-sm text-gray-900 font-medium font-mono">{displayData.license_number}</p>
                </div>
              )}

              {displayData?.license_origin_country && (
                <div>
                  <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                    <Flag className="h-3 w-3" />
                    <span>License Origin Country</span>
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{displayData.license_origin_country}</p>
                </div>
              )}

              {displayData?.issue_date && (
                <div>
                  <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                    <Calendar className="h-3 w-3" />
                    <span>License Issue Date</span>
                  </label>
                  <p className="text-sm text-gray-900 font-medium">
                    {formatDate(displayData.issue_date)}
                  </p>
                </div>
              )}

              {displayData?.id_verification_status !== undefined && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">ID Verification Status</label>
                  <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    displayData.id_verification_status === 'verified' || displayData.id_verification_status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : displayData.id_verification_status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {displayData.id_verification_status || 'pending'}
                  </p>
                </div>
              )}
            </div>

            {/* ID Documents Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayData?.id_front_document_url && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">ID Front Document</label>
                  <div className="border-2 border-gray-300 rounded-lg p-3 bg-gray-50 hover:border-blue-400 transition-colors">
                    <div className="bg-white rounded-lg p-2 flex items-center justify-center min-h-[200px] max-h-[400px] overflow-hidden">
                      <img 
                        src={displayData.id_front_document_url} 
                        alt="ID Front Document" 
                        className="w-full h-auto rounded-lg object-contain max-h-[350px] cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(displayData.id_front_document_url, '_blank')}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const errorDiv = e.target.nextElementSibling;
                          if (errorDiv) errorDiv.style.display = 'flex';
                        }}
                      />
                      <div className="hidden flex-col items-center justify-center text-center text-sm text-gray-500 p-4">
                        <FileText className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="mb-2">Document preview unavailable</p>
                        <a 
                          href={displayData.id_front_document_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center space-x-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Open Document</span>
                        </a>
                      </div>
                    </div>
                    <a 
                      href={displayData.id_front_document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center space-x-1"
                    >
                      <FileText className="h-3 w-3" />
                      <span>View Full Size in New Tab</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {displayData?.id_back_document_url && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">ID Back Document</label>
                  <div className="border-2 border-gray-300 rounded-lg p-3 bg-gray-50 hover:border-blue-400 transition-colors">
                    <div className="bg-white rounded-lg p-2 flex items-center justify-center min-h-[200px] max-h-[400px] overflow-hidden">
                      <img 
                        src={displayData.id_back_document_url} 
                        alt="ID Back Document" 
                        className="w-full h-auto rounded-lg object-contain max-h-[350px] cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(displayData.id_back_document_url, '_blank')}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const errorDiv = e.target.nextElementSibling;
                          if (errorDiv) errorDiv.style.display = 'flex';
                        }}
                      />
                      <div className="hidden flex-col items-center justify-center text-center text-sm text-gray-500 p-4">
                        <FileText className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="mb-2">Document preview unavailable</p>
                        <a 
                          href={displayData.id_back_document_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center space-x-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Open Document</span>
                        </a>
                      </div>
                    </div>
                    <a 
                      href={displayData.id_back_document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center space-x-1"
                    >
                      <FileText className="h-3 w-3" />
                      <span>View Full Size in New Tab</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {!displayData?.id_front_document_url && !displayData?.id_back_document_url && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No ID documents uploaded</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="space-y-6 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Account Information</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Role</label>
              <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                displayData?.is_superuser
                  ? 'bg-red-100 text-red-800'
                  : displayData?.is_staff
                  ? 'bg-blue-100 text-blue-800'
                  : displayData?.is_partner
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {role}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
              <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                displayData?.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {displayData?.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>

            {displayData?.role && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Role Type</label>
                <p className="text-sm text-gray-900 font-medium capitalize">{displayData.role}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {displayData?.date_joined && (
              <div>
                <label className="text-xs font-medium text-gray-500 flex items-center space-x-2 mb-1">
                  <Calendar className="h-3 w-3" />
                  <span>Joined Date</span>
                </label>
                <p className="text-sm text-gray-900 font-medium">{formatDate(displayData.date_joined)}</p>
              </div>
            )}

            {displayData?.last_login && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>Last Login</span>
                </label>
                <p className="text-sm text-gray-900 font-medium">{formatDate(displayData.last_login)}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {displayData?.email_verified !== undefined && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Email Verified</label>
                <p className="text-sm text-gray-900">
                  {displayData.email_verified ? (
                    <span className="text-green-600 font-semibold">✓ Verified</span>
                  ) : (
                    <span className="text-red-600 font-semibold">✗ Not Verified</span>
                  )}
                </p>
              </div>
            )}

            {displayData?.is_verified !== undefined && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Account Verified</label>
                <p className="text-sm text-gray-900">
                  {displayData.is_verified ? (
                    <span className="text-green-600 font-semibold">✓ Verified</span>
                  ) : (
                    <span className="text-red-600 font-semibold">✗ Not Verified</span>
                  )}
                </p>
              </div>
            )}

            {displayData?.is_partner !== undefined && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Is Partner</label>
                <p className="text-sm text-gray-900">
                  {displayData.is_partner ? (
                    <span className="text-green-600 font-semibold">✓ Yes</span>
                  ) : (
                    <span className="text-gray-600 font-semibold">✗ No</span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Partner Information */}
      {displayData?.is_partner && displayData?.partner && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Partner Information</span>
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {displayData.partner.company_name && (
              <div className="mb-2">
                <span className="text-sm font-medium text-gray-500">Company: </span>
                <span className="text-gray-900">{displayData.partner.company_name}</span>
              </div>
            )}
            {displayData.partner.verification_status && (
              <div>
                <span className="text-sm font-medium text-gray-500">Verification: </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  displayData.partner.verification_status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {displayData.partner.verification_status}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

