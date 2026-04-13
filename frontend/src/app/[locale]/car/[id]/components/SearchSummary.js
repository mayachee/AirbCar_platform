import { useTranslations } from 'next-intl'

export default function SearchSummary({ searchDetails, selectedDates, onModifySearch }) {
  const t = useTranslations('car_details')
  if (!searchDetails.location) return null

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-none p-4 mb-6 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-blue-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="text-blue-200">{searchDetails.location}</span>
          </div>
          {searchDetails.pickupDate && (
                <>
                  <span className="text-blue-400/60">•</span>
                  <span className="text-blue-200">{selectedDates.pickup} - {selectedDates.return}</span>
                  <span className="text-blue-400/60">•</span>
                  <span className="text-blue-200">{searchDetails.duration} {searchDetails.duration === 1 ? t('day') : t('days')}</span>
                </>
              )}
        </div>
        <button
          onClick={onModifySearch}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          {t('modify_search')}
        </button>
      </div>
    </div>
  )
}

