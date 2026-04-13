'use client';

import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function ToastNotifications({ successMessage, errorMessage, onSuccessDismiss, onErrorDismiss }) {
  return (
    <>
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-none shadow-lg flex items-center space-x-2 animate-slide-in">
          <CheckCircle className="h-5 w-5" />
          <span>{successMessage}</span>
          <button onClick={onSuccessDismiss} className="ml-2 hover:text-green-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-none shadow-lg flex items-center space-x-2 animate-slide-in">
          <AlertCircle className="h-5 w-5" />
          <span>{errorMessage}</span>
          <button onClick={onErrorDismiss} className="ml-2 hover:text-red-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}

