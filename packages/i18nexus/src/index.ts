// Components
export { I18nProvider, useI18nContext } from "./components/I18nProvider";
export type { I18nProviderProps } from "./components/I18nProvider";

// Hooks
export { useTranslation, useLanguageSwitcher } from "./hooks/useTranslation";
export type {
  UseTranslationReturn,
  UseLanguageSwitcherReturn,
  TranslationVariables,
  TranslationStyles,
  VariableStyle,
} from "./hooks/useTranslation";

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

// Config
export type { I18nexusConfig } from "./scripts/config-loader";

// Note: CLI tools are available separately:
// - npx i18n-wrapper (wrap hardcoded strings with t() functions)
// - npx i18n-extractor (extract translation keys to JSON/CSV)
// - npx i18n-upload (upload translations to Google Sheets)
// - npx i18n-download (download translations from Google Sheets)
