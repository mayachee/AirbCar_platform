'use client';

import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { locales, localeNames } from '@/i18n/config';
import { SelectField } from '@/components/ui/select-field';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const searchParams = useSearchParams();

  const handleLanguageChange = (event) => {
    const newLocale = event.target.value;
    if (newLocale && newLocale !== locale) {
      // Get current path and extract the path without locale
      const currentPath = window.location.pathname;
      const pathWithoutLocale = currentPath.replace(/^\/(en|fr|ar)/, '') || '/';
      
      // Preserve all search parameters (filters, dates, location, etc)
      const currentSearchParams = new URLSearchParams(searchParams);
      const searchString = currentSearchParams.toString();
      
      // Save current filters to sessionStorage for recovery after page reload
      // This helps preserve advanced filters (transmission, fuelType, etc)
      try {
        const storedFilters = sessionStorage.getItem('searchFilters');
        if (storedFilters) {
          // Preserve existing filters during language change
          sessionStorage.setItem('searchFilters', storedFilters);
        }
      } catch (err) {
        console.warn('Failed to preserve filters:', err);
      }
      
      const hash = window.location.hash;
      
      // Construct the new URL with the new locale and preserved search params
      const newUrl = `/${newLocale}${pathWithoutLocale}${searchString ? `?${searchString}` : ''}${hash}`;
      
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
