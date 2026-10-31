import { enLocale } from './locales/en';
import { idLocale } from './locales/id';
import { LocaleCode, LocaleMetadata, TranslationDictionary } from './types';

export type { LocaleCode, LocaleMetadata, TranslationDictionary };

/**
 * Registry of supported locales.
 * To contribute a new language on GitHub (http://github.com/mrbvrz/squelch):
 * 1. Create `src/ui/i18n/locales/<code>.ts` implementing `TranslationDictionary`.
 * 2. Add the locale metadata (with flag emoji) to `SUPPORTED_LOCALES` and register it in `TRANSLATIONS` below.
 */
export const SUPPORTED_LOCALES: LocaleMetadata[] = [
  {
    code: 'id',
    flag: '🇮🇩',
    nativeName: 'Bahasa Indonesia',
    englishName: 'Indonesian'
  },
  {
    code: 'en',
    flag: '🇺🇸',
    nativeName: 'English',
    englishName: 'English'
  }
];

export const TRANSLATIONS: Record<LocaleCode, TranslationDictionary> = {
  id: idLocale,
  en: enLocale
};

export function getTranslations(code?: string): TranslationDictionary {
  if (code && code in TRANSLATIONS) {
    return TRANSLATIONS[code as LocaleCode];
  }
  return TRANSLATIONS.id;
}
