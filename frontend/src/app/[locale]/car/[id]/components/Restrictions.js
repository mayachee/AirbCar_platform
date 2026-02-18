import Link from 'next/link'
import { AlertTriangle, Shield, Phone, Mail, MapPin, Clock, CheckCircle, XCircle, Info } from 'lucide-react'

import { useTranslations } from 'next-intl'

export default function Restrictions({ vehicle }) {
  const t = useTranslations('car_details')
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
              <div className="flex items-start space-x-4 pb-4">
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

