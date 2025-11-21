"use client";

import React from "react";
import {
  I18nProvider,
  I18nProviderProps,
  ExtractI18nKeys,
} from "../components/I18nProvider";
import {
  useTranslation as useTranslationOriginal,
  UseTranslationReturn,
} from "../hooks/useTranslation";

/**
 * Create a type-safe i18n instance with automatic key inference
 *
 * This helper provides the best DX for TypeScript users by automatically
 * inferring translation keys from your translations object.
 *
 * @example
 * ```typescript
 * // 1. Create your i18n instance
 * const i18n = createI18n({
 *   en: { greeting: "Hello", farewell: "Goodbye" },
 *   ko: { greeting: "안녕하세요", farewell: "안녕히 가세요" }
 * });
 *
 * // 2. Use the Provider
 * function App() {
 *   return (
 *     <i18n.Provider>
 *       <YourApp />
 *     </i18n.Provider>
 *   );
 * }
 *
 * // 3. Use the hook with automatic type inference
 * function YourComponent() {
 *   const { t } = i18n.useTranslation();
 *
 *   t("greeting");  // ✅ OK - key exists
 *   t("invalid");   // ❌ TypeScript Error - key doesn't exist
 * }
 * ```
 *
 * @param translations - Your translations object with language codes as keys
 * @returns An object with Provider and useTranslation with automatic type inference
 */
export function createI18n<
  TTranslations extends Record<string, Record<string, string>>,
>(translations: TTranslations) {
  type Keys = ExtractI18nKeys<TTranslations>;
  type Languages = keyof TTranslations & string;

  /**
   * Type-safe Provider component with pre-configured translations
   */
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

  /**
   * Type-safe useTranslation hook with automatic key inference
   */
  const useTranslation = (): UseTranslationReturn<Keys> => {
    return useTranslationOriginal<Keys>();
  };

  return {
    /**
     * Provider component with pre-configured translations
     */
    Provider,
    /**
     * Hook to access translation function with automatic type inference
     */
    useTranslation,
    /**
     * Original translations object (for reference or type extraction)
     */
    translations,
  };
}

/**
 * Type helper to extract translation keys from a translations object
 *
 * @example
 * ```typescript
 * const translations = {
 *   en: { greeting: "Hello" },
 *   ko: { greeting: "안녕하세요" }
 * };
 *
 * type Keys = TranslationKeys<typeof translations>;
 * // Result: "greeting"
 * ```
 */
export type TranslationKeys<
  T extends Record<string, Record<string, string>>,
> = ExtractI18nKeys<T>;

/**
 * Type helper to extract language codes from a translations object
 *
 * @example
 * ```typescript
 * const translations = {
 *   en: { greeting: "Hello" },
 *   ko: { greeting: "안녕하세요" }
 * };
 *
 * type Languages = TranslationLanguages<typeof translations>;
 * // Result: "en" | "ko"
 * ```
 */
export type TranslationLanguages<
  T extends Record<string, Record<string, string>>,
> = keyof T & string;
