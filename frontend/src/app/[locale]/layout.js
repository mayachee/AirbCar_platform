import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { LocaleProvider } from '@/contexts/LocaleContext';
import CookieConsent from '@/components/layout/CookieConsent';
import { routing } from '@/i18n/routing';
import { localeDirection } from '@/i18n/config';

export const dynamic = 'force-dynamic';

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Fetch messages for the locale
  const messages = await getMessages();

  const dir = localeDirection[locale] || 'ltr';

  return (
    <div lang={locale} dir={dir}>
      <NextIntlClientProvider messages={messages}>
        <LocaleProvider locale={locale}>
          <AuthProvider>
            <CurrencyProvider>
              <ToastProvider>
                <NotificationProvider>
                  {children}
                </NotificationProvider>
              </ToastProvider>
            </CurrencyProvider>
          </AuthProvider>
        </LocaleProvider>
      </NextIntlClientProvider>
      <CookieConsent />
    </div>
  );
}
