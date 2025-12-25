'use client';

import { SelectField } from '@/components/ui/select-field';

export default function PreferencesTab() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Preferences</h3>
        <p className="text-gray-600">Customize your experience</p>
      </div>

      {/* Notification Preferences */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive updates about your bookings via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">SMS Notifications</p>
              <p className="text-sm text-gray-600">Get important booking updates via SMS</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Language Preference */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Language</h4>
        <div className="max-w-md">
          <SelectField
            placeholder="Select language"
            options={[
              { value: 'en', label: 'English' },
              { value: 'fr', label: 'Français' },
              { value: 'ar', label: 'العربية' },
            ]}
            className="w-full px-4 py-2 rounded-lg"
          />
        </div>
      </div>

      {/* Currency Preference */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Currency</h4>
        <div className="max-w-md">
          <SelectField
            placeholder="Select currency"
            options={[
              { value: 'MAD', label: 'MAD (Moroccan Dirham)' },
              { value: 'USD', label: 'USD (US Dollar)' },
              { value: 'EUR', label: 'EUR (Euro)' },
            ]}
            className="w-full px-4 py-2 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

