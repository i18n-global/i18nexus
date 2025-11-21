"use client";

import React from "react";
import type { I18nexusConfig } from "./config";
import { toNamespaceFallbackConfig } from "./config";
import { createI18n } from "./createI18n";
import { createI18nNamespace } from "./createI18nNamespace";
import { createI18nWithFallback } from "./namespaceFallback";
import { loadConfig } from "./configLoader";

/**
 * Create i18n instance from configuration
 *
 * Automatically chooses the right creator based on config:
 * - Namespace + Fallback: createI18nWithFallback
 * - Namespace only: createI18nNamespace
 * - Simple: createI18n
 *
 * @example
 * ```typescript
 * // With explicit config
 * const i18n = createI18nFromConfig(config, translations);
 *
 * // Load from file
 * const i18n = await createI18nFromConfigFile(translations);
 * ```
 */
export function createI18nFromConfig<
  TTranslations extends Record<string, Record<string, any>>,
>(config: I18nexusConfig, translations: TTranslations): any {
  const hasNamespaces = config.namespaces?.enabled;
  const hasFallback =
    (config.namespaces?.fallbackChain &&
      Object.keys(config.namespaces.fallbackChain).length > 0) ||
    (config.fallback?.languages &&
      Object.keys(config.fallback.languages).length > 0);

  // Choose the right creator
  if (hasNamespaces && hasFallback) {
    // Most flexible: namespace with fallback
    const fallbackConfig = toNamespaceFallbackConfig(config);
    return createI18nWithFallback(translations, fallbackConfig);
  } else if (hasNamespaces) {
    // Namespace only
    return createI18nNamespace(translations);
  } else {
    // Simple flat translations
    return createI18n(translations);
  }
}

/**
 * Load config from file and create i18n instance
 *
 * @example
 * ```typescript
 * const translations = {
 *   en: { greeting: "Hello" },
 *   ko: { greeting: "안녕하세요" }
 * };
 *
 * const i18n = await createI18nFromConfigFile(translations);
 *
 * // With custom config path
 * const i18n = await createI18nFromConfigFile(
 *   translations,
 *   { configPath: "./custom.config.json" }
 * );
 * ```
 */
export async function createI18nFromConfigFile<
  TTranslations extends Record<string, Record<string, any>>,
>(
  translations: TTranslations,
  options?: {
    configPath?: string;
    fallbackConfig?: Partial<I18nexusConfig>;
  },
): Promise<any> {
  const config = await loadConfig({
    configPath: options?.configPath,
    fallback: options?.fallbackConfig,
  });

  return createI18nFromConfig(config, translations);
}

/**
 * Hook to load config and create i18n instance
 * Useful for dynamic config loading in React
 *
 * @example
 * ```typescript
 * function App() {
 *   const { i18n, loading, error } = useI18nFromConfig(translations);
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <i18n.Provider>
 *       <YourApp />
 *     </i18n.Provider>
 *   );
 * }
 * ```
 */
export function useI18nFromConfig<
  TTranslations extends Record<string, Record<string, any>>,
>(
  translations: TTranslations,
  options?: {
    configPath?: string;
    fallbackConfig?: Partial<I18nexusConfig>;
  },
) {
  const [i18n, setI18n] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    createI18nFromConfigFile(translations, options)
      .then((instance) => {
        setI18n(instance);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { i18n, loading, error };
}

/**
 * Get language manager options from config
 */
export function getLanguageManagerOptions(config: I18nexusConfig) {
  return {
    languages: config.languages,
    defaultLanguage: config.defaultLanguage,
    cookieName: config.cookieName,
  };
}

/**
 * Wrapper component that loads config and provides i18n
 *
 * @example
 * ```typescript
 * function App() {
 *   return (
 *     <I18nConfigProvider translations={translations}>
 *       <YourApp />
 *     </I18nConfigProvider>
 *   );
 * }
 * ```
 */
export function I18nConfigProvider<
  TTranslations extends Record<string, Record<string, any>>,
>({
  translations,
  config: explicitConfig,
  configPath,
  fallbackConfig,
  children,
  loading: LoadingComponent,
  error: ErrorComponent,
}: {
  translations: TTranslations;
  config?: I18nexusConfig;
  configPath?: string;
  fallbackConfig?: Partial<I18nexusConfig>;
  children: React.ReactNode;
  loading?: React.ComponentType;
  error?: React.ComponentType<{ error: Error }>;
}) {
  // Use explicit config if provided
  const i18nFromExplicit = explicitConfig
    ? createI18nFromConfig(explicitConfig, translations)
    : null;

  // Load from file if no explicit config
  const {
    i18n: i18nFromFile,
    loading: loadingFromFile,
    error: errorFromFile,
  } = useI18nFromConfig(translations, {
    configPath,
    fallbackConfig,
  });

  const i18n = i18nFromExplicit || i18nFromFile;
  const loading = !i18nFromExplicit && loadingFromFile;
  const error = errorFromFile;

  if (loading) {
    return LoadingComponent ? <LoadingComponent /> : <div>Loading i18n...</div>;
  }

  if (error) {
    return ErrorComponent ? (
      <ErrorComponent error={error} />
    ) : (
      <div>Error loading i18n: {error.message}</div>
    );
  }

  if (!i18n) {
    return <div>Failed to initialize i18n</div>;
  }

  return (
    <i18n.Provider
      languageManagerOptions={
        explicitConfig ? getLanguageManagerOptions(explicitConfig) : undefined
      }
    >
      {children}
    </i18n.Provider>
  );
}
