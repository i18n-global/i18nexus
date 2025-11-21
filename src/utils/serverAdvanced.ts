/**
 * Advanced server-side utilities with TypeScript type inference
 * Provides type-safe server-side translations with automatic key inference
 */

import {
  createServerTranslation,
  getServerLanguage,
  getTranslations,
  ServerTranslationVariables,
} from "./server";
import { ExtractI18nKeys } from "../components/I18nProvider";
import {
  ExtractVariables,
  HasVariables,
  TranslationVariablesFor,
} from "./advancedTypes";

/**
 * Type-safe server translation function with variable inference
 */
interface TypedServerTranslationFunction<
  Translations extends Record<string, string>,
> {
  <K extends keyof Translations & string>(
    key: K,
    ...args: HasVariables<Translations[K]> extends true
      ? [
          variables: TranslationVariablesFor<Translations[K]> &
            Record<string, string | number>,
        ]
      : [variables?: Record<string, string | number>]
  ): string;
}

/**
 * Create type-safe server-side i18n instance
 *
 * @example
 * ```typescript
 * const translations = {
 *   en: {
 *     greeting: "Hello {{name}}!",
 *     farewell: "Goodbye"
 *   },
 *   ko: {
 *     greeting: "안녕하세요 {{name}}님!",
 *     farewell: "안녕히 가세요"
 *   }
 * };
 *
 * const serverI18n = createServerI18nTyped(translations);
 *
 * export default async function ServerPage() {
 *   const headersList = await headers();
 *   const { t, language } = serverI18n.create(headersList);
 *
 *   // ✅ Type-safe with variable inference
 *   t("greeting", { name: "John" });  // Required!
 *
 *   // ❌ TypeScript error - missing variable
 *   t("greeting");
 *
 *   // ✅ No variables needed
 *   t("farewell");
 * }
 * ```
 */
export function createServerI18nTyped<
  TTranslations extends Record<string, Record<string, string>>,
>(translations: TTranslations) {
  type Keys = ExtractI18nKeys<TTranslations>;
  type Languages = keyof TTranslations & string;
  type FirstLanguage = TTranslations[Languages];

  return {
    /**
     * Create server-side translation context
     */
    create: (
      headers: Headers,
      options?: {
        cookieName?: string;
        defaultLanguage?: Languages;
        availableLanguages?: Languages[];
      },
    ) => {
      const language = getServerLanguage(headers, {
        cookieName: options?.cookieName,
        defaultLanguage: (options?.defaultLanguage || "en") as string,
        availableLanguages: options?.availableLanguages as string[],
      });

      const originalT = createServerTranslation(
        language,
        translations as Record<string, Record<string, string>>,
      );

      // Type-safe wrapper
      const t = ((key: Keys, variables?: ServerTranslationVariables) => {
        return originalT(key as string, variables);
      }) as TypedServerTranslationFunction<FirstLanguage>;

      const dict = getTranslations(
        language,
        translations as Record<string, Record<string, string>>,
      );

      return {
        t,
        language: language as Languages,
        dict,
        translations,
      };
    },

    /**
     * Create async server-side translation context (auto-loads headers)
     */
    createAsync: async (options?: {
      cookieName?: string;
      defaultLanguage?: Languages;
      availableLanguages?: Languages[];
    }) => {
      // Auto-detect headers in Next.js
      let headersInstance: Headers;
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { headers } = await import("next/headers");
        headersInstance = await headers();
      } catch {
        headersInstance = new Headers();
      }

      return {
        create: (headersOverride?: Headers) =>
          module.exports.create(headersOverride || headersInstance, options),
      }.create();
    },

    translations,
  };
}

/**
 * Simplified typed server translation creation
 *
 * @example
 * ```typescript
 * import { createTypedServerTranslation } from 'i18nexus/server';
 *
 * const translations = {
 *   en: { greeting: "Hello {{name}}" }
 * };
 *
 * export default async function Page() {
 *   const { t } = await createTypedServerTranslation(translations);
 *
 *   return <h1>{t("greeting", { name: "World" })}</h1>;
 * }
 * ```
 */
export async function createTypedServerTranslation<
  TTranslations extends Record<string, Record<string, string>>,
>(
  translations: TTranslations,
  options?: {
    cookieName?: string;
    defaultLanguage?: keyof TTranslations & string;
    availableLanguages?: (keyof TTranslations & string)[];
  },
) {
  const serverI18n = createServerI18nTyped(translations);

  // Auto-detect headers
  let headersInstance: Headers;
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { headers } = await import("next/headers");
    headersInstance = await headers();
  } catch {
    headersInstance = new Headers();
  }

  return serverI18n.create(headersInstance, options);
}
