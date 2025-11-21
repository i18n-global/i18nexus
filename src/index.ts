// Components
export { I18nProvider, useI18nContext } from "./components/I18nProvider";
export type {
  I18nProviderProps,
  I18nContextType,
  ExtractI18nKeys,
} from "./components/I18nProvider";
export { I18NexusDevtools } from "./components/I18NexusDevtools";
export type { I18NexusDevtoolsProps } from "./components/I18NexusDevtools";

// Hooks
export { useTranslation, useLanguageSwitcher } from "./hooks/useTranslation";
export type {
  UseTranslationReturn,
  UseLanguageSwitcherReturn,
  TranslationVariables,
  TranslationStyles,
  VariableStyle,
  TranslationFunction,
} from "./hooks/useTranslation";

// Type-safe translation utilities
export {
  createTypedTranslation,
  createTypedTranslationWithStyles,
  createMultiLangTypedTranslation,
  validateTranslationKeys,
  getTranslationKeyList,
} from "./utils/typeTranslation";
export type {
  ExtractTranslationKeys,
  ExtractLanguageKeys,
} from "./utils/typeTranslation";

// Modern type-safe i18n creator (recommended)
export { createI18n } from "./utils/createI18n";
export type {
  TranslationKeys,
  TranslationLanguages,
} from "./utils/createI18n";

// Advanced type-safe i18n with variable inference (most advanced)
export { createI18nAdvanced } from "./utils/createI18nAdvanced";
export type { ExtractRequiredVariables } from "./utils/createI18nAdvanced";

// Namespace support for nested translations
export { createI18nNamespace, getNestedKeys } from "./utils/createI18nNamespace";

// Translation validation utilities
export {
  validateTranslationCompleteness,
  validateNestedTranslationCompleteness,
  getTranslationStats,
  findUnusedKeys,
  generateCoverageReport,
  assertTranslationCompleteness,
} from "./utils/translationValidation";
export type { ValidationResult } from "./utils/advancedTypes";

// Pluralization support
export {
  getPluralForm,
  selectPlural,
  createPluralTranslation,
  interpolatePlural,
  pluralWithInterpolation,
  pluralize,
  getSupportedPluralForms,
} from "./utils/pluralization";
export type { PluralForm, PluralOptions } from "./utils/advancedTypes";

// Advanced type utilities
export type {
  ExtractVariables,
  HasVariables,
  TranslationVariablesFor,
  NestedKeyOf,
  GetNestedValue,
} from "./utils/advancedTypes";

// Utils
export {
  setCookie,
  getCookie,
  deleteCookie,
  getAllCookies,
} from "./utils/cookie";
export type { CookieOptions } from "./utils/cookie";

// Language Manager
export {
  LanguageManager,
  defaultLanguageManager,
} from "./utils/languageManager";
export type {
  LanguageConfig,
  LanguageManagerOptions,
} from "./utils/languageManager";

// Type utilities
export { defineConfig } from "./utils/types";
export type { ExtractLanguages } from "./utils/types";

// Dynamic translation utilities
export {
  createDynamicTranslation,
  buildTranslationParams,
  buildConditionalTranslation,
  mapToTranslationParams,
} from "./utils/dynamicTranslation";
