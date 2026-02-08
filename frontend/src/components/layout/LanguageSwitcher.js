'use client';

import { useLocale } from 'next-intl';
import { locales, localeNames } from '@/i18n/config';
import { SelectField } from '@/components/ui/select-field';

export default function LanguageSwitcher() {
  const locale = useLocale();

  const handleLanguageChange = (event) => {
    const newLocale = event.target.value;
    if (newLocale && newLocale !== locale) {
      // Get current path and extract the path without locale
      const currentPath = window.location.pathname;
      const pathWithoutLocale = currentPath.replace(/^\/(en|fr|ar)/, '') || '/';
      const searchParams = window.location.search;
      const hash = window.location.hash;
      
      // Construct the new URL with the new locale
      const newUrl = `/${newLocale}${pathWithoutLocale}${searchParams}${hash}`;
      
      // Use full page navigation for all routes to ensure complete refresh
      // This guarantees all components, contexts, and translations update properly
      window.location.href = newUrl;
    }
  };

  // Format options with names only
  const languageOptions = locales.map((loc) => ({
    value: loc,
    label: localeNames[loc],
  }));

  return (
    <SelectField
      value={locale}
      onChange={handleLanguageChange}
      contentProps={{ className: 'z-[100] ignore-outside-click', position: 'popper' }}
      options={languageOptions}
      className="w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
    />
  );
}
