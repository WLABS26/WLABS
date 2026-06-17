import "server-only";

import { type Locale } from "@/lib/i18n-config";

export type { Locale };
export { hasLocale, LOCALES, DEFAULT_LOCALE } from "@/lib/i18n-config";

const dictionaries = {
  en: () => import("../../messages/en.json").then((m) => m.default),
  de: () => import("../../messages/de.json").then((m) => m.default),
};

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}
