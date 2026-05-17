import { defineRouting } from "next-intl/routing";

export const locales = ["ko", "ja"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "ko";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always"
});

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function getLocaleFromPathname(pathname: string): AppLocale | null {
  const segment = pathname.split("/")[1];
  return isAppLocale(segment) ? segment : null;
}

export function stripLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return pathname || "/";

  const stripped = pathname.slice(locale.length + 1);
  return stripped.startsWith("/") ? stripped || "/" : `/${stripped}`;
}

export function localizePathname(pathname: string, locale: AppLocale = defaultLocale): string {
  const normalized = stripLocaleFromPathname(pathname);
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}
