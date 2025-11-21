"use client";

import React from "react";
import { useTranslation } from "../hooks/useTranslation";
import type { TranslationVariables, TranslationStyles } from "../hooks/useTranslation";

/**
 * Options for dynamic translation
 */
export interface DynamicTranslationOptions {
  /**
   * Fallback text when key is not found
   */
  fallback?: string;

  /**
   * Prefix to prepend to all keys
   * @example prefix: "errors" => t("notFound") becomes "errors.notFound"
   */
  prefix?: string;

  /**
   * Suffix to append to all keys
   * @example suffix: "_text" => t("greeting") becomes "greeting_text"
   */
  suffix?: string;

  /**
   * Transform function for keys
   * @example transform: (key) => key.toUpperCase()
   */
  transform?: (key: string) => string;

  /**
   * Whether to show warnings for missing keys
   * @default true
   */
  showWarnings?: boolean;

  /**
   * Default variables to merge with provided variables
   */
  defaultVariables?: TranslationVariables;
}

/**
 * Dynamic translation function (type-unsafe)
 * Use this when you need to generate translation keys at runtime
 */
export interface DynamicTranslationFunction {
  /**
   * Translate with dynamic key (no type checking)
   * @param key - Translation key (can be dynamic/computed)
   * @param variables - Optional variables for interpolation
   * @param styles - Optional styles for variables
   */
  (
    key: string,
    variables?: TranslationVariables,
    styles?: TranslationStyles,
  ): string | React.ReactElement;

  /**
   * Check if a key exists
   */
  hasKey: (key: string) => boolean;

  /**
   * Get raw translation without interpolation
   */
  getRaw: (key: string) => string;

  /**
   * Create a scoped dynamic translator
   */
  scope: (prefix: string) => DynamicTranslationFunction;
}

/**
 * Create dynamic translation wrapper
 *
 * Use this when you need to:
 * - Generate translation keys at runtime
 * - Use variables in key names
 * - Build keys from API responses or state
 *
 * ⚠️ Warning: This bypasses TypeScript type checking!
 * Use only when absolutely necessary.
 *
 * @example Basic dynamic keys
 * ```typescript
 * const tDynamic = useDynamicTranslation();
 *
 * // Dynamic key from variable
 * const errorCode = "404";
 * tDynamic(`errors.${errorCode}`);  // "errors.404"
 *
 * // Dynamic key from state
 * const status = props.status;
 * tDynamic(`status.${status}`);  // "status.active"
 * ```
 *
 * @example With prefix
 * ```typescript
 * const tErrors = useDynamicTranslation({ prefix: "errors" });
 *
 * // Automatically adds "errors." prefix
 * tErrors("404");         // => "errors.404"
 * tErrors("notFound");    // => "errors.notFound"
 * ```
 *
 * @example With transform
 * ```typescript
 * const tUpper = useDynamicTranslation({
 *   transform: (key) => key.toUpperCase()
 * });
 *
 * tUpper("greeting");  // => t("GREETING")
 * ```
 *
 * @example Safe with fallback
 * ```typescript
 * const tSafe = useDynamicTranslation({
 *   fallback: "Translation missing"
 * });
 *
 * tSafe("non.existent.key");  // "Translation missing"
 * ```
 */
export function useDynamicTranslation(
  options: DynamicTranslationOptions = {},
): DynamicTranslationFunction {
  const { t: originalT, currentLanguage } = useTranslation<string>();

  const {
    fallback,
    prefix,
    suffix,
    transform,
    showWarnings = true,
    defaultVariables = {},
  } = options;

  const processKey = React.useCallback(
    (key: string): string => {
      let processedKey = key;

      // Apply prefix
      if (prefix) {
        processedKey = `${prefix}.${processedKey}`;
      }

      // Apply suffix
      if (suffix) {
        processedKey = `${processedKey}${suffix}`;
      }

      // Apply transform
      if (transform) {
        processedKey = transform(processedKey);
      }

      return processedKey;
    },
    [prefix, suffix, transform],
  );

  const tDynamic = React.useCallback(
    (
      key: string,
      variables?: TranslationVariables,
      styles?: TranslationStyles,
    ): string | React.ReactElement => {
      const processedKey = processKey(key);
      const mergedVariables = { ...defaultVariables, ...variables };

      try {
        const result = originalT(
          processedKey as any,
          mergedVariables as any,
          styles as any,
        );

        // Check if translation was found (if result equals key and is string, it wasn't found)
        if (typeof result === "string" && result === processedKey && fallback) {
          if (showWarnings) {
            console.warn(
              `[i18nexus] Dynamic key "${processedKey}" not found, using fallback`,
            );
          }
          return fallback;
        }

        return result;
      } catch (error) {
        if (showWarnings) {
          console.warn(`[i18nexus] Error translating "${processedKey}":`, error);
        }
        return fallback || processedKey;
      }
    },
    [originalT, processKey, fallback, showWarnings, defaultVariables],
  );

  const hasKey = React.useCallback(
    (key: string): boolean => {
      const processedKey = processKey(key);
      const result = originalT(processedKey as any);
      return result !== processedKey;
    },
    [originalT, processKey],
  );

  const getRaw = React.useCallback(
    (key: string): string => {
      const processedKey = processKey(key);
      return originalT(processedKey as any) as string;
    },
    [originalT, processKey],
  );

  const scope = React.useCallback(
    (scopePrefix: string): DynamicTranslationFunction => {
      const newPrefix = prefix ? `${prefix}.${scopePrefix}` : scopePrefix;
      return createDynamicTranslationFunction(originalT, {
        ...options,
        prefix: newPrefix,
      });
    },
    [originalT, options, prefix],
  );

  const fn = tDynamic as DynamicTranslationFunction;
  fn.hasKey = hasKey;
  fn.getRaw = getRaw;
  fn.scope = scope;

  return fn;
}

/**
 * Create dynamic translation function (non-hook version)
 */
function createDynamicTranslationFunction(
  originalT: any,
  options: DynamicTranslationOptions,
): DynamicTranslationFunction {
  const {
    fallback,
    prefix,
    suffix,
    transform,
    showWarnings = true,
    defaultVariables = {},
  } = options;

  const processKey = (key: string): string => {
    let processedKey = key;
    if (prefix) processedKey = `${prefix}.${processedKey}`;
    if (suffix) processedKey = `${processedKey}${suffix}`;
    if (transform) processedKey = transform(processedKey);
    return processedKey;
  };

  const tDynamic = (
    key: string,
    variables?: TranslationVariables,
    styles?: TranslationStyles,
  ): string | React.ReactElement => {
    const processedKey = processKey(key);
    const mergedVariables = { ...defaultVariables, ...variables };

    try {
      const result = originalT(processedKey, mergedVariables, styles);
      if (typeof result === "string" && result === processedKey && fallback) {
        if (showWarnings) {
          console.warn(
            `[i18nexus] Dynamic key "${processedKey}" not found, using fallback`,
          );
        }
        return fallback;
      }
      return result;
    } catch (error) {
      if (showWarnings) {
        console.warn(`[i18nexus] Error translating "${processedKey}":`, error);
      }
      return fallback || processedKey;
    }
  };

  const fn = tDynamic as DynamicTranslationFunction;
  fn.hasKey = (key: string) => {
    const processedKey = processKey(key);
    const result = originalT(processedKey);
    return result !== processedKey;
  };
  fn.getRaw = (key: string) => {
    return originalT(processKey(key));
  };
  fn.scope = (scopePrefix: string) => {
    const newPrefix = prefix ? `${prefix}.${scopePrefix}` : scopePrefix;
    return createDynamicTranslationFunction(originalT, {
      ...options,
      prefix: newPrefix,
    });
  };

  return fn;
}

/**
 * Map array to dynamic translations
 *
 * @example
 * ```typescript
 * const errorCodes = ["404", "500", "403"];
 * const tDynamic = useDynamicTranslation({ prefix: "errors" });
 *
 * const errorMessages = mapDynamicTranslations(errorCodes, tDynamic);
 * // ["Not Found", "Server Error", "Forbidden"]
 * ```
 */
export function mapDynamicTranslations(
  keys: string[],
  tDynamic: DynamicTranslationFunction,
  variables?: TranslationVariables,
): string[] {
  return keys.map((key) => tDynamic(key, variables) as string);
}

/**
 * Create dynamic translation map
 *
 * @example
 * ```typescript
 * const statusMap = createDynamicTranslationMap(
 *   ["active", "inactive", "pending"],
 *   useDynamicTranslation({ prefix: "status" })
 * );
 * // { active: "Active", inactive: "Inactive", pending: "Pending" }
 *
 * <div>{statusMap[user.status]}</div>
 * ```
 */
export function createDynamicTranslationMap(
  keys: string[],
  tDynamic: DynamicTranslationFunction,
  variables?: TranslationVariables,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const key of keys) {
    map[key] = tDynamic(key, variables) as string;
  }
  return map;
}

/**
 * Hook for dynamic translation with React state
 *
 * @example
 * ```typescript
 * function ErrorDisplay({ errorCode }: { errorCode: string }) {
 *   const errorMessage = useDynamicTranslationValue(
 *     `errors.${errorCode}`,
 *     { fallback: "Unknown error" }
 *   );
 *
 *   return <div>{errorMessage}</div>;
 * }
 * ```
 */
export function useDynamicTranslationValue(
  key: string,
  options?: DynamicTranslationOptions,
): string {
  const tDynamic = useDynamicTranslation(options);
  return React.useMemo(() => tDynamic(key) as string, [tDynamic, key]);
}

/**
 * Hook for dynamic translation map
 *
 * @example
 * ```typescript
 * function StatusBadge({ status }: { status: string }) {
 *   const statusMap = useDynamicTranslationMap(
 *     ["active", "inactive", "pending"],
 *     { prefix: "status" }
 *   );
 *
 *   return <span>{statusMap[status]}</span>;
 * }
 * ```
 */
export function useDynamicTranslationMap(
  keys: string[],
  options?: DynamicTranslationOptions,
): Record<string, string> {
  const tDynamic = useDynamicTranslation(options);

  return React.useMemo(
    () => createDynamicTranslationMap(keys, tDynamic),
    [keys, tDynamic],
  );
}
