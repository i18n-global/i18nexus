/**
 * Server-side utilities for Next.js App Router
 * Use these functions in Server Components to read language from cookies
 */

import * as fs from "fs";
import * as path from "path";
import { loadConfigSilently } from "../scripts/config-loader";

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
  },
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
  cookieHeader: string | null,
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
  translations: Record<string, Record<string, string>>,
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
  translations: Record<string, Record<string, string>>,
): Record<string, string> {
  return translations[language] || translations["en"] || {};
}

/**
 * Load translations from a directory (for use with auto-generated index.ts)
 * This function attempts to dynamically import translations from the specified directory
 *
 * @example
 * ```tsx
 * import { loadTranslations } from 'i18nexus/server';
 *
 * // In your setup file or at the top level
 * const translations = await loadTranslations('./locales');
 * ```
 */
export async function loadTranslations(
  localesDir: string,
): Promise<Record<string, Record<string, string>>> {
  try {
    // Try to import the index file
    const indexPath = path.resolve(process.cwd(), localesDir, "index");
    const module = await import(indexPath);
    return module.translations || {};
  } catch (error) {
    console.warn(
      `Failed to load translations from ${localesDir}/index:`,
      error,
    );
    return {};
  }
}

/**
 * Create a server-side translation context with auto-loaded translations
 * Automatically loads config from i18nexus.config.json and detects headers in Next.js
 *
 * @example Simple usage (no parameters needed in Next.js!)
 * ```tsx
 * import { createServerI18n } from 'i18nexus/server';
 *
 * export default async function ServerPage() {
 *   const { t, language } = await createServerI18n();
 *
 *   return <h1>{t("Welcome")}</h1>;
 * }
 * ```
 *
 * @example With custom options (overrides config)
 * ```tsx
 * const { t, language } = await createServerI18n({
 *   localesDir: './custom/locales'
 * });
 * ```
 */
export async function createServerI18n(options?: {
  localesDir?: string;
  cookieName?: string;
  defaultLanguage?: string;
  translations?: Record<string, Record<string, string>>;
}) {
  // Load config from i18nexus.config.json (silently if not found)
  let config;
  try {
    config = loadConfigSilently();
  } catch (error) {
    // Config not found, use defaults
    config = null;
  }

  // Merge config with options (options take precedence)
  const localesDir = options?.localesDir || config?.localesDir || "./locales";
  const defaultLanguage =
    options?.defaultLanguage || config?.defaultLanguage || "en";
  const cookieName = options?.cookieName || "i18n-language";

  // Auto-detect headers in Next.js environment
  let headersInstance: Headers;
  try {
    // Dynamically import Next.js headers
    const { headers } = await import("next/headers");
    headersInstance = await headers();
  } catch (error) {
    // Not in Next.js environment or headers not available
    // Create empty Headers object as fallback
    headersInstance = new Headers();
  }

  const language = getServerLanguage(headersInstance, {
    cookieName,
    defaultLanguage,
  });

  // Use provided translations or load from directory
  const translations =
    options?.translations || (await loadTranslations(localesDir));

  const t = createServerTranslation(language, translations);
  const dict = getServerTranslations(language, translations);

  return {
    t,
    language,
    translations,
    dict,
  };
}

/**
 * Create a simple server-side i18n context with pre-loaded translations
 * This is useful when you want to pass translations explicitly
 *
 * @example
 * ```tsx
 * import { createServerI18nWithTranslations } from 'i18nexus/server';
 * import { headers } from 'next/headers';
 * import { translations } from '@/lib/i18n';
 *
 * export default async function ServerPage() {
 *   const headersList = await headers();
 *   const { t, language } = createServerI18nWithTranslations(headersList, translations);
 *
 *   return <h1>{t("Welcome")}</h1>;
 * }
 * ```
 */
export function createServerI18nWithTranslations(
  headers: Headers,
  translations: Record<string, Record<string, string>>,
  options?: {
    cookieName?: string;
    defaultLanguage?: string;
  },
) {
  const language = getServerLanguage(headers, options);
  const t = createServerTranslation(language, translations);
  const dict = getServerTranslations(language, translations);

  return {
    t,
    language,
    translations,
    dict,
  };
}
