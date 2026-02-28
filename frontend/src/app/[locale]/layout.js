import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/contexts/ToastContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { LocaleProvider } from '@/contexts/LocaleContext';
import CookieConsent from '@/components/layout/CookieConsent';
import { routing } from '@/i18n/routing';
import { localeDirection } from '@/i18n/config';
import enMessages from '../../../messages/en.json';
import frMessages from '../../../messages/fr.json';
import arMessages from '../../../messages/ar.json';

const messagesMap = {
  en: enMessages,
  fr: frMessages,
  ar: arMessages,
};

export const dynamic = 'force-dynamic';

export default async function LocaleLayout({ children, params }) {
  try {
    // Safely await params - handle both Promise and direct object
    let locale;
    try {
      const paramsObj = await params;
      locale = paramsObj?.locale;
    } catch (error) {
      console.error('Error accessing params:', error);
      locale = routing.defaultLocale;
    }

    // Validate locale - fallback to default if invalid
    if (!locale || !routing.locales.includes(locale)) {
      locale = routing.defaultLocale;
    }

    // Enable static rendering
    try {
      setRequestLocale(locale);
    } catch (error) {
      console.error('Error setting request locale:', error);
      // Continue with default locale
    }

    // Fetch messages for the locale with error handling
    let messages = {};
    try {
      messages = await getMessages();
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Fallback to default locale messages
      try {
        const defaultMessages = messagesMap[routing.defaultLocale] || {};
        messages = defaultMessages;
      } catch (fallbackError) {
        console.error('Failed to load fallback messages:', fallbackError);
        // Continue with empty messages to prevent crash
      }
    }

    const dir = localeDirection[locale] || 'ltr';

    return (
      <div lang={locale} dir={dir}>
        <NextIntlClientProvider messages={messages}>
          <LocaleProvider locale={locale}>
            <AuthProvider>
              <QueryProvider>
                <FavoritesProvider>
                  <CurrencyProvider>
                  <ToastProvider>
                    <NotificationProvider>
                      {children}
                    </NotificationProvider>
                  </ToastProvider>
                  </CurrencyProvider>
                </FavoritesProvider>
              </QueryProvider>
            </AuthProvider>
          </LocaleProvider>
        </NextIntlClientProvider>
        <CookieConsent />
      </div>
    );
  } catch (error) {
    console.error('Error in LocaleLayout:', error);
    // Return a minimal layout to prevent complete failure
    // Try to at least render children with basic structure
    return (
      <div lang={routing.defaultLocale || 'en'}>
        <NextIntlClientProvider messages={{}}>
          {children}
        </NextIntlClientProvider>
      </div>
    );
  }
}
