'use client';

import { Star, MapPin, Calendar, Shield, CheckCircle2, Car, TrendingUp, Award, Phone, Mail, Building2 } from 'lucide-react';

export default function OwnerSpotlight({ partner }) {
  // Debug: Log partner data to see what's available
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🔍 OwnerSpotlight - Partner Data:', {
      hasPartner: !!partner,
      partnerKeys: partner ? Object.keys(partner) : [],
      description: partner?.description,
      data: partner?.data
    })
  }

  // Handle nested data structure (response.data.data)
  const partnerData = partner?.data || partner || {}
  
  const companyName = partnerData?.business_name || partnerData?.company_name || partnerData?.companyName || partnerData?.user?.first_name || 'Partner';
  const logo = partnerData?.logo || partnerData?.logo_url || partnerData?.profile_picture || partnerData?.user?.profile_picture;
  const description = partnerData?.description || partnerData?.bio;
  const rating = partnerData?.rating || 0;
  const reviewCount = partnerData?.review_count || 0;
  const isVerified = partnerData?.is_verified || false;
  const location = partnerData?.location || partnerData?.city || partnerData?.user?.city || '';
  const memberSince = partnerData?.created_at ? new Date(partnerData.created_at).getFullYear() : null;
  const businessType = partnerData?.business_type;
  const totalBookings = partnerData?.total_bookings || 0;
  const totalEarnings = partnerData?.total_earnings || 0;
  const user = partnerData?.user;
  const phone = partnerData?.phone || partnerData?.phone_number || user?.phone_number;
  const email = partnerData?.email || user?.email;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header Section with Gradient */}
      <div className="bg-orange-500 px-8 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Logo/Avatar */}
          <div className="flex-shrink-0 relative">
            {logo ? (
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-xl ring-2 ring-orange-300">
                <img
                  src={logo}
                  alt={companyName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              </div>
            ) : null}
            <div 
              className="w-28 h-28 rounded-2xl bg-white flex items-center justify-center text-orange-600 text-4xl font-bold border-4 border-white shadow-xl ring-2 ring-orange-300"
              style={{ display: logo ? 'none' : 'flex' }}
            >
              {companyName[0]?.toUpperCase() || 'P'}
            </div>
            {isVerified && (
              <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 border-4 border-white shadow-lg">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            )}
          </div>

          {/* Company Name and Badges */}
          <div className="flex-1 text-white">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 drop-shadow-sm">
                  {companyName}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  {isVerified && (
                    <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                      <Shield className="h-4 w-4" />
                      <span>Verified Partner</span>
                    </div>
                  )}
                  {businessType && (
                    <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium capitalize">
                      <Building2 className="h-4 w-4" />
                      <span>{businessType}</span>
                    </div>
                  )}
                  {memberSince && (
                    <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                      <Calendar className="h-4 w-4" />
                      <span>Since {memberSince}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8">
        {/* Rating and Stats Row */}
        <div className="flex flex-wrap items-center gap-6 mb-6 pb-6 border-b border-gray-200">
          {rating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="ml-2 font-bold text-gray-900 text-lg">{rating.toFixed(1)}</span>
              </div>
              {reviewCount > 0 && (
                <span className="text-gray-600 text-sm font-medium">
                  {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-4">
            {totalBookings > 0 && (
              <div className="flex items-center gap-2 text-gray-700">
                <Car className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">{totalBookings} booking{totalBookings !== 1 ? 's' : ''}</span>
              </div>
            )}
            {totalEarnings > 0 && (
              <div className="flex items-center gap-2 text-gray-700">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">${totalEarnings.toLocaleString()} earned</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-orange-500 rounded"></span>
            About {companyName}
          </h3>
          {description ? (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <p className="text-gray-700 leading-relaxed text-base whitespace-pre-line">
                {description}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 border-dashed">
              <p className="text-gray-500 italic text-sm text-center">
                No description available for this partner yet.
              </p>
            </div>
          )}
        </div>

        {/* Contact and Location Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Location */}
          {location && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MapPin className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</p>
                <p className="text-gray-900 font-medium">{location}</p>
              </div>
            </div>
          )}

          {/* Contact Info */}
          {(phone || email) && (
            <div className="flex flex-col gap-2">
              {phone && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                    <a 
                      href={`tel:${phone}`}
                      className="text-gray-900 font-medium hover:text-orange-600 transition-colors truncate block"
                    >
                      {phone}
                    </a>
                  </div>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                    <a 
                      href={`mailto:${email}`}
                      className="text-gray-900 font-medium hover:text-orange-600 transition-colors truncate block"
                    >
                      {email}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trust Badges */}
        {isVerified && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-green-600">
              <Award className="h-5 w-5" />
              <span className="text-sm font-semibold">Trusted Partner • Verified Identity • Quality Service</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

