import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

// Root page - explicitly redirect to default locale
// This ensures the locale layout always has a valid locale parameter
export default function RootPage() {
  const defaultLocale = routing?.defaultLocale || 'en';
  // Always redirect to the locale-prefixed version to ensure proper routing
  redirect(`/${defaultLocale}`);
}
