'use client';

import { useEffect } from 'react';

export default function ToastNotification({ toastMessage, onClose }) {
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [toastMessage, onClose]);

  if (!toastMessage) return null;

  const getToastStyles = () => {
    switch (toastMessage.type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getIcon = () => {
    switch (toastMessage.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${getToastStyles()}`}>
      <div className="flex items-center space-x-2">
        <span>{getIcon()}</span>
        <span>{toastMessage.message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-white hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
