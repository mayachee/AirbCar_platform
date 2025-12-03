'use client';

import { Shield, Key, Building, User } from 'lucide-react';
import { formatDate } from '../utils/userUtils';

export default function UserSecurityTab({ displayData, onToggleActive }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="text-sm font-medium text-gray-500 mb-2 block">User ID</label>
            <p className="text-gray-900 font-mono text-sm">{displayData?.id || 'N/A'}</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <label className="text-sm font-medium text-gray-500 mb-2 block">Account Status</label>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                displayData?.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {displayData?.is_active ? 'Active' : 'Inactive'}
              </span>
              {onToggleActive && (
                <button
                  onClick={() => onToggleActive(displayData.id, !displayData.is_active)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {displayData?.is_active ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>
          </div>

          {displayData?.is_superuser && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Super Admin</span>
              </div>
              <p className="text-xs text-red-600 mt-1">This user has full system access</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="text-sm font-medium text-gray-500 mb-2 block">Permissions</label>
            <div className="space-y-2">
              {displayData?.is_superuser && (
                <div className="flex items-center space-x-2">
                  <Key className="h-3 w-3 text-red-600" />
                  <span className="text-sm text-gray-900">Super User Access</span>
                </div>
              )}
              {displayData?.is_staff && (
                <div className="flex items-center space-x-2">
                  <Shield className="h-3 w-3 text-blue-600" />
                  <span className="text-sm text-gray-900">Staff Access</span>
                </div>
              )}
              {displayData?.is_partner && (
                <div className="flex items-center space-x-2">
                  <Building className="h-3 w-3 text-green-600" />
                  <span className="text-sm text-gray-900">Partner Access</span>
                </div>
              )}
              {!displayData?.is_superuser && !displayData?.is_staff && !displayData?.is_partner && (
                <div className="flex items-center space-x-2">
                  <User className="h-3 w-3 text-gray-600" />
                  <span className="text-sm text-gray-900">Standard User</span>
                </div>
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <label className="text-sm font-medium text-gray-500 mb-2 block">Last Activity</label>
            <p className="text-gray-900 text-sm">
              {displayData?.last_login ? formatDate(displayData.last_login) : 'Never logged in'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

