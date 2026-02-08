import { redirect } from 'next/navigation';

// Fallback root page - redirects to the default locale
// This should normally be handled by the proxy (middleware),
// but serves as a safety net in case the proxy doesn't run.
export default function RootPage() {
  redirect('/en');
}
