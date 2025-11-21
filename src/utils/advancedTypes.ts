/**
 * Advanced TypeScript types for i18nexus
 * Provides variable extraction, nested key support, and type-safe translations
 */

/**
 * Extract variables from a translation string
 * @example
 * ExtractVariables<"Hello {{name}}"> = "name"
 * ExtractVariables<"{{count}} items"> = "count"
 * ExtractVariables<"Hello {{first}} {{last}}"> = "first" | "last"
 */
export type ExtractVariables<T extends string> =
  T extends `${infer _Start}{{${infer Variable}}}${infer Rest}`
    ? Variable | ExtractVariables<Rest>
    : never;

/**
 * Check if a string has variables
 * @example
 * HasVariables<"Hello {{name}}"> = true
 * HasVariables<"Hello"> = false
 */
export type HasVariables<T extends string> = ExtractVariables<T> extends never
  ? false
  : true;

/**
 * Type-safe translation variables based on the translation string
 * If the string has variables, they are required
 * If the string has no variables, the variables parameter is optional
 *
 * @example
 * TranslationVariables<"Hello {{name}}"> = { name: string | number }
 * TranslationVariables<"Hello"> = Record<string, string | number> | undefined
 */
export type TranslationVariablesFor<T extends string> =
  HasVariables<T> extends true
    ? Record<ExtractVariables<T>, string | number>
    : Record<string, string | number> | undefined;

/**
 * Nested object key paths
 * @example
 * NestedKeyOf<{ common: { greeting: "Hello" } }> = "common.greeting"
 */
export type NestedKeyOf<T extends Record<string, any>> = {
  [K in keyof T & string]: T[K] extends Record<string, any>
    ? T[K] extends string
      ? K
      : `${K}.${NestedKeyOf<T[K]>}` | K
    : K;
}[keyof T & string];

/**
 * Get value type from nested key path
 * @example
 * GetNestedValue<{ common: { greeting: "Hello" } }, "common.greeting"> = "Hello"
 */
export type GetNestedValue<
  T extends Record<string, any>,
  K extends string,
> = K extends `${infer First}.${infer Rest}`
  ? First extends keyof T
    ? GetNestedValue<T[First], Rest>
    : never
  : K extends keyof T
    ? T[K]
    : never;

/**
 * Flatten nested object keys to dot notation
 * @example
 * FlattenKeys<{ common: { greeting: "Hello", farewell: "Bye" } }>
 * = { "common.greeting": "Hello", "common.farewell": "Bye" }
 */
export type FlattenKeys<
  T extends Record<string, any>,
  Prefix extends string = "",
> = {
  [K in keyof T & string]: T[K] extends Record<string, any>
    ? T[K] extends string
      ? { [P in `${Prefix}${K}`]: T[K] }
      : FlattenKeys<T[K], `${Prefix}${K}.`>
    : { [P in `${Prefix}${K}`]: T[K] };
}[keyof T & string];

/**
 * Merge union of objects
 */
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

/**
 * Extract all keys from nested translations
 */
export type ExtractNestedKeys<T extends Record<string, any>> = keyof T extends string
  ? T extends Record<string, Record<string, any>>
    ? keyof UnionToIntersection<FlattenKeys<T[keyof T]>> & string
    : keyof T & string
  : never;

/**
 * Type-safe translation function with variable inference
 */
export interface TypedTranslationFunction<
  Translations extends Record<string, string>,
> {
  <K extends keyof Translations & string>(
    key: K,
    ...args: HasVariables<Translations[K]> extends true
      ? [variables: TranslationVariablesFor<Translations[K]>]
      : [variables?: Record<string, string | number>]
  ): string;
}

/**
 * Validation result for translation completeness
 */
export interface ValidationResult {
  valid: boolean;
  missingKeys: {
    language: string;
    keys: string[];
  }[];
  extraKeys: {
    language: string;
    keys: string[];
  }[];
  allKeys: string[];
}

/**
 * Plural form categories based on Unicode CLDR
 */
export type PluralForm = "zero" | "one" | "two" | "few" | "many" | "other";

/**
 * Pluralization options
 */
export interface PluralOptions {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

/**
 * Count parameter for pluralization
 */
export type CountParam = { count: number };

/**
 * Check if translation key ends with _plural
 */
export type IsPluralKey<K extends string> = K extends `${infer _Base}_plural`
  ? true
  : false;

/**
 * Get base key from plural key
 * @example
 * GetPluralBase<"items_plural"> = "items"
 */
export type GetPluralBase<K extends string> = K extends `${infer Base}_plural`
  ? Base
  : K;
