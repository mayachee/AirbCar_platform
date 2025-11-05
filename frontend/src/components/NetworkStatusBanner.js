'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, X, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NetworkStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [backendUnavailable, setBackendUnavailable] = useState(false);

  useEffect(() => {
    // Check online/offline status
    const handleOnline = () => {
      setIsOffline(false);
      setShowBanner(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOffline(!navigator.onLine);

    // Check backend availability
    const checkBackend = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          // Try a simple GET request to check if server is responding
          // Any response (even 400/404) means server is available
          // Only network errors/timeouts mean server is unavailable
          const response = await fetch(`${apiUrl}/`, {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
            headers: {
              'Accept': 'text/html,application/json',
            },
          });
          clearTimeout(timeoutId);
          
          // Any HTTP response (even error codes) means server is available
          // 400/401/403/404 = server responding, just not accepting that request
          // 500+ = server error, but still responding
          // Only network errors = truly unavailable
          setBackendUnavailable(false);
          setShowBanner(false);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            // Timeout - server not responding
            setBackendUnavailable(true);
            setShowBanner(true);
          } else if (fetchError.message?.includes('fetch') || fetchError.message?.includes('Failed to fetch')) {
            // Network error - server truly unavailable
            setBackendUnavailable(true);
            setShowBanner(true);
          } else {
            // Other errors - assume server is available (might be CORS or other client-side issues)
            setBackendUnavailable(false);
            setShowBanner(false);
          }
        }
      } catch (error) {
        // Network error - backend unavailable
        setBackendUnavailable(true);
        setShowBanner(true);
      }
    };

    // Check backend every 30 seconds
    const interval = setInterval(checkBackend, 30000);
    
    // Initial check after 2 seconds (give backend time to start)
    setTimeout(checkBackend, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white shadow-lg"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isOffline ? (
              <WifiOff className="h-5 w-5" />
            ) : backendUnavailable ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Wifi className="h-5 w-5" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {isOffline
                  ? 'You are currently offline'
                  : backendUnavailable
                  ? 'Backend server is unavailable'
                  : 'Connection issue detected'}
              </p>
              <p className="text-xs opacity-90">
                {isOffline
                  ? 'Please check your internet connection.'
                  : backendUnavailable
                  ? `Cannot connect to ${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'}. Make sure the backend is running.`
                  : 'Some features may not work properly.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="p-1 hover:bg-yellow-600 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

