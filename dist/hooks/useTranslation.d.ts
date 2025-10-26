import React from "react";
import type { LanguageConfig } from "../utils/languageManager";
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
 * Translation function overloads for type safety
 */
export interface TranslationFunction {
    /**
     * Translation with styles - returns React element
     * @param key - Translation key to look up
     * @param variables - Object with variables for string interpolation
     * @param styles - Object with styles for variables
     * @returns React element with styled variables
     * @example
     * t("개수 : {{count}} 입니다", { count: 5 }, { count: { color: 'red', fontWeight: 'bold' } })
     * // Returns: <>개수 : <span style={{...}}>5</span> 입니다</>
     */
    (key: string, variables: TranslationVariables, styles: TranslationStyles): React.ReactElement;
    /**
     * Translation without styles - returns string
     * @param key - Translation key to look up
     * @param variables - Optional object with variables for string interpolation
     * @returns Translated string with interpolated variables
     * @example
     * t("Hello {{name}}", { name: "World" })
     * // Returns: "Hello World"
     */
    (key: string, variables?: TranslationVariables): string;
}
/**
 * Return type for useTranslation hook
 */
export interface UseTranslationReturn {
    /**
     * Translation function with type guards
     * - Returns React.ReactElement when styles are provided
     * - Returns string when styles are not provided
     */
    t: TranslationFunction;
    /**
     * Current language code (e.g., 'en', 'ko')
     */
    currentLanguage: string;
    /**
     * Whether translations are ready to use
     */
    isReady: boolean;
}
/**
 * Hook to access translation function and current language
 */
export declare const useTranslation: () => UseTranslationReturn;
/**
 * Return type for useLanguageSwitcher hook
 */
export interface UseLanguageSwitcherReturn {
    /**
     * Current language code (e.g., 'en', 'ko')
     */
    currentLanguage: string;
    /**
     * List of available language configurations
     */
    availableLanguages: LanguageConfig[];
    /**
     * Change the current language
     * @param lang - Language code to switch to
     * @returns Promise that resolves when language is changed
     */
    changeLanguage: (lang: string) => Promise<void>;
    /**
     * Alias for changeLanguage - Switch to a specific language
     * @param lang - Language code to switch to
     * @returns Promise that resolves when language is changed
     */
    switchLng: (lang: string) => Promise<void>;
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
    getLanguageConfig: (code?: string) => LanguageConfig | undefined;
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
export declare const useLanguageSwitcher: () => UseLanguageSwitcherReturn;
//# sourceMappingURL=useTranslation.d.ts.map