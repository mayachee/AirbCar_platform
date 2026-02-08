import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

// Fallback root page - redirects to the default locale
// The proxy (middleware) should handle this, but this serves as a safety net
export default function RootPage() {
  // Silently redirect to default locale
  // Next.js redirect() uses a special error mechanism internally - this is expected
  redirect(`/${routing?.defaultLocale || 'en'}`);
}
