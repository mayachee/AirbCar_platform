export default function BookingFilters({ filter, setFilter, bookings, getFilteredBookings, getUpcomingCount, getCompletedCount, getCancelledCount }) {
  const tabs = [
    { key: 'all', label: 'All Bookings', count: bookings.length },
    { key: 'upcoming', label: 'Upcoming', count: getUpcomingCount() },
    { key: 'completed', label: 'Completed', count: getCompletedCount() },
    { key: 'cancelled', label: 'Cancelled', count: getCancelledCount() }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex space-x-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              filter === tab.key
                ? 'border-orange-500 text-orange-600 bg-orange-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
              filter === tab.key ? 'bg-orange-200' : 'bg-gray-200'
            }`}>
              {filter === tab.key ? getFilteredBookings().length : tab.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}


