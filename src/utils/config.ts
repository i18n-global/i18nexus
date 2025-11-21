/**
 * i18nexus configuration schema and utilities
 * Central configuration for all i18n settings
 */

import type { LanguageConfig } from "./languageManager";
import type { NamespaceFallbackConfig } from "./namespaceFallback";
import type { DynamicTranslationOptions } from "./dynamicTranslationWrapper";

/**
 * Complete i18nexus configuration schema
 * All settings for i18nexus.config.json
 */
export interface I18nexusConfig {
  /**
   * Default language code
   * @default "en"
   */
  defaultLanguage?: string;

  /**
   * List of supported languages
   */
  languages: LanguageConfig[];

  /**
   * Directory containing translation files
   * @default "./locales"
   */
  localesDir?: string;

  /**
   * Cookie name for storing language preference
   * @default "i18n-language"
   */
  cookieName?: string;

  /**
   * Cookie options
   */
  cookieOptions?: {
    maxAge?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
  };

  /**
   * Namespace configuration
   */
  namespaces?: {
    /**
     * Whether to use nested namespaces
     * @default false
     */
    enabled?: boolean;

    /**
     * Default namespace for keys without explicit namespace
     * @example "common"
     */
    defaultNamespace?: string;

    /**
     * Namespace fallback chain
     * @example { "pages": ["common"], "errors": ["common"] }
     */
    fallbackChain?: Record<string, string[]>;
  };

  /**
   * Language fallback configuration
   */
  fallback?: {
    /**
     * Language fallback chain
     * @example { "ko": ["en"], "ja": ["en"] }
     */
    languages?: Record<string, string[]>;

    /**
     * Whether to show warnings for missing translations
     * @default true in development, false in production
     */
    showWarnings?: boolean;
  };

  /**
   * Dynamic translation default options
   */
  dynamic?: {
    /**
     * Default prefix for dynamic translations
     */
    prefix?: string;

    /**
     * Default suffix for dynamic translations
     */
    suffix?: string;

    /**
     * Default fallback text
     */
    fallback?: string;

    /**
     * Show warnings for missing keys
     * @default true
     */
    showWarnings?: boolean;
  };

  /**
   * Validation options
   */
  validation?: {
    /**
     * Whether to validate translation completeness
     * @default true in development
     */
    enabled?: boolean;

    /**
     * Minimum translation coverage percentage
     * @default 100
     */
    minCoverage?: number;

    /**
     * Strict mode: fail on missing translations
     * @default false
     */
    strict?: boolean;
  };

  /**
   * Server-side specific options
   */
  server?: {
    /**
     * Whether to use Accept-Language header detection
     * @default true
     */
    detectBrowserLanguage?: boolean;

    /**
     * Preload translations on server
     * @default true
     */
    preloadTranslations?: boolean;
  };

  /**
   * Client-side specific options
   */
  client?: {
    /**
     * Whether to cache translations in localStorage
     * @default false
     */
    cacheTranslations?: boolean;

    /**
     * Cache expiration time in milliseconds
     * @default 86400000 (24 hours)
     */
    cacheExpiration?: number;
  };

  /**
   * Development tools
   */
  devtools?: {
    /**
     * Enable devtools
     * @default true in development
     */
    enabled?: boolean;

    /**
     * Devtools position
     * @default "bottom-right"
     */
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  };

  /**
   * Custom metadata (user-defined)
   */
  metadata?: Record<string, any>;
}

/**
 * Load and validate i18nexus configuration
 */
export function validateConfig(config: Partial<I18nexusConfig>): I18nexusConfig {
  // Set defaults
  const validated: I18nexusConfig = {
    defaultLanguage: config.defaultLanguage || "en",
    languages: config.languages || [],
    localesDir: config.localesDir || "./locales",
    cookieName: config.cookieName || "i18n-language",
    cookieOptions: config.cookieOptions || {},
    namespaces: {
      enabled: config.namespaces?.enabled ?? false,
      defaultNamespace: config.namespaces?.defaultNamespace,
      fallbackChain: config.namespaces?.fallbackChain || {},
    },
    fallback: {
      languages: config.fallback?.languages || {},
      showWarnings: config.fallback?.showWarnings ?? (process.env.NODE_ENV === "development"),
    },
    dynamic: {
      prefix: config.dynamic?.prefix,
      suffix: config.dynamic?.suffix,
      fallback: config.dynamic?.fallback,
      showWarnings: config.dynamic?.showWarnings ?? true,
    },
    validation: {
      enabled: config.validation?.enabled ?? (process.env.NODE_ENV === "development"),
      minCoverage: config.validation?.minCoverage ?? 100,
      strict: config.validation?.strict ?? false,
    },
    server: {
      detectBrowserLanguage: config.server?.detectBrowserLanguage ?? true,
      preloadTranslations: config.server?.preloadTranslations ?? true,
    },
    client: {
      cacheTranslations: config.client?.cacheTranslations ?? false,
      cacheExpiration: config.client?.cacheExpiration ?? 86400000,
    },
    devtools: {
      enabled: config.devtools?.enabled ?? (process.env.NODE_ENV === "development"),
      position: config.devtools?.position || "bottom-right",
    },
    metadata: config.metadata || {},
  };

  // Validate required fields
  if (!validated.languages || validated.languages.length === 0) {
    throw new Error("i18nexus config must specify at least one language");
  }

  // Validate language codes
  const languageCodes = validated.languages.map((lang) => lang.code);
  if (validated.defaultLanguage && !languageCodes.includes(validated.defaultLanguage)) {
    throw new Error(
      `Default language "${validated.defaultLanguage}" not found in languages list`,
    );
  }

  // Validate fallback chains
  if (validated.fallback?.languages) {
    for (const [lang, fallbacks] of Object.entries(validated.fallback.languages)) {
      for (const fallbackLang of fallbacks) {
        if (!languageCodes.includes(fallbackLang)) {
          throw new Error(
            `Fallback language "${fallbackLang}" for "${lang}" not found in languages list`,
          );
        }
      }
    }
  }

  return validated;
}

/**
 * Convert config to NamespaceFallbackConfig
 */
export function toNamespaceFallbackConfig(
  config: I18nexusConfig,
): NamespaceFallbackConfig {
  return {
    defaultNamespace: config.namespaces?.defaultNamespace,
    fallbackChain: config.namespaces?.fallbackChain || {},
    languageFallback: config.fallback?.languages || {},
    showWarnings: config.fallback?.showWarnings ?? true,
  };
}

/**
 * Convert config to DynamicTranslationOptions
 */
export function toDynamicTranslationOptions(
  config: I18nexusConfig,
): DynamicTranslationOptions {
  return {
    prefix: config.dynamic?.prefix,
    suffix: config.dynamic?.suffix,
    fallback: config.dynamic?.fallback,
    showWarnings: config.dynamic?.showWarnings ?? true,
  };
}

/**
 * Check if config is valid
 */
export function isValidConfig(config: any): config is I18nexusConfig {
  try {
    validateConfig(config);
    return true;
  } catch {
    return false;
  }
}

/**
 * Default configuration
 */
export const defaultConfig: I18nexusConfig = {
  defaultLanguage: "en",
  languages: [{ code: "en", name: "English" }],
  localesDir: "./locales",
  cookieName: "i18n-language",
  cookieOptions: {},
  namespaces: {
    enabled: false,
    fallbackChain: {},
  },
  fallback: {
    languages: {},
    showWarnings: true,
  },
  dynamic: {
    showWarnings: true,
  },
  validation: {
    enabled: true,
    minCoverage: 100,
    strict: false,
  },
  server: {
    detectBrowserLanguage: true,
    preloadTranslations: true,
  },
  client: {
    cacheTranslations: false,
    cacheExpiration: 86400000,
  },
  devtools: {
    enabled: true,
    position: "bottom-right",
  },
  metadata: {},
};
