/**
 * Server-side utilities for Next.js App Router
 * Use these functions in Server Components to read language from cookies
 */

/**
 * Get language from cookies in Next.js App Router Server Components
 *
 * @example
 * ```tsx
 * import { headers } from 'next/headers';
 * import { getServerLanguage } from 'i18nexus/server';
 *
 * export default async function RootLayout({ children }) {
 *   const headersList = await headers();
 *   const language = getServerLanguage(headersList);
 *
 *   return (
 *     <I18nProvider initialLanguage={language}>
 *       {children}
 *     </I18nProvider>
 *   );
 * }
 * ```
 */
export function getServerLanguage(
  headers: Headers,
  options?: {
    cookieName?: string;
    defaultLanguage?: string;
  }
): string {
  const cookieName = options?.cookieName || "i18n-language";
  const defaultLanguage = options?.defaultLanguage || "en";

  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) {
    return defaultLanguage;
  }

  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (decodeURIComponent(name) === cookieName) {
      return decodeURIComponent(value);
    }
  }

  return defaultLanguage;
}

/**
 * Parse cookies from cookie header string
 */
export function parseCookies(
  cookieHeader: string | null
): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  const cookies: Record<string, string> = {};
  const cookieArray = cookieHeader.split(";");

  for (const cookie of cookieArray) {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value);
    }
  }

  return cookies;
}

/**
 * Create server-side translation function for use in Server Components
 *
 * @example
 * ```tsx
 * import { createServerTranslation } from 'i18nexus/server';
 * import { translations } from '@/lib/i18n';
 *
 * export default async function ServerPage() {
 *   const headersList = await headers();
 *   const language = getServerLanguage(headersList);
 *   const t = createServerTranslation(language, translations);
 *
 *   return <h1>{t("Welcome")}</h1>;
 * }
 * ```
 */
export function createServerTranslation(
  language: string,
  translations: Record<string, Record<string, string>>
) {
  const currentTranslations =
    translations[language] || translations["en"] || {};

  return function translate(key: string, fallback?: string): string {
    return currentTranslations[key] || fallback || key;
  };
}

/**
 * Get server-side translations object
 *
 * @example
 * ```tsx
 * import { getServerTranslations } from 'i18nexus/server';
 * import { translations } from '@/lib/i18n';
 *
 * export default async function ServerPage() {
 *   const headersList = await headers();
 *   const language = getServerLanguage(headersList);
 *   const dict = getServerTranslations(language, translations);
 *
 *   return <h1>{dict["Welcome"]}</h1>;
 * }
 * ```
 */
export function getServerTranslations(
  language: string,
  translations: Record<string, Record<string, string>>
): Record<string, string> {
  return translations[language] || translations["en"] || {};
}
