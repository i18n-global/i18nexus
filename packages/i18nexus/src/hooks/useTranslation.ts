"use client";

import React from "react";
import { useI18nContext } from "../components/I18nProvider";
import { LanguageConfig } from "../utils/languageManager";

/**
 * Variables for string interpolation
 */
export type TranslationVariables = Record<string, string | number>;

/**
 * Style configuration for a variable
 */
export type VariableStyle = React.CSSProperties;

/**
 * Styles for variables in translation
 */
export type TranslationStyles = Record<string, VariableStyle>;

/**
 * Return type for useTranslation hook
 */
export interface UseTranslationReturn<TLanguage extends string = string> {
  /**
   * Translation function
   * @param key - Translation key to look up
   * @param variables - Optional object with variables for string interpolation
   * @param styles - Optional object with styles for variables
   * @returns Translated string or React elements if styles are provided
   * @example
   * // Simple string interpolation
   * t("Hello {{name}}", { name: "World" })
   * // Returns: "Hello World"
   *
   * // With styles
   * t("개수 : {{count}} 입니다", { count: 5 }, { count: { color: 'red', fontWeight: 'bold' } })
   * // Returns: <>개수 : <span style={{...}}>5</span> 입니다</>
   *
   * t("{{fileName}}은(는) 이미 추가된 파일입니다.", { fileName: "test.txt" }, { fileName: { color: 'blue' } })
   */
  t: (
    key: string,
    variables?: TranslationVariables,
    styles?: TranslationStyles
  ) => string | React.ReactElement;
  /**
   * Current language code (e.g., 'en', 'ko')
   */
  currentLanguage: TLanguage;
  /**
   * Whether translations are ready to use
   */
  isReady: boolean;
}

/**
 * Replace variables in a translation string
 * @param text - Text with {{variable}} placeholders
 * @param variables - Object with variable values
 * @returns Text with variables replaced
 */
const interpolate = (
  text: string,
  variables?: TranslationVariables
): string => {
  if (!variables) {
    return text;
  }

  return text.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    const value = variables[variableName];
    return value !== undefined ? String(value) : match;
  });
};

/**
 * Replace variables in a translation string with React elements (with styles)
 * @param text - Text with {{variable}} placeholders
 * @param variables - Object with variable values
 * @param styles - Object with styles for variables
 * @returns React elements with styled variables
 */
const interpolateWithStyles = (
  text: string,
  variables: TranslationVariables,
  styles: TranslationStyles
): React.ReactElement => {
  // Split text by variable placeholders
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  const regex = /\{\{(\w+)\}\}/g;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the variable
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const variableName = match[1];
    const value = variables[variableName];
    const style = styles[variableName];

    if (value !== undefined) {
      if (style) {
        // Wrap with span if style is provided
        parts.push(
          React.createElement(
            "span",
            { key: `var-${key++}`, style: style },
            String(value)
          )
        );
      } else {
        // Just add the value as string
        parts.push(String(value));
      }
    } else {
      // Keep placeholder if value not found
      parts.push(match[0]);
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return React.createElement(React.Fragment, null, ...parts);
};

/**
 * Hook to access translation function and current language
 */
export const useTranslation = <
  TLanguage extends string = string,
>(): UseTranslationReturn<TLanguage> => {
  const { currentLanguage, isLoading, translations } =
    useI18nContext<TLanguage>();

  // i18nexus 자체 번역 시스템 사용
  const translate = (
    key: string,
    variables?: TranslationVariables,
    styles?: TranslationStyles
  ) => {
    const currentTranslations = translations[currentLanguage] || {};
    const translatedText = currentTranslations[key] || key;

    // If styles are provided, return React elements
    if (styles && variables) {
      return interpolateWithStyles(translatedText, variables, styles);
    }

    // Otherwise return string
    return interpolate(translatedText, variables);
  };

  return {
    t: translate,
    currentLanguage,
    isReady: !isLoading,
  };
};

/**
 * Return type for useLanguageSwitcher hook
 */
export interface UseLanguageSwitcherReturn<TLanguage extends string = string> {
  /**
   * Current language code (e.g., 'en', 'ko')
   */
  currentLanguage: TLanguage;
  /**
   * List of available language configurations
   */
  availableLanguages: LanguageConfig[];
  /**
   * Change the current language
   * @param lang - Language code to switch to
   * @returns Promise that resolves when language is changed
   */
  changeLanguage: (lang: TLanguage) => Promise<void>;
  /**
   * Alias for changeLanguage - Switch to a specific language
   * @param lang - Language code to switch to
   * @returns Promise that resolves when language is changed
   */
  switchLng: (lang: TLanguage) => Promise<void>;
  /**
   * Switch to the next available language in the list
   */
  switchToNextLanguage: () => Promise<void>;
  /**
   * Switch to the previous language in the list
   */
  switchToPreviousLanguage: () => Promise<void>;
  /**
   * Get language configuration for a specific language code
   * @param code - Language code (defaults to current language)
   */
  getLanguageConfig: (code?: TLanguage) => LanguageConfig | undefined;
  /**
   * Detect the user's browser language
   * @returns Browser language code or null if not detected
   */
  detectBrowserLanguage: () => string | null;
  /**
   * Reset language to default
   */
  resetLanguage: () => void;
  /**
   * Whether language is currently being changed
   */
  isLoading: boolean;
}

/**
 * Hook to access language switching functionality
 */
export const useLanguageSwitcher = <
  TLanguage extends string = string,
>(): UseLanguageSwitcherReturn<TLanguage> => {
  const {
    currentLanguage,
    changeLanguage,
    availableLanguages,
    languageManager,
    isLoading,
  } = useI18nContext<TLanguage>();

  const switchToNextLanguage = async () => {
    const languageCodes = availableLanguages.map((lang) => lang.code);
    const currentIndex = languageCodes.indexOf(currentLanguage);
    const nextIndex = (currentIndex + 1) % languageCodes.length;
    const nextLanguage = languageCodes[nextIndex] as TLanguage;
    await changeLanguage(nextLanguage);
  };

  const switchToPreviousLanguage = async () => {
    const languageCodes = availableLanguages.map((lang) => lang.code);
    const currentIndex = languageCodes.indexOf(currentLanguage);
    const prevIndex =
      currentIndex === 0 ? languageCodes.length - 1 : currentIndex - 1;
    const prevLanguage = languageCodes[prevIndex] as TLanguage;
    await changeLanguage(prevLanguage);
  };

  const getLanguageConfig = (code?: TLanguage) => {
    return languageManager.getLanguageConfig(
      (code || currentLanguage) as string
    );
  };

  const detectBrowserLanguage = () => {
    return languageManager.detectBrowserLanguage();
  };

  const resetLanguage = () => {
    languageManager.reset();
  };

  return {
    currentLanguage,
    availableLanguages,
    changeLanguage,
    switchLng: changeLanguage, // Alias for better compatibility
    switchToNextLanguage,
    switchToPreviousLanguage,
    getLanguageConfig,
    detectBrowserLanguage,
    resetLanguage,
    isLoading,
  };
};
