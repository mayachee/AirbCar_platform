export default function OwnerInfo({ vehicle }) {
  return (
    <div className="bg-white rounded-xl border p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Hosted by {vehicle.owner.name}</h3>
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
          {vehicle.owner.avatar}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-2">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-medium">{vehicle.owner.rating}</span>
              <span className="text-gray-500 ml-1">({vehicle.owner.reviewCount} reviews)</span>
            </div>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{vehicle.owner.responseRate} response rate</span>
          </div>
          <p className="text-gray-600 text-sm mb-2">
            Member since {vehicle.owner.memberSince}
          </p>
          <p className="text-gray-600 text-sm mb-3">
            {vehicle.responseTime}
          </p>
          <div className="flex flex-wrap gap-2">
            {vehicle.owner.languages.map((lang, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

