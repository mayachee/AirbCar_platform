'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { locales, localeNames } from '@/i18n/config';
import { SelectField } from '@/components/ui/select-field';

const localeFlags = {
  en: '🇬🇧',
  fr: '🇫🇷',
  ar: '🇲🇦',
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (event) => {
    const newLocale = event.target.value;
    if (newLocale && newLocale !== locale) {
      router.replace(pathname, { locale: newLocale });
    }
  };

  // Format options with flags and names
  const languageOptions = locales.map((loc) => ({
    value: loc,
    label: `${localeFlags[loc]} ${localeNames[loc]}`,
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
