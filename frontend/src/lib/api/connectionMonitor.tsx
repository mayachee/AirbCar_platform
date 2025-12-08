'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';
import { enhancedApiClient } from './enhancedClient';

/**
 * API Connection Monitor Component
 * Displays real-time connection status and health
 */
export default function ConnectionMonitor() {
  const [status, setStatus] = useState<'online' | 'offline' | 'degraded'>('online');
  const [queueLength, setQueueLength] = useState(0);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(enhancedApiClient.getConnectionStatus());
      setQueueLength(enhancedApiClient.getQueueLength());
      setLastCheck(new Date());
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  if (status === 'online' && queueLength === 0 && !showDetails) {
    return null; // Don't show when everything is fine
  }

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800 border-green-300';
      case 'degraded': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'offline': return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'online': return CheckCircle;
      case 'degraded': return AlertCircle;
      case 'offline': return WifiOff;
    }
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`rounded-lg border-2 shadow-lg p-3 ${getStatusColor()}`}>
        <div className="flex items-center space-x-2">
          <StatusIcon className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold capitalize">{status}</p>
            {queueLength > 0 && (
              <p className="text-xs">{queueLength} request{queueLength !== 1 ? 's' : ''} queued</p>
            )}
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="ml-2 text-xs underline"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>
        
        {showDetails && (
          <div className="mt-2 pt-2 border-t border-current/20 text-xs space-y-1">
            <p>Last check: {lastCheck?.toLocaleTimeString() || 'Never'}</p>
            <p>Queue: {queueLength} requests</p>
            <p>Status: {status}</p>
          </div>
        )}
      </div>
    </div>
  );
}

