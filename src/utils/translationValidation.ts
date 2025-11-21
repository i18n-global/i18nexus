/**
 * Translation validation utilities
 * Helps detect missing translations, inconsistencies, and completeness
 */

import { ValidationResult } from "./advancedTypes";
import { getNestedKeys } from "./createI18nNamespace";

/**
 * Validate translation completeness across all languages
 * Checks that all languages have the same keys
 *
 * @example
 * ```typescript
 * const result = validateTranslationCompleteness({
 *   en: { greeting: "Hello", farewell: "Goodbye" },
 *   ko: { greeting: "안녕하세요" }  // Missing "farewell"
 * });
 *
 * if (!result.valid) {
 *   console.log("Missing translations:", result.missingKeys);
 * }
 * ```
 */
export function validateTranslationCompleteness(
  translations: Record<string, Record<string, string>>,
): ValidationResult {
  const languages = Object.keys(translations);

  if (languages.length === 0) {
    return {
      valid: true,
      missingKeys: [],
      extraKeys: [],
      allKeys: [],
    };
  }

  // Get all unique keys across all languages
  const allKeysSet = new Set<string>();
  const keysByLanguage: Record<string, Set<string>> = {};

  for (const lang of languages) {
    const keys = Object.keys(translations[lang]);
    keysByLanguage[lang] = new Set(keys);
    keys.forEach((key) => allKeysSet.add(key));
  }

  const allKeys = Array.from(allKeysSet).sort();

  // Find missing and extra keys
  const missingKeys: { language: string; keys: string[] }[] = [];
  const extraKeys: { language: string; keys: string[] }[] = [];

  for (const lang of languages) {
    const langKeys = keysByLanguage[lang];
    const missing = allKeys.filter((key) => !langKeys.has(key));
    const extra = Array.from(langKeys).filter((key) => !allKeysSet.has(key));

    if (missing.length > 0) {
      missingKeys.push({ language: lang, keys: missing });
    }

    if (extra.length > 0) {
      extraKeys.push({ language: lang, keys: extra });
    }
  }

  return {
    valid: missingKeys.length === 0 && extraKeys.length === 0,
    missingKeys,
    extraKeys,
    allKeys,
  };
}

/**
 * Validate nested translation completeness
 * Supports nested objects with dot notation
 *
 * @example
 * ```typescript
 * const result = validateNestedTranslationCompleteness({
 *   en: {
 *     common: { greeting: "Hello" },
 *     errors: { notFound: "Not found" }
 *   },
 *   ko: {
 *     common: { greeting: "안녕하세요" }
 *     // Missing errors.notFound
 *   }
 * });
 * ```
 */
export function validateNestedTranslationCompleteness(
  translations: Record<string, Record<string, any>>,
): ValidationResult {
  const languages = Object.keys(translations);

  if (languages.length === 0) {
    return {
      valid: true,
      missingKeys: [],
      extraKeys: [],
      allKeys: [],
    };
  }

  // Get all unique nested keys
  const allKeysSet = new Set<string>();
  const keysByLanguage: Record<string, Set<string>> = {};

  for (const lang of languages) {
    const keys = getNestedKeys(translations[lang]);
    keysByLanguage[lang] = new Set(keys);
    keys.forEach((key) => allKeysSet.add(key));
  }

  const allKeys = Array.from(allKeysSet).sort();

  // Find missing keys per language
  const missingKeys: { language: string; keys: string[] }[] = [];

  for (const lang of languages) {
    const langKeys = keysByLanguage[lang];
    const missing = allKeys.filter((key) => !langKeys.has(key));

    if (missing.length > 0) {
      missingKeys.push({ language: lang, keys: missing });
    }
  }

  return {
    valid: missingKeys.length === 0,
    missingKeys,
    extraKeys: [],
    allKeys,
  };
}

/**
 * Get translation completeness percentage for each language
 *
 * @example
 * ```typescript
 * const stats = getTranslationStats({
 *   en: { greeting: "Hello", farewell: "Goodbye", welcome: "Welcome" },
 *   ko: { greeting: "안녕하세요", farewell: "안녕히 가세요" }
 * });
 * // { en: 100, ko: 66.67 }
 * ```
 */
export function getTranslationStats(
  translations: Record<string, Record<string, string>>,
): Record<string, number> {
  const validation = validateTranslationCompleteness(translations);
  const stats: Record<string, number> = {};

  const totalKeys = validation.allKeys.length;
  if (totalKeys === 0) return stats;

  for (const lang in translations) {
    const langKeys = Object.keys(translations[lang]).length;
    stats[lang] = Math.round((langKeys / totalKeys) * 10000) / 100;
  }

  return stats;
}

/**
 * Find unused translation keys
 * Scans source files to find translation keys that are not used
 *
 * @example
 * ```typescript
 * const unused = findUnusedKeys(
 *   ["greeting", "farewell", "unused"],
 *   ["greeting is used", "farewell is here"]
 * );
 * // ["unused"]
 * ```
 */
export function findUnusedKeys(
  allKeys: string[],
  sourceContents: string[],
): string[] {
  const unused: string[] = [];

  for (const key of allKeys) {
    const isUsed = sourceContents.some((content) => {
      // Check for t("key") or t('key') or t(`key`)
      const patterns = [
        `t("${key}")`,
        `t('${key}')`,
        `t(\`${key}\`)`,
        `"${key}"`,
        `'${key}'`,
      ];
      return patterns.some((pattern) => content.includes(pattern));
    });

    if (!isUsed) {
      unused.push(key);
    }
  }

  return unused;
}

/**
 * Generate translation coverage report
 *
 * @example
 * ```typescript
 * const report = generateCoverageReport({
 *   en: { greeting: "Hello", farewell: "Goodbye" },
 *   ko: { greeting: "안녕하세요" }
 * });
 *
 * console.log(report);
 * // Translation Coverage Report
 * // ===========================
 * // Total keys: 2
 * // Languages: en, ko
 * //
 * // Coverage:
 * //   en: 100% (2/2)
 * //   ko: 50% (1/2)
 * //
 * // Missing translations:
 * //   ko: farewell
 * ```
 */
export function generateCoverageReport(
  translations: Record<string, Record<string, string>>,
): string {
  const validation = validateTranslationCompleteness(translations);
  const stats = getTranslationStats(translations);

  let report = "Translation Coverage Report\n";
  report += "===========================\n\n";

  report += `Total keys: ${validation.allKeys.length}\n`;
  report += `Languages: ${Object.keys(translations).join(", ")}\n\n`;

  report += "Coverage:\n";
  for (const lang in stats) {
    const langKeys = Object.keys(translations[lang]).length;
    report += `  ${lang}: ${stats[lang]}% (${langKeys}/${validation.allKeys.length})\n`;
  }

  if (validation.missingKeys.length > 0) {
    report += "\nMissing translations:\n";
    for (const { language, keys } of validation.missingKeys) {
      report += `  ${language}: ${keys.join(", ")}\n`;
    }
  }

  if (validation.valid) {
    report += "\n✅ All translations are complete!\n";
  } else {
    report += `\n❌ Found ${validation.missingKeys.reduce((sum, m) => sum + m.keys.length, 0)} missing translations\n`;
  }

  return report;
}

/**
 * Assert translation completeness (throws error if invalid)
 * Useful for CI/CD pipelines
 *
 * @example
 * ```typescript
 * // In your test file or CI script
 * assertTranslationCompleteness({
 *   en: { greeting: "Hello" },
 *   ko: { greeting: "안녕하세요" }
 * });
 * // Throws error if any translations are missing
 * ```
 */
export function assertTranslationCompleteness(
  translations: Record<string, Record<string, string>>,
): void {
  const validation = validateTranslationCompleteness(translations);

  if (!validation.valid) {
    const report = generateCoverageReport(translations);
    throw new Error(
      `Translation validation failed!\n\n${report}\n\nPlease ensure all translations are complete.`,
    );
  }
}
