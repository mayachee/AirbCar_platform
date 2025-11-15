import Link from 'next/link'

export default function OwnerInfo({ vehicle }) {
  if (!vehicle?.owner) {
    return null
  }

  const owner = vehicle.owner
  
  // Use logo if available, otherwise use profile picture, otherwise fallback to avatar
  const logoUrl = owner.logo || owner.profilePicture
  const companyName = owner.companyName || 'Company'
  const partnerSlug = owner.slug || owner.partnerId
  
  // Make logo/image clickable if we have a slug
  const avatarContent = partnerSlug ? (
    <Link href={`/partner/${partnerSlug}`} className="cursor-pointer hover:opacity-80 transition-opacity">
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt={companyName}
          className="w-20 h-20 rounded-lg object-cover border border-gray-200"
        />
      ) : (
        <div className="w-20 h-20 bg-orange-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold border border-gray-200">
          {companyName[0]?.toUpperCase() || 'C'}
        </div>
      )}
    </Link>
  ) : (
    logoUrl ? (
      <img 
        src={logoUrl} 
        alt={companyName}
        className="w-20 h-20 rounded-lg object-cover border border-gray-200"
      />
    ) : (
      <div className="w-20 h-20 bg-orange-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold border border-gray-200">
        {companyName[0]?.toUpperCase() || 'C'}
      </div>
    )
  )

  return (
    <div className="bg-white rounded-xl border p-6 mb-8">
      <div className="flex items-start space-x-4">
        {avatarContent}
        <div className="flex-1">
          {owner.companyName && (
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              {partnerSlug ? (
                <Link 
                  href={`/partner/${partnerSlug}`}
                  className="hover:text-orange-600 transition-colors cursor-pointer"
                >
                  Hosted by {owner.companyName}
                </Link>
              ) : (
                `Hosted by ${owner.companyName}`
              )}
            </h4>
          )}
          {owner.businessType && (
            <div className="mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {owner.businessType}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-4 mb-2">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-medium">{owner.rating}</span>
              {owner.reviewCount > 0 && (
                <span className="text-gray-500 ml-1">({owner.reviewCount} reviews)</span>
              )}
            </div>
            {owner.responseRate && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{owner.responseRate} response rate</span>
              </>
            )}
          </div>
          {owner.memberSince && (
            <p className="text-gray-600 text-sm mb-2">
              Member since {owner.memberSince}
            </p>
          )}
          {vehicle.responseTime && (
            <p className="text-gray-600 text-sm mb-3">
              {vehicle.responseTime}
            </p>
          )}
          {/* Location Information */}
          <div className="space-y-1 mb-3">
            {owner.city && (
              <div className="flex items-start text-gray-600 text-sm">
                <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  {owner.city}
                  {owner.address && `, ${owner.address}`}
                </span>
              </div>
            )}
            {owner.address && !owner.city && (
              <div className="flex items-start text-gray-600 text-sm">
                <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{owner.address}</span>
              </div>
            )}
          </div>
          {owner.verified && (
            <div className="flex items-center mb-3">
              <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-600 font-medium">Verified Partner</span>
            </div>
          )}
          {owner.languages && owner.languages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {owner.languages.map((lang, index) => (
                <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {lang}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

