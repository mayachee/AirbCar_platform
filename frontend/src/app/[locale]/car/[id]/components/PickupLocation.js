import { useTranslations } from 'next-intl'

export default function PickupLocation({ vehicle }) {
  const t = useTranslations('car_details')
  if (!vehicle) {
    return null
  }

  // Get address from various possible field names
  const address = vehicle.fullAddress || vehicle.address || vehicle.location || t('location_provided_after_booking')

  return (
    <div className="bg-white rounded-3xl border p-6 mb-8 shadow-sm shadow-gray-200/50">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{t('pickup_return_location')}</h3>
      <div className="flex items-start space-x-4">
        <div className="p-2 bg-orange-50 rounded-2xl">
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div className="mt-1">
          <p className="font-semibold text-gray-900 text-lg leading-tight">{address}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">
            {t('exact_location_provided_after_booking')}
          </p>
        </div>
      </div>
    </div>
  )
}

