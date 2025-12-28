import Link from 'next/link'
import { AlertTriangle, Shield, Phone, Mail, MapPin, Clock, CheckCircle, XCircle, Info } from 'lucide-react'

export default function Restrictions({ vehicle }) {
  if (!vehicle) {
    return null
  }

  // Get owner/partner info from various possible field names
  const owner = vehicle.owner || vehicle.partner || vehicle.listing?.partner || (vehicle.partner_id ? { id: vehicle.partner_id } : null)
  const companyName = owner?.companyName || owner?.business_name || owner?.businessName || owner?.name || 'Partner'
  const partnerSlug = owner?.slug || owner?.partnerId || owner?.id

  // Debug: Log vehicle data to console (remove in production)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🔍 Restrictions Component - Vehicle Data:', {
      hasVehicle: !!vehicle,
      hasOwner: !!owner,
      ownerKeys: owner ? Object.keys(owner) : [],
      companyName,
      partnerSlug
    })
  }

  // Safely get restrictions array
  const restrictions = Array.isArray(vehicle.restrictions) 
    ? vehicle.restrictions 
    : []

  // Default restrictions if none provided
  const defaultRestrictions = [
    'Minimum age: 21 years',
    'Valid driver\'s license required',
    'Credit card required for deposit',
    'No smoking in the vehicle',
    'Return vehicle with same fuel level'
  ]

  const displayRestrictions = restrictions.length > 0 ? restrictions : defaultRestrictions

  return (
    <div className="space-y-6 mb-8">
      {/* Car Rules & Restrictions */}
      <div className="">
        <div className="flex items-center mb-5">
          <div className="p-2 bg-red-500/10 rounded-lg mr-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Car Rules & Restrictions</h3>
        </div>
        <div className="space-y-3">
          {displayRestrictions.map((restriction, index) => (
            <div key={index} className="flex items-start space-x-3 p-3">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-300 leading-relaxed">{restriction}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Partner Information */}
      {owner && (
        <div className="bg-gradient-to-br from-orange-500/10 to-transparent rounded-xl border border-orange-500/20 shadow-sm p-6 backdrop-blur-sm">
          <div className="flex items-center mb-5">
            <div className="p-2 bg-orange-500/20 rounded-lg mr-3">
              <Shield className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Owner Information</h3>
          </div>

          <div className="space-y-4">
            {/* Partner Logo and Company Name */}
            {companyName && (
              <div className="flex items-start space-x-4 pb-4 border-b border-orange-500/20">
                {/* Logo */}
                {partnerSlug ? (
                  <Link 
                    href={`/partner/${partnerSlug}`}
                    className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {owner.logo || owner.logo_url || owner.profilePicture || owner.profile_picture ? (
                      <img 
                        src={owner.logo || owner.logo_url || owner.profilePicture || owner.profile_picture} 
                        alt={companyName}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-orange-500/20 shadow-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-xl font-bold border-2 border-orange-500/20 shadow-sm"
                      style={{ display: (owner.logo || owner.logo_url || owner.profilePicture || owner.profile_picture) ? 'none' : 'flex' }}
                    >
                      {companyName[0]?.toUpperCase() || 'P'}
                    </div>
                  </Link>
                ) : (
                  <div className="flex-shrink-0">
                    {owner.logo || owner.logo_url || owner.profilePicture || owner.profile_picture ? (
                      <img 
                        src={owner.logo || owner.logo_url || owner.profilePicture || owner.profile_picture} 
                        alt={companyName}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-orange-200 shadow-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-xl font-bold border-2 border-orange-200 shadow-sm"
                      style={{ display: (owner.logo || owner.logo_url || owner.profilePicture || owner.profile_picture) ? 'none' : 'flex' }}
                    >
                      {companyName[0]?.toUpperCase() || 'P'}
                    </div>
                  </div>
                )}
                
                {/* Company Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Hosted by</p>
                  {partnerSlug ? (
                    <Link 
                      href={`/partner/${partnerSlug}`}
                      className="text-lg font-bold text-orange-500 transition-colors block truncate"
                    >
                      {companyName}
                    </Link>
                  ) : (
                    <p className="text-lg font-bold text-gray-900 truncate">{companyName}</p>
                  )}
                  {owner.businessType && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                      {owner.businessType}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Contact Information */}
            {(owner.phone || owner.email || owner.phone_number) && (
              <div className="pt-3">
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Contact Information</p>
                <div className="space-y-2">
                  {(owner.phone || owner.phone_number) && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-orange-600" />
                      <a 
                        href={`tel:${owner.phone || owner.phone_number}`}
                        className="text-sm text-gray-700 hover:text-orange-600 transition-colors"
                      >
                        {owner.phone || owner.phone_number}
                      </a>
                    </div>
                  )}
                  {owner.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-orange-600" />
                      <a 
                        href={`mailto:${owner.email}`}
                        className="text-sm text-gray-700 hover:text-orange-600 transition-colors"
                      >
                        {owner.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location */}
            {(owner.city || owner.address || owner.location) && (
              <div className="pt-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <p className="text-sm text-gray-700">
                      {[owner.city, owner.address, owner.location].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Response Time */}
            {owner.responseTime && (
              <div className="pt-3">
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Response Time</p>
                    <p className="text-sm font-medium text-gray-700">{owner.responseTime}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Verified Badge */}
            {owner.verified && (
              <div className="pt-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Verified Partner</span>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

