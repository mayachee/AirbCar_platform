export default function SearchSummary({ searchDetails, selectedDates, onModifySearch }) {
  if (!searchDetails.location) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-blue-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="text-blue-800">{searchDetails.location}</span>
          </div>
          {searchDetails.pickupDate && (
            <>
              <span className="text-blue-400">•</span>
              <span className="text-blue-800">{selectedDates.pickup} - {selectedDates.return}</span>
              <span className="text-blue-400">•</span>
              <span className="text-blue-800">{searchDetails.duration} {searchDetails.duration === 1 ? 'day' : 'days'}</span>
            </>
          )}
        </div>
        <button
          onClick={onModifySearch}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Modify search
        </button>
      </div>
    </div>
  )
}

