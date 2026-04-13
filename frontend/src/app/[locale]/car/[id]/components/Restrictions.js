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
    t('min_age_default'),
    t('valid_license_required'),
    t('credit_card_required_deposit'),
    t('no_smoking'),
    t('return_same_fuel')
  ]

  const displayRestrictions = restrictions.length > 0 ? restrictions : defaultRestrictions

  return (
    <div className="space-y-6 mb-8">
      {/* Car Rules & Restrictions */}
      <div className="">
        <div className="flex items-center justify-start mb-5">
          <div className="p-2.5 bg-red-50 rounded-2xl mr-4 shadow-sm shadow-red-100/50">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t('car_rules_restrictions')}</h3>
        </div>
        <div className="space-y-4">
          {displayRestrictions.map((restriction, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-white border border-gray-100 rounded-3xl shadow-sm shadow-gray-200/50">
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <span className="text-base font-medium text-gray-700 leading-relaxed">{restriction}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Partner Information */}
      {owner && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm shadow-gray-200/50 p-6 mt-10">
          <div className="flex items-center mb-6">
            <div className="p-2.5 bg-orange-50 rounded-2xl mr-4 shadow-sm shadow-orange-100/50">
              <Shield className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t('owner_information')}</h3>
          </div>

          <div className="space-y-4">
            {/* Partner Logo and Company Name */}
            {companyName && (
              <div className="flex items-center space-x-5 pb-6 border-b border-gray-100">
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
                        className="w-16 h-16 rounded-2xl object-cover shadow-sm shadow-gray-200/50"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-16 h-16 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center text-orange-600 text-2xl font-extrabold shadow-sm shadow-orange-200/50"
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
                        className="w-16 h-16 rounded-2xl object-cover shadow-sm shadow-gray-200/50"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-16 h-16 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center text-orange-600 text-2xl font-extrabold shadow-sm shadow-orange-200/50"
                      style={{ display: (owner.logo || owner.logo_url || owner.profilePicture || owner.profile_picture) ? 'none' : 'flex' }}
                    >
                      {companyName[0]?.toUpperCase() || 'P'}
                    </div>
                  </div>
                )}
                
                {/* Company Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-400 mb-0.5 uppercase tracking-wider">{t('hosted_by')}</p>
                  {partnerSlug ? (
                    <Link 
                      href={`/partner/${partnerSlug}`}
                      className="text-xl font-extrabold text-gray-900 hover:text-orange-500 transition-colors block truncate"
                    >
                      {companyName}
                    </Link>
                  ) : (
                    <p className="text-xl font-extrabold text-gray-900 truncate">{companyName}</p>
                  )}
                  {owner.businessType && (
                    <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 mt-2 tracking-wide uppercase">
                      {owner.businessType}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Verified Badge */}
                  {owner.verified && (
              <div className="pt-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">{t('verified_partner')}</span>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

