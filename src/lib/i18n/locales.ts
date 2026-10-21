export const LOCALES = ["en", "hi"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "tfw_locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
};

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "hi";
}

export function parseLocale(value: string | null | undefined): Locale {
  if (isLocale(value)) return value;
  return DEFAULT_LOCALE;
}
