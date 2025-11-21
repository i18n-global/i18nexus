"use client";

import React from "react";
import {
  I18nProvider,
  I18nProviderProps,
} from "../components/I18nProvider";
import {
  useTranslation as useTranslationOriginal,
  TranslationStyles,
  TranslationVariables,
} from "../hooks/useTranslation";
import { NestedKeyOf } from "./advancedTypes";

/**
 * Namespace fallback configuration
 */
export interface NamespaceFallbackConfig {
  /**
   * Default namespace to use when key is not found
   * @example "common"
   */
  defaultNamespace?: string;

  /**
   * Fallback chain for namespaces
   * @example { "pages": ["common"], "errors": ["common", "messages"] }
   */
  fallbackChain?: Record<string, string[]>;

  /**
   * Language fallback chain
   * @example { "ko": ["en"], "ja": ["en"] }
   */
  languageFallback?: Record<string, string[]>;

  /**
   * Whether to show warnings for missing translations
   * @default true
   */
  showWarnings?: boolean;
}

/**
 * Flatten nested translations with namespace prefix
 */
function flattenWithNamespace(
  obj: Record<string, any>,
  prefix = "",
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      result[newKey] = value;
    } else if (typeof value === "object" && value !== null) {
      Object.assign(result, flattenWithNamespace(value, newKey));
    }
  }

  return result;
}

/**
 * Get namespace from key
 * @example getNamespace("common.greeting") => "common"
 */
function getNamespace(key: string): string | null {
  const parts = key.split(".");
  return parts.length > 1 ? parts[0] : null;
}

/**
 * Translation function with namespace fallback
 */
interface NamespaceFallbackTranslationFunction<
  Translations extends Record<string, any>,
> {
  // With styles - returns React element
  <K extends NestedKeyOf<Translations>>(
    key: K,
    variables: TranslationVariables,
    styles: TranslationStyles,
  ): React.ReactElement;

  // Without styles - returns string
  <K extends NestedKeyOf<Translations>>(
    key: K,
    variables?: TranslationVariables,
  ): string;

  // Dynamic key (type-unsafe for runtime keys)
  (key: string, variables?: TranslationVariables): string;
}

/**
 * Return type for namespace fallback useTranslation
 */
interface NamespaceFallbackUseTranslationReturn<
  Translations extends Record<string, any>,
> {
  t: NamespaceFallbackTranslationFunction<Translations>;
  currentLanguage: string;
  isReady: boolean;
  /**
   * Check if a key exists in current language
   */
  hasKey: (key: string) => boolean;
  /**
   * Get all available keys
   */
  getKeys: () => string[];
}

/**
 * Create i18n with namespace fallback support
 *
 * Features:
 * - Default namespace fallback
 * - Custom namespace fallback chains
 * - Language fallback (ko -> en)
 * - Missing translation warnings
 *
 * @example
 * ```typescript
 * const i18n = createI18nWithFallback(
 *   {
 *     en: {
 *       common: {
 *         greeting: "Hello",
 *         farewell: "Goodbye"
 *       },
 *       pages: {
 *         home: { title: "Home" }
 *         // 'greeting' missing here
 *       }
 *     },
 *     ko: {
 *       common: {
 *         greeting: "안녕하세요"
 *         // 'farewell' missing
 *       }
 *     }
 *   },
 *   {
 *     defaultNamespace: "common",
 *     fallbackChain: {
 *       "pages": ["common"],  // pages.* falls back to common.*
 *       "errors": ["common"]
 *     },
 *     languageFallback: {
 *       "ko": ["en"]  // ko falls back to en
 *     }
 *   }
 * );
 *
 * // Usage
 * const { t } = i18n.useTranslation();
 *
 * // ✅ Direct hit
 * t("common.greeting");  // "안녕하세요"
 *
 * // ✅ Language fallback: ko -> en
 * t("common.farewell");  // "Goodbye" (from en)
 *
 * // ✅ Namespace fallback: pages -> common
 * t("pages.greeting");  // "안녕하세요" (from common.greeting)
 * ```
 */
export function createI18nWithFallback<
  TTranslations extends Record<string, Record<string, any>>,
>(translations: TTranslations, config?: NamespaceFallbackConfig) {
  type Languages = keyof TTranslations & string;
  type FirstLanguage = TTranslations[Languages];

  const {
    defaultNamespace,
    fallbackChain = {},
    languageFallback = {},
    showWarnings = true,
  } = config || {};

  // Flatten all translations
  const flattenedTranslations: Record<string, Record<string, string>> = {};
  for (const lang in translations) {
    flattenedTranslations[lang] = flattenWithNamespace(translations[lang]);
  }

  const Provider = ({
    children,
    languageManagerOptions,
    onLanguageChange,
    initialLanguage,
  }: Omit<
    I18nProviderProps<Languages, Record<string, Record<string, string>>>,
    "translations"
  >): React.ReactElement => {
    return (
      <I18nProvider
        translations={flattenedTranslations}
        languageManagerOptions={languageManagerOptions}
        onLanguageChange={onLanguageChange}
        initialLanguage={initialLanguage}
      >
        {children}
      </I18nProvider>
    );
  };

  const useTranslation =
    (): NamespaceFallbackUseTranslationReturn<FirstLanguage> => {
      const { t: originalT, currentLanguage, isReady } = useTranslationOriginal<
        NestedKeyOf<FirstLanguage>
      >();

      const currentTranslations = flattenedTranslations[currentLanguage] || {};

      /**
       * Try to find translation with fallback logic
       */
      const findTranslation = (key: string): string | null => {
        // 1. Try direct hit in current language
        if (currentTranslations[key]) {
          return currentTranslations[key];
        }

        // 2. Try namespace fallback in current language
        const namespace = getNamespace(key);
        if (namespace && fallbackChain[namespace]) {
          const keyWithoutNamespace = key.substring(namespace.length + 1);

          for (const fallbackNs of fallbackChain[namespace]) {
            const fallbackKey = `${fallbackNs}.${keyWithoutNamespace}`;
            if (currentTranslations[fallbackKey]) {
              if (showWarnings) {
                console.warn(
                  `[i18nexus] Key "${key}" not found, using fallback "${fallbackKey}"`,
                );
              }
              return currentTranslations[fallbackKey];
            }
          }
        }

        // 3. Try default namespace in current language
        if (defaultNamespace && !namespace) {
          const defaultKey = `${defaultNamespace}.${key}`;
          if (currentTranslations[defaultKey]) {
            if (showWarnings) {
              console.warn(
                `[i18nexus] Key "${key}" not found, using default namespace "${defaultKey}"`,
              );
            }
            return currentTranslations[defaultKey];
          }
        }

        // 4. Try language fallback
        const fallbackLanguages = languageFallback[currentLanguage] || [];
        for (const fallbackLang of fallbackLanguages) {
          const fallbackTranslations = flattenedTranslations[fallbackLang];
          if (fallbackTranslations && fallbackTranslations[key]) {
            if (showWarnings) {
              console.warn(
                `[i18nexus] Key "${key}" not found in "${currentLanguage}", using "${fallbackLang}"`,
              );
            }
            return fallbackTranslations[key];
          }

          // 4a. Also try namespace fallback in fallback language
          if (namespace && fallbackChain[namespace]) {
            const keyWithoutNamespace = key.substring(namespace.length + 1);
            for (const fallbackNs of fallbackChain[namespace]) {
              const fallbackKey = `${fallbackNs}.${keyWithoutNamespace}`;
              if (
                fallbackTranslations &&
                fallbackTranslations[fallbackKey]
              ) {
                if (showWarnings) {
                  console.warn(
                    `[i18nexus] Key "${key}" not found, using "${fallbackLang}:${fallbackKey}"`,
                  );
                }
                return fallbackTranslations[fallbackKey];
              }
            }
          }
        }

        return null;
      };

      const t = ((
        key: string,
        variables?: TranslationVariables,
        styles?: TranslationStyles,
      ): string | React.ReactElement => {
        const translatedText = findTranslation(key) || key;

        // Use original t for interpolation and styling
        return originalT(translatedText as any, variables as any, styles as any);
      }) as NamespaceFallbackTranslationFunction<FirstLanguage>;

      const hasKey = (key: string): boolean => {
        return findTranslation(key) !== null;
      };

      const getKeys = (): string[] => {
        return Object.keys(currentTranslations);
      };

      return {
        t,
        currentLanguage,
        isReady,
        hasKey,
        getKeys,
      };
    };

  return {
    Provider,
    useTranslation,
    translations,
    flattenedTranslations,
    config,
  };
}

/**
 * Create a scoped translation function for a specific namespace
 *
 * @example
 * ```typescript
 * const i18n = createI18nWithFallback(translations);
 *
 * function ErrorBoundary() {
 *   const { t } = i18n.useTranslation();
 *   const tErrors = createScopedTranslation(t, "errors");
 *
 *   // Instead of t("errors.notFound")
 *   return <p>{tErrors("notFound")}</p>;
 * }
 * ```
 */
export function createScopedTranslation<T extends (...args: any[]) => any>(
  t: T,
  namespace: string,
): T {
  return ((key: string, ...args: any[]) => {
    return t(`${namespace}.${key}`, ...args);
  }) as T;
}

/**
 * Hook to create scoped translation for a namespace
 *
 * @example
 * ```typescript
 * function ErrorBoundary() {
 *   const t = useScopedTranslation("errors");
 *
 *   return (
 *     <div>
 *       <p>{t("notFound")}</p>
 *       <p>{t("unauthorized")}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useScopedTranslation(namespace: string) {
  const { t } = useTranslationOriginal();
  return React.useMemo(
    () => createScopedTranslation(t, namespace),
    [t, namespace],
  );
}
