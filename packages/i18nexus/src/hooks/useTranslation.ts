"use client";

import { useI18nContext } from "../components/I18nProvider";
import { LanguageConfig } from "../utils/languageManager";

/**
 * Return type for useTranslation hook
 */
export interface UseTranslationReturn {
  /**
   * Translation function
   * @param key - Translation key to look up
   * @returns Translated string or the key if translation not found
   */
  t: (key: string) => string;
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
export const useTranslation = (): UseTranslationReturn => {
  const { currentLanguage, isLoading, translations } = useI18nContext();

  // i18nexus 자체 번역 시스템 사용
  const translate = (key: string) => {
    const currentTranslations = translations[currentLanguage] || {};
    return currentTranslations[key] || key;
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
export const useLanguageSwitcher = (): UseLanguageSwitcherReturn => {
  const {
    currentLanguage,
    changeLanguage,
    availableLanguages,
    languageManager,
    isLoading,
  } = useI18nContext();

  const switchToNextLanguage = async () => {
    const languageCodes = availableLanguages.map((lang) => lang.code);
    const currentIndex = languageCodes.indexOf(currentLanguage);
    const nextIndex = (currentIndex + 1) % languageCodes.length;
    const nextLanguage = languageCodes[nextIndex];
    await changeLanguage(nextLanguage);
  };

  const switchToPreviousLanguage = async () => {
    const languageCodes = availableLanguages.map((lang) => lang.code);
    const currentIndex = languageCodes.indexOf(currentLanguage);
    const prevIndex =
      currentIndex === 0 ? languageCodes.length - 1 : currentIndex - 1;
    const prevLanguage = languageCodes[prevIndex];
    await changeLanguage(prevLanguage);
  };

  const getLanguageConfig = (code?: string) => {
    return languageManager.getLanguageConfig(code || currentLanguage);
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
