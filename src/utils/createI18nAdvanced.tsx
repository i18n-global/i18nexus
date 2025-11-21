"use client";

import React from "react";
import {
  I18nProvider,
  I18nProviderProps,
  ExtractI18nKeys,
} from "../components/I18nProvider";
import {
  useTranslation as useTranslationOriginal,
  TranslationStyles,
} from "../hooks/useTranslation";
import {
  ExtractVariables,
  HasVariables,
  TranslationVariablesFor,
} from "./advancedTypes";

/**
 * Advanced type-safe translation function with variable inference
 * Automatically infers required variables from translation strings
 */
interface AdvancedTranslationFunction<
  Translations extends Record<string, string>,
> {
  // With styles - returns React element
  <K extends keyof Translations & string>(
    key: K,
    variables: TranslationVariablesFor<Translations[K]> extends undefined
      ? Record<string, string | number>
      : TranslationVariablesFor<Translations[K]>,
    styles: TranslationStyles,
  ): React.ReactElement;

  // Without styles - returns string
  <K extends keyof Translations & string>(
    key: K,
    ...args: HasVariables<Translations[K]> extends true
      ? [
          variables: TranslationVariablesFor<Translations[K]> &
            Record<string, string | number>,
        ]
      : [variables?: Record<string, string | number>]
  ): string;
}

/**
 * Return type for advanced useTranslation hook
 */
interface AdvancedUseTranslationReturn<
  Translations extends Record<string, string>,
> {
  t: AdvancedTranslationFunction<Translations>;
  currentLanguage: string;
  isReady: boolean;
}

/**
 * Create an advanced type-safe i18n instance with automatic variable inference
 *
 * This is the most advanced version with:
 * - Automatic translation key inference
 * - Automatic variable extraction from translation strings
 * - Type-safe variable validation
 * - Compile-time error for missing variables
 *
 * @example
 * ```typescript
 * const i18n = createI18nAdvanced({
 *   en: {
 *     greeting: "Hello {{name}}!",
 *     itemCount: "You have {{count}} items",
 *     simple: "No variables here"
 *   }
 * });
 *
 * function MyComponent() {
 *   const { t } = i18n.useTranslation();
 *
 *   // ✅ Variables required and type-checked
 *   t("greeting", { name: "John" });
 *
 *   // ❌ TypeScript error - missing 'name' variable
 *   t("greeting");
 *
 *   // ❌ TypeScript error - wrong variable name
 *   t("greeting", { username: "John" });
 *
 *   // ✅ No variables required
 *   t("simple");
 *   t("simple", { optional: "vars" });  // Optional vars OK
 * }
 * ```
 */
export function createI18nAdvanced<
  TTranslations extends Record<string, Record<string, string>>,
>(translations: TTranslations) {
  type Keys = ExtractI18nKeys<TTranslations>;
  type Languages = keyof TTranslations & string;
  type FirstLanguage = TTranslations[Languages];

  const Provider = ({
    children,
    languageManagerOptions,
    onLanguageChange,
    initialLanguage,
  }: Omit<
    I18nProviderProps<Languages, TTranslations>,
    "translations"
  >): React.ReactElement => {
    return (
      <I18nProvider
        translations={translations}
        languageManagerOptions={languageManagerOptions}
        onLanguageChange={onLanguageChange}
        initialLanguage={initialLanguage}
      >
        {children}
      </I18nProvider>
    );
  };

  const useTranslation = (): AdvancedUseTranslationReturn<FirstLanguage> => {
    const { t: originalT, currentLanguage, isReady } = useTranslationOriginal<Keys>();

    // Cast to advanced translation function
    const t = originalT as AdvancedTranslationFunction<FirstLanguage>;

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
  };
}

/**
 * Helper to extract required variables from a translation key
 * Useful for documentation and type inspection
 *
 * @example
 * ```typescript
 * const translations = {
 *   en: { greeting: "Hello {{name}} {{last}}" }
 * };
 *
 * type Vars = ExtractRequiredVariables<typeof translations.en, "greeting">;
 * // Result: { name: string | number, last: string | number }
 * ```
 */
export type ExtractRequiredVariables<
  T extends Record<string, string>,
  K extends keyof T,
> = HasVariables<T[K]> extends true
  ? Record<ExtractVariables<T[K]>, string | number>
  : never;
