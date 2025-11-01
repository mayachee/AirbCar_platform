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
      <div className="flex space-x-1 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

