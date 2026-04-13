import { useTranslations } from 'next-intl'

export default function SearchSummary({ searchDetails, selectedDates, onModifySearch }) {
  const t = useTranslations('car_details')
  if (!searchDetails.location) return null

  return (
    <div className="bg-white border rounded-2xl p-4 mb-6 shadow-sm shadow-gray-200/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center text-gray-900 font-medium">
            <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span>{searchDetails.location}</span>
          </div>
          {searchDetails.pickupDate && (
                <>
                  <span className="text-gray-300">•</span>
                  <span>{selectedDates.pickup} - {selectedDates.return}</span>
                  <span className="text-gray-300">•</span>
                  <span>{searchDetails.duration} {searchDetails.duration === 1 ? t('day') : t('days')}</span>
                </>
              )}
        </div>
        <button
          onClick={onModifySearch}
          className="text-orange-600 hover:text-orange-700 text-sm font-semibold transition-colors"
        >
          {t('modify_search')}
        </button>
      </div>
    </div>
  )
}

