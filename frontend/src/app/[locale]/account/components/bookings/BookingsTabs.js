'use client';

import { useTranslations } from 'next-intl';

export default function BookingsTabs({ tab, onTabChange, upcomingCount, pastCount, allCount }) {
  const t = useTranslations('account');
  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8">
        {[
          { id: 'upcoming', label: t('bt_upcoming'), count: upcomingCount },
          { id: 'past', label: t('bt_past'), count: pastCount },
          { id: 'all', label: t('bt_all'), count: allCount }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              tab === item.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {item.label}
            {item.count > 0 && (
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                tab === item.id ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

