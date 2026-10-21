import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type Locale,
  type MessageKey,
  parseLocale,
  translate,
} from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey | string, vars?: Record<string, string | number>) => string;
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function deviceLocale(): Locale {
  try {
    const settings =
      Platform.OS === "ios"
        ? NativeModules.SettingsManager?.settings
        : NativeModules.I18nManager;
    const raw =
      Platform.OS === "ios"
        ? settings?.AppleLocale ?? settings?.AppleLanguages?.[0]
        : settings?.localeIdentifier;
    const nav = String(raw ?? "").toLowerCase();
    if (nav.startsWith("hi")) return "hi";
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
        setLocaleState(stored ? parseLocale(stored) : deviceLocale());
      } catch {
        setLocaleState(deviceLocale());
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    void AsyncStorage.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: MessageKey | string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, ready }),
    [locale, setLocale, t, ready]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE as Locale,
      setLocale: () => undefined,
      t: (key: MessageKey | string, vars?: Record<string, string | number>) =>
        translate(DEFAULT_LOCALE, key, vars),
      ready: true,
    };
  }
  return ctx;
}
