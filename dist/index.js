// Components
export { I18nProvider, useI18nContext } from "./components/I18nProvider";
export { I18NexusDevtools } from "./components/I18NexusDevtools";
// Hooks
export { useTranslation, useLanguageSwitcher } from "./hooks/useTranslation";
// Type-safe translation utilities
export { createTypedTranslation, createTypedTranslationWithStyles, createMultiLangTypedTranslation, validateTranslationKeys, getTranslationKeyList, } from "./utils/typeTranslation";
// Modern type-safe i18n creator (recommended)
export { createI18n } from "./utils/createI18n";
// Advanced type-safe i18n with variable inference (most advanced)
export { createI18nAdvanced } from "./utils/createI18nAdvanced";
// Namespace support for nested translations
export { createI18nNamespace, getNestedKeys } from "./utils/createI18nNamespace";
// Namespace with fallback support (most flexible)
export { createI18nWithFallback, createScopedTranslation, useScopedTranslation, } from "./utils/namespaceFallback";
// Dynamic translation wrapper (for runtime keys)
export { useDynamicTranslation, mapDynamicTranslations, createDynamicTranslationMap, useDynamicTranslationValue, useDynamicTranslationMap, } from "./utils/dynamicTranslationWrapper";
// Translation validation utilities
export { validateTranslationCompleteness, validateNestedTranslationCompleteness, getTranslationStats, findUnusedKeys, generateCoverageReport, assertTranslationCompleteness, } from "./utils/translationValidation";
// Pluralization support
export { getPluralForm, selectPlural, createPluralTranslation, interpolatePlural, pluralWithInterpolation, pluralize, getSupportedPluralForms, } from "./utils/pluralization";
// Utils
export { setCookie, getCookie, deleteCookie, getAllCookies, } from "./utils/cookie";
// Language Manager
export { LanguageManager, defaultLanguageManager, } from "./utils/languageManager";
// Type utilities
export { defineConfig } from "./utils/types";
// Configuration management (central config file support)
export { validateConfig, toNamespaceFallbackConfig, toDynamicTranslationOptions, isValidConfig, defaultConfig, } from "./utils/config";
// Configuration loaders
export { loadConfigFromFile, loadConfigFromFileSync, loadConfig, loadConfigFromEnv, saveConfigToFile, hasConfigFile, getConfigPath, } from "./utils/configLoader";
// Config-based i18n creation
export { createI18nFromConfig, createI18nFromConfigFile, useI18nFromConfig, I18nConfigProvider, getLanguageManagerOptions, } from "./utils/createFromConfig";
// Dynamic translation utilities
export { createDynamicTranslation, buildTranslationParams, buildConditionalTranslation, mapToTranslationParams, } from "./utils/dynamicTranslation";
//# sourceMappingURL=index.js.map