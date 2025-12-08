/**
 * Hook for monitoring API health and connection status
 */
import { useState, useEffect, useCallback } from 'react';
import { enhancedApiClient } from '@/lib/api/enhancedClient';

interface ApiHealth {
  status: 'online' | 'offline' | 'degraded';
  queueLength: number;
  lastCheck: Date | null;
  latency: number | null;
}

export function useApiHealth(interval: number = 5000) {
  const [health, setHealth] = useState<ApiHealth>({
    status: 'online',
    queueLength: 0,
    lastCheck: null,
    latency: null
  });

  const checkHealth = useCallback(async () => {
    const startTime = Date.now();
    const status = enhancedApiClient.getConnectionStatus();
    const queueLength = enhancedApiClient.getQueueLength();
    
    // Measure latency
    try {
      const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(`${apiUrl}/api/health/`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      
      setHealth({
        status: 'online',
        queueLength,
        lastCheck: new Date(),
        latency
      });
    } catch (error) {
      const latency = Date.now() - startTime;
      setHealth({
        status: 'offline',
        queueLength,
        lastCheck: new Date(),
        latency
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const intervalId = setInterval(checkHealth, interval);
    return () => clearInterval(intervalId);
  }, [checkHealth, interval]);

  return {
    ...health,
    checkHealth,
    isOnline: health.status === 'online',
    isOffline: health.status === 'offline',
    hasQueuedRequests: health.queueLength > 0
  };
}

