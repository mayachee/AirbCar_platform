'use client';

import { Calendar, Activity, Clock, Car } from 'lucide-react';
import { formatDate } from '../utils/userUtils';

export default function UserActivityTab({ displayData, userBookings = [] }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Activity</h3>
      
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Account Created</p>
              <p className="text-sm text-gray-500">{formatDate(displayData?.date_joined)}</p>
            </div>
          </div>
        </div>

        {displayData?.last_login && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Last Login</p>
                <p className="text-sm text-gray-500">{formatDate(displayData.last_login)}</p>
              </div>
            </div>
          </div>
        )}

        {!displayData?.last_login && (
          <div className="border border-gray-200 rounded-lg p-4 bg-yellow-50">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900">No Login Activity</p>
                <p className="text-sm text-gray-500">This user has never logged in</p>
              </div>
            </div>
          </div>
        )}

        {/* Booking Activity Summary */}
        {userBookings.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Car className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">Total Bookings</p>
                <p className="text-sm text-gray-500">{userBookings.length} booking{userBookings.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Accepted: </span>
                <span className="font-semibold text-green-600">
                  {userBookings.filter(b => b.status === 'accepted' || b.status === 'confirmed').length}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Pending: </span>
                <span className="font-semibold text-yellow-600">
                  {userBookings.filter(b => b.status === 'pending').length}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Completed: </span>
                <span className="font-semibold text-blue-600">
                  {userBookings.filter(b => b.status === 'completed').length}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Cancelled: </span>
                <span className="font-semibold text-red-600">
                  {userBookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

