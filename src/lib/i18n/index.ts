import { DEFAULT_LOCALE, type Locale } from "./locales";
import { en, type MessageTree } from "./messages/en";
import { hi } from "./messages/hi";

const catalogs: Record<Locale, MessageTree> = { en, hi };

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${"" extends P ? "" : "."}${P}`
    : never
  : never;

type Leaves<T> = T extends object
  ? {
      [K in keyof T]-?: Join<K & string, Leaves<T[K]>>;
    }[keyof T]
  : "";

export type MessageKey = Leaves<MessageTree>;

function readPath(tree: MessageTree, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = tree;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function translate(locale: Locale, key: MessageKey | string, vars?: Record<string, string | number>) {
  const fromLocale = readPath(catalogs[locale] ?? catalogs[DEFAULT_LOCALE], key);
  const text = fromLocale ?? readPath(catalogs.en, key) ?? key;
  if (!vars) return text;
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    text
  );
}

export * from "./locales";
export type { MessageTree };
