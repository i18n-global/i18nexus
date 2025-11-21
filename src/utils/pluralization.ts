/**
 * Pluralization utilities for i18nexus
 * Supports count-based plural forms following Unicode CLDR rules
 */

import { PluralOptions, PluralForm } from "./advancedTypes";

export type { PluralForm };

/**
 * Get plural form for a given count and language
 * Based on Unicode CLDR plural rules
 *
 * @param count - The count to determine plural form
 * @param language - Language code (e.g., 'en', 'ko', 'ar')
 * @returns Plural form category
 *
 * @example
 * ```typescript
 * getPluralForm(0, 'en');  // "other"
 * getPluralForm(1, 'en');  // "one"
 * getPluralForm(2, 'en');  // "other"
 * getPluralForm(1, 'ko');  // "other" (Korean has no plural)
 * ```
 */
export function getPluralForm(count: number, language: string): PluralForm {
  const absCount = Math.abs(count);

  // Language-specific plural rules
  switch (language) {
    // No plural distinction (e.g., Korean, Japanese, Chinese)
    case "ko":
    case "ja":
    case "zh":
    case "th":
    case "vi":
      return "other";

    // English-like (1 = one, other = other)
    case "en":
    case "de":
    case "nl":
    case "sv":
    case "da":
    case "no":
    case "es":
    case "it":
    case "pt":
      if (absCount === 1) return "one";
      return "other";

    // French-like (0-1 = one, other = other)
    case "fr":
      if (absCount === 0 || absCount === 1) return "one";
      return "other";

    // Russian-like (complex rules)
    case "ru":
    case "uk":
      if (absCount % 10 === 1 && absCount % 100 !== 11) return "one";
      if (
        absCount % 10 >= 2 &&
        absCount % 10 <= 4 &&
        (absCount % 100 < 10 || absCount % 100 >= 20)
      )
        return "few";
      return "many";

    // Polish (complex rules)
    case "pl":
      if (absCount === 1) return "one";
      if (
        absCount % 10 >= 2 &&
        absCount % 10 <= 4 &&
        (absCount % 100 < 10 || absCount % 100 >= 20)
      )
        return "few";
      return "many";

    // Arabic (very complex rules)
    case "ar":
      if (absCount === 0) return "zero";
      if (absCount === 1) return "one";
      if (absCount === 2) return "two";
      if (absCount % 100 >= 3 && absCount % 100 <= 10) return "few";
      if (absCount % 100 >= 11 && absCount % 100 <= 99) return "many";
      return "other";

    // Default to English-like
    default:
      if (absCount === 1) return "one";
      return "other";
  }
}

/**
 * Select appropriate plural form from options
 *
 * @param count - The count to determine plural form
 * @param options - Plural form options
 * @param language - Language code
 * @returns Selected plural string
 *
 * @example
 * ```typescript
 * selectPlural(0, { zero: "no items", one: "one item", other: "{{count}} items" }, "en");
 * // "no items"
 *
 * selectPlural(1, { one: "one item", other: "{{count}} items" }, "en");
 * // "one item"
 *
 * selectPlural(5, { one: "one item", other: "{{count}} items" }, "en");
 * // "5 items"
 * ```
 */
export function selectPlural(
  count: number,
  options: PluralOptions,
  language: string,
): string {
  const form = getPluralForm(count, language);

  // Try to find exact match
  let selected = options[form];

  // Fallback chain: requested form -> other -> first available
  if (!selected) {
    selected =
      options.other ||
      options.one ||
      options.few ||
      options.many ||
      options.two ||
      options.zero ||
      "";
  }

  // Replace {{count}} placeholder
  return selected.replace(/\{\{count\}\}/g, String(count));
}

/**
 * Create pluralized translation function
 *
 * @example
 * ```typescript
 * const translations = {
 *   en: {
 *     items_plural: {
 *       zero: "no items",
 *       one: "one item",
 *       other: "{{count}} items"
 *     }
 *   }
 * };
 *
 * const t = createPluralTranslation("en", translations.en);
 * t("items", 0);   // "no items"
 * t("items", 1);   // "one item"
 * t("items", 5);   // "5 items"
 * ```
 */
export function createPluralTranslation(
  language: string,
  translations: Record<string, any>,
) {
  return function plural(key: string, count: number): string {
    const pluralKey = `${key}_plural`;
    const pluralOptions = translations[pluralKey];

    if (!pluralOptions || typeof pluralOptions !== "object") {
      // Fallback to regular translation
      return translations[key] || key;
    }

    return selectPlural(count, pluralOptions as PluralOptions, language);
  };
}

/**
 * Interpolate variables in pluralized string
 *
 * @example
 * ```typescript
 * interpolatePlural(
 *   "You have {{count}} items in {{location}}",
 *   { count: 5, location: "cart" }
 * );
 * // "You have 5 items in cart"
 * ```
 */
export function interpolatePlural(
  text: string,
  variables: Record<string, string | number>,
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    const value = variables[variableName];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Combined plural and interpolation
 *
 * @example
 * ```typescript
 * const result = pluralWithInterpolation(
 *   5,
 *   { one: "{{count}} item in {{location}}", other: "{{count}} items in {{location}}" },
 *   "en",
 *   { location: "cart" }
 * );
 * // "5 items in cart"
 * ```
 */
export function pluralWithInterpolation(
  count: number,
  options: PluralOptions,
  language: string,
  variables?: Record<string, string | number>,
): string {
  let result = selectPlural(count, options, language);

  if (variables) {
    result = interpolatePlural(result, { ...variables, count });
  }

  return result;
}

/**
 * Simple pluralization helper (English-like)
 *
 * @example
 * ```typescript
 * pluralize(0, "item");     // "items"
 * pluralize(1, "item");     // "item"
 * pluralize(5, "item");     // "items"
 * pluralize(2, "box", "boxes");  // "boxes"
 * ```
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  if (Math.abs(count) === 1) {
    return singular;
  }
  return plural || `${singular}s`;
}

/**
 * Get all supported plural forms for a language
 *
 * @example
 * ```typescript
 * getSupportedPluralForms("en");  // ["one", "other"]
 * getSupportedPluralForms("ar");  // ["zero", "one", "two", "few", "many", "other"]
 * getSupportedPluralForms("ko");  // ["other"]
 * ```
 */
export function getSupportedPluralForms(language: string): PluralForm[] {
  switch (language) {
    case "ko":
    case "ja":
    case "zh":
    case "th":
    case "vi":
      return ["other"];

    case "en":
    case "de":
    case "nl":
    case "sv":
    case "da":
    case "no":
    case "es":
    case "it":
    case "pt":
      return ["one", "other"];

    case "fr":
      return ["one", "other"];

    case "ru":
    case "uk":
    case "pl":
      return ["one", "few", "many"];

    case "ar":
      return ["zero", "one", "two", "few", "many", "other"];

    default:
      return ["one", "other"];
  }
}
