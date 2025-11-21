"use client";

import React from "react";
import {
  I18nProvider,
  I18nProviderProps,
} from "../components/I18nProvider";
import {
  useTranslation as useTranslationOriginal,
  TranslationStyles,
} from "../hooks/useTranslation";
import {
  NestedKeyOf,
  GetNestedValue,
  HasVariables,
  TranslationVariablesFor,
} from "./advancedTypes";

/**
 * Flatten nested translations object
 * Converts { common: { greeting: "Hello" } } to { "common.greeting": "Hello" }
 */
function flattenTranslations(
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
      Object.assign(result, flattenTranslations(value, newKey));
    }
  }

  return result;
}

/**
 * Translation function for nested keys
 */
interface NestedTranslationFunction<
  Translations extends Record<string, any>,
> {
  // With styles - returns React element
  <K extends NestedKeyOf<Translations>>(
    key: K,
    variables: GetNestedValue<Translations, K> extends string
      ? HasVariables<GetNestedValue<Translations, K>> extends true
        ? TranslationVariablesFor<GetNestedValue<Translations, K>> &
            Record<string, string | number>
        : Record<string, string | number>
      : Record<string, string | number>,
    styles: TranslationStyles,
  ): React.ReactElement;

  // Without styles - returns string
  <K extends NestedKeyOf<Translations>>(
    key: K,
    ...args: GetNestedValue<Translations, K> extends string
      ? HasVariables<GetNestedValue<Translations, K>> extends true
        ? [
            variables: TranslationVariablesFor<
              GetNestedValue<Translations, K>
            > &
              Record<string, string | number>,
          ]
        : [variables?: Record<string, string | number>]
      : [variables?: Record<string, string | number>]
  ): string;
}

/**
 * Return type for namespace useTranslation hook
 */
interface NestedUseTranslationReturn<
  Translations extends Record<string, any>,
> {
  t: NestedTranslationFunction<Translations>;
  currentLanguage: string;
  isReady: boolean;
}

/**
 * Create i18n instance with namespace support (nested translations)
 *
 * Supports nested translation objects with dot notation access
 *
 * @example
 * ```typescript
 * const i18n = createI18nNamespace({
 *   en: {
 *     common: {
 *       greeting: "Hello {{name}}!",
 *       farewell: "Goodbye"
 *     },
 *     errors: {
 *       notFound: "Not found",
 *       unauthorized: "Unauthorized"
 *     },
 *     pages: {
 *       home: {
 *         title: "Home Page",
 *         subtitle: "Welcome"
 *       }
 *     }
 *   }
 * });
 *
 * function MyComponent() {
 *   const { t } = i18n.useTranslation();
 *
 *   // ✅ Nested key access with autocomplete
 *   t("common.greeting", { name: "John" });
 *   t("errors.notFound");
 *   t("pages.home.title");
 *
 *   // ❌ TypeScript error - invalid key
 *   t("common.invalid");
 *   t("errors");  // Must be a leaf node
 * }
 * ```
 */
export function createI18nNamespace<
  TTranslations extends Record<string, Record<string, any>>,
>(translations: TTranslations) {
  type Languages = keyof TTranslations & string;
  type FirstLanguage = TTranslations[Languages];

  // Flatten all translations
  const flattenedTranslations: Record<string, Record<string, string>> = {};
  for (const lang in translations) {
    flattenedTranslations[lang] = flattenTranslations(translations[lang]);
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

  const useTranslation = (): NestedUseTranslationReturn<FirstLanguage> => {
    const { t: originalT, currentLanguage, isReady } = useTranslationOriginal<
      NestedKeyOf<FirstLanguage>
    >();

    const t = originalT as NestedTranslationFunction<FirstLanguage>;

    return {
      t,
      currentLanguage,
      isReady,
    };
  };

  return {
    Provider,
    useTranslation,
    translations,
    flattenedTranslations,
  };
}

/**
 * Helper to get all nested keys from a translations object
 *
 * @example
 * ```typescript
 * const keys = getNestedKeys({
 *   common: { greeting: "Hello" },
 *   errors: { notFound: "Not found" }
 * });
 * // ["common.greeting", "errors.notFound"]
 * ```
 */
export function getNestedKeys(
  obj: Record<string, any>,
  prefix = "",
): string[] {
  const keys: string[] = [];

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      keys.push(newKey);
    } else if (typeof value === "object" && value !== null) {
      keys.push(...getNestedKeys(value, newKey));
    }
  }

  return keys;
}
