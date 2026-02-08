'use client';

export default function BookingsTabs({ tab, onTabChange, upcomingCount, pastCount, allCount }) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8">
        {[
          { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
          { id: 'past', label: 'Past', count: pastCount },
          { id: 'all', label: 'All', count: allCount }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              tab === t.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                tab === t.id ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

