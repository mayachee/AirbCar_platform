import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

// Fallback root page - redirects to the default locale
// The proxy middleware should handle this, but this serves as a safety net
export default function RootPage() {
  try {
    // Get default locale with fallback
    const defaultLocale = routing?.defaultLocale || 'en';
    
    // Silently redirect to default locale
    // Next.js redirect() uses a special error mechanism internally - this is expected
    redirect(`/${defaultLocale}`);
  } catch (error) {
    // If redirect fails for any reason, return a simple redirect response
    // This should rarely happen, but provides a fallback
    return (
      <html>
        <head>
          <meta httpEquiv="refresh" content={`0;url=/${routing?.defaultLocale || 'en'}`} />
        </head>
        <body>
          <p>Redirecting...</p>
        </body>
      </html>
    );
  }
}
