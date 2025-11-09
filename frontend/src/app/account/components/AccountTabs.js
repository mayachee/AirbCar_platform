'use client';

export default function AccountTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'bookings', label: 'Bookings' }
  ];

  return (
    <div className="bg-white rounded-t-xl shadow-sm border-b">
      <div className="flex overflow-x-auto gap-2 px-4 sm:px-6 pb-2 -mb-2 snap-x snap-mandatory">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`snap-start whitespace-nowrap rounded-full px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-orange-100 text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

