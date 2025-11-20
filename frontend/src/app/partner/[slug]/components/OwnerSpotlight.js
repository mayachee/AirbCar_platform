'use client';

import { Star, MapPin, Calendar, Shield, CheckCircle2 } from 'lucide-react';

export default function OwnerSpotlight({ partner }) {
  const companyName = partner?.business_name || partner?.company_name || partner?.user?.first_name || 'Partner';
  const logo = partner?.logo || partner?.profile_picture;
  const description = partner?.description || partner?.bio;
  const rating = partner?.rating || 0;
  const reviewCount = partner?.review_count || 0;
  const isVerified = partner?.is_verified || false;
  const location = partner?.location || partner?.city || '';
  const memberSince = partner?.created_at ? new Date(partner.created_at).getFullYear() : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Logo/Avatar */}
        <div className="flex-shrink-0">
          {logo ? (
            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200">
              <img
                src={logo}
                alt={companyName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/carsymbol.jpg';
                }}
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-xl bg-orange-500 flex items-center justify-center text-white text-3xl font-bold border-2 border-gray-200">
              {companyName[0]?.toUpperCase() || 'P'}
            </div>
          )}
        </div>

        {/* Company Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {companyName}
              </h1>
              {isVerified && (
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Verified Partner</span>
                </div>
              )}
            </div>
          </div>

          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                <span className="ml-1 font-semibold text-gray-900">{rating.toFixed(1)}</span>
              </div>
              {reviewCount > 0 && (
                <span className="text-gray-600 text-sm">
                  ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-gray-700 mb-4 leading-relaxed">
              {description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            )}
            {memberSince && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Member since {memberSince}</span>
              </div>
            )}
            {isVerified && (
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>Verified</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

