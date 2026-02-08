import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

// Import all message files statically so Next.js can bundle them
import enMessages from '../../messages/en.json';
import frMessages from '../../messages/fr.json';
import arMessages from '../../messages/ar.json';

const messagesMap = {
  en: enMessages,
  fr: frMessages,
  ar: arMessages,
};

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  // Get messages from the static map
  // This ensures messages are always available and bundled at build time
  const messages = messagesMap[locale] || messagesMap[routing.defaultLocale] || {};

  return {
    locale,
    messages,
  };
});
