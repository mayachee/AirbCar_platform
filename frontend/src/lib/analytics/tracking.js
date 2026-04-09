export const trackEvent = (eventName, payload = {}) => {
  if (typeof window === 'undefined' || !eventName) return;

  try {
    // Vercel Analytics custom event support (if loaded)
    if (typeof window.va === 'function') {
      window.va('event', {
        name: eventName,
        data: payload,
      });
    }

    // Google Analytics support (if configured)
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }

    // Generic dataLayer support
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...payload });
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('Tracking skipped:', eventName, error);
    }
  }
};
