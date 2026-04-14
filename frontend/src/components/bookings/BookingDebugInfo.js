'use client';

import { useState } from 'react';
import { Bug, X } from 'lucide-react';

/**
 * Debug component to help diagnose booking permission issues
 * Only shown in development mode
 */
export default function BookingDebugInfo({ booking, currentUser }) {
  const [showDebug, setShowDebug] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  if (!booking || !currentUser) return null;

  const listing = booking.listing || {};
  const partner = listing.partner || {};
  const ownerUser = partner.user || booking.car_owner || {};

  const canAccept = 
    currentUser.id === ownerUser.id &&
    booking.status === 'pending';

  const issues = [];

  if (!listing.id) {
    issues.push('⚠️ Listing ID is missing');
  }
  if (!partner.id && !partner.pk) {
    issues.push('⚠️ Listing has no partner assigned');
  }
  if (!ownerUser.id && !ownerUser.pk) {
    issues.push('⚠️ Partner has no user assigned');
  }
  if (currentUser.id !== ownerUser.id) {
    issues.push(`❌ User mismatch: You are ${currentUser.id || currentUser.email}, but owner is ${ownerUser.id || ownerUser.email}`);
  }
  if (booking.status !== 'pending') {
    issues.push(`⚠️ Booking status is '${booking.status}', not 'pending'`);
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-2"
      >
        <Bug className="h-4 w-4" />
        <span>Debug Information {showDebug ? '(hide)' : '(show)'}</span>
      </button>

      {showDebug && (
        <div className="space-y-3 text-xs font-mono">
          <div>
            <strong>Current User:</strong>
            <pre className="bg-white p-2 rounded mt-1 overflow-auto">
              {JSON.stringify({
                id: currentUser.id,
                email: currentUser.email,
                is_partner: currentUser.is_partner,
                username: currentUser.username
              }, null, 2)}
            </pre>
          </div>

          <div>
            <strong>Booking:</strong>
            <pre className="bg-white p-2 rounded mt-1 overflow-auto">
              {JSON.stringify({
                id: booking.id,
                status: booking.status,
                listing_id: listing.id
              }, null, 2)}
            </pre>
          </div>

          <div>
            <strong>Listing:</strong>
            <pre className="bg-white p-2 rounded mt-1 overflow-auto">
              {JSON.stringify({
                id: listing.id,
                make: listing.make,
                model: listing.model,
                partner_id: partner.id || partner.pk,
                partner_exists: !!partner.id || !!partner.pk
              }, null, 2)}
            </pre>
          </div>

          <div>
            <strong>Partner/Owner:</strong>
            <pre className="bg-white p-2 rounded mt-1 overflow-auto">
              {JSON.stringify({
                partner_id: partner.id || partner.pk,
                owner_user_id: ownerUser.id || ownerUser.pk,
                owner_email: ownerUser.email,
                owner_username: ownerUser.username
              }, null, 2)}
            </pre>
          </div>

          <div>
            <strong>Permission Check:</strong>
            <div className={`p-2 rounded mt-1 ${canAccept ? 'bg-green-100' : 'bg-red-100'}`}>
              {canAccept ? (
                <span className="text-green-800">✓ Can accept this booking</span>
              ) : (
                <div className="text-red-800">
                  <p>✗ Cannot accept this booking</p>
                  <ul className="list-disc list-inside mt-1">
                    {issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

