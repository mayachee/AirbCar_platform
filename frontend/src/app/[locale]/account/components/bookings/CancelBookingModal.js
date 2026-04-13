'use client';

import { AlertCircle, XCircle, Loader2 } from 'lucide-react';

export default function CancelBookingModal({ isOpen, onClose, onConfirm, isLoading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-none max-w-md w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-red-100 p-3 rounded-none">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Cancel Booking?</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to cancel this booking? This action cannot be undone. You may be charged a cancellation fee depending on the rental policy.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-none text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Keep Booking
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-none hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                <span>Cancel Booking</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

