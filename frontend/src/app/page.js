import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

// Fallback root page - redirects to the default locale
// This should normally be handled by the middleware,
// but serves as a safety net in case the middleware doesn't run.
export default function RootPage() {
  try {
    // Use the default locale from routing config
    const defaultLocale = routing?.defaultLocale || 'en';
    redirect(`/${defaultLocale}`);
  } catch (error) {
    // If routing config fails, fallback to hardcoded redirect
    console.error('Error in RootPage redirect:', error);
    redirect('/en');
  }
}
