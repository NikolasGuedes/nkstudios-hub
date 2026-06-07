import { useSyncExternalStore } from 'react';
import esTranslations from '../locales/es.json';
import ptTranslations from '../locales/pt.json';

export type Locale = 'pt' | 'es' | 'en';

type TranslationDictionary = Record<string, string>;
type LocaleChangeListener = (locale: Locale) => void;

type LocaleOption = {
  code: Locale;
  country: 'br' | 'us' | 'es';
  labelKey: 'Portuguese' | 'English' | 'Spanish';
  shortLabel: 'PT' | 'EN' | 'ES';
  lang: 'pt-BR' | 'en-US' | 'es-ES';
};

export const DEFAULT_LOCALE: Locale = 'pt';
export const LOCALE_STORAGE_KEY = 'nkstudios-locale';
export const LOCALE_CHANGE_EVENT = 'nkstudios:localechange';

export const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { code: 'pt', country: 'br', labelKey: 'Portuguese', shortLabel: 'PT', lang: 'pt-BR' },
  { code: 'en', country: 'us', labelKey: 'English', shortLabel: 'EN', lang: 'en-US' },
  { code: 'es', country: 'es', labelKey: 'Spanish', shortLabel: 'ES', lang: 'es-ES' },
] as const;

const dictionaries: Record<Exclude<Locale, 'en'>, TranslationDictionary> = {
  pt: ptTranslations,
  es: esTranslations,
};

let currentLocale: Locale = DEFAULT_LOCALE;

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;

  const normalized = value.trim().toLowerCase();

  if (normalized === 'pr' || normalized.startsWith('pt')) return 'pt';
  if (normalized.startsWith('es')) return 'es';
  if (normalized.startsWith('en')) return 'en';

  return DEFAULT_LOCALE;
}

export function getLocaleOption(locale: Locale): LocaleOption {
  return LOCALE_OPTIONS.find((option) => option.code === locale) ?? LOCALE_OPTIONS[0];
}

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  try {
    return normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function getLocale(): Locale {
  if (typeof document !== 'undefined') {
    const documentLocale = document.documentElement.dataset.locale;

    if (documentLocale) {
      currentLocale = normalizeLocale(documentLocale);
      return currentLocale;
    }
  }

  if (typeof window !== 'undefined') {
    currentLocale = getStoredLocale();
    return currentLocale;
  }

  return currentLocale;
}

function persistLocale(locale: Locale) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore storage errors and keep the in-memory locale active.
  }
}

function applyLocaleToDocument(locale: Locale, ready = false) {
  if (typeof document === 'undefined') return;

  const option = getLocaleOption(locale);

  document.documentElement.dataset.locale = locale;
  document.documentElement.dataset.i18nReady = ready ? 'true' : 'false';
  document.documentElement.lang = option.lang;
}

export function ensureLocale(): Locale {
  const locale = getStoredLocale();

  currentLocale = locale;
  persistLocale(locale);
  applyLocaleToDocument(locale, locale === DEFAULT_LOCALE);

  return locale;
}

export function setLocale(nextLocale: string): Locale {
  const locale = normalizeLocale(nextLocale);

  currentLocale = locale;
  persistLocale(locale);
  applyLocaleToDocument(locale);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: { locale } }));
  }

  return locale;
}

export function translate(key: string, locale = getLocale()): string {
  if (locale === 'en') return key;

  return dictionaries[locale][key] ?? key;
}

export function __(key: string): string {
  return translate(key, getLocale());
}

export function syncLocaleControls(locale = getLocale()) {
  if (typeof document === 'undefined') return;

  const option = getLocaleOption(locale);
  const languageSummary = document.querySelector<HTMLElement>('[data-language-summary]');
  const languageFlag = document.querySelector<HTMLElement>('[data-language-flag]');
  const languageCode = document.querySelector<HTMLElement>('[data-language-code]');
  const languageOptions = document.querySelectorAll<HTMLButtonElement>('[data-locale-option]');

  if (languageFlag) {
    languageFlag.className = `fi fi-${option.country} rounded-[0.15rem] text-base leading-none`;
  }

  if (languageCode) {
    languageCode.textContent = option.shortLabel;
  }

  if (languageSummary) {
    languageSummary.dataset.locale = option.code;
  }

  for (const element of languageOptions) {
    element.dataset.active = element.dataset.localeOption === option.code ? 'true' : 'false';
    element.setAttribute(
      'aria-pressed',
      element.dataset.localeOption === option.code ? 'true' : 'false',
    );
  }
}

export function translateDocument(locale = getLocale()) {
  if (typeof document === 'undefined') return;

  const textNodes = document.querySelectorAll<HTMLElement>('[data-i18n-key]');

  for (const element of textNodes) {
    const key = element.dataset.i18nKey;

    if (!key) continue;

    element.textContent = translate(key, locale);
  }

  const attributeNodes = document.querySelectorAll<HTMLElement>(
    '[data-i18n-attr-aria-label], [data-i18n-attr-content]',
  );

  for (const element of attributeNodes) {
    const ariaLabelKey = element.dataset.i18nAttrAriaLabel;
    const contentKey = element.dataset.i18nAttrContent;

    if (ariaLabelKey) {
      element.setAttribute('aria-label', translate(ariaLabelKey, locale));
    }

    if (contentKey) {
      element.setAttribute('content', translate(contentKey, locale));
    }
  }

  syncLocaleControls(locale);
  applyLocaleToDocument(locale, true);
}

export function subscribeLocaleChange(listener: LocaleChangeListener) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleLocaleChange = (event: Event) => {
    const detail = (event as CustomEvent<{ locale?: string }>).detail;
    listener(normalizeLocale(detail?.locale));
  };

  window.addEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange);

  return () => {
    window.removeEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange);
  };
}

function subscribeLocaleStore(onStoreChange: () => void) {
  return subscribeLocaleChange(() => {
    onStoreChange();
  });
}

export function useLocale() {
  return useSyncExternalStore(subscribeLocaleStore, getLocale, () => DEFAULT_LOCALE);
}
