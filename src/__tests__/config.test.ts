/**
 * Tests for configuration management (config.ts)
 */

import {
  validateConfig,
  toNamespaceFallbackConfig,
  toDynamicTranslationOptions,
  isValidConfig,
  defaultConfig,
} from "../utils/config";
import type { I18nexusConfig } from "../utils/config";

describe("Config Validation", () => {
  describe("validateConfig", () => {
    it("should validate a minimal valid config", () => {
      const config: Partial<I18nexusConfig> = {
        languages: [
          { code: "en", name: "English" },
          { code: "ko", name: "Korean" },
        ],
      };

      const result = validateConfig(config);
      expect(result.defaultLanguage).toBe("en");
      expect(result.languages).toHaveLength(2);
    });

    it("should use provided defaultLanguage", () => {
      const config: Partial<I18nexusConfig> = {
        defaultLanguage: "ko",
        languages: [
          { code: "en", name: "English" },
          { code: "ko", name: "Korean" },
        ],
      };

      const result = validateConfig(config);
      expect(result.defaultLanguage).toBe("ko");
    });

    it("should throw error if no languages provided", () => {
      const config: Partial<I18nexusConfig> = {
        languages: [],
      };

      expect(() => validateConfig(config)).toThrow(
        "i18nexus config must specify at least one language",
      );
    });

    it("should throw error if defaultLanguage not in languages list", () => {
      const config: Partial<I18nexusConfig> = {
        defaultLanguage: "fr",
        languages: [
          { code: "en", name: "English" },
          { code: "ko", name: "Korean" },
        ],
      };

      expect(() => validateConfig(config)).toThrow(
        'Default language "fr" not found in languages list',
      );
    });

    it("should validate fallback language chains", () => {
      const config: Partial<I18nexusConfig> = {
        languages: [
          { code: "en", name: "English" },
          { code: "ko", name: "Korean" },
        ],
        fallback: {
          languages: {
            ko: ["en"],
          },
        },
      };

      const result = validateConfig(config);
      expect(result.fallback?.languages).toEqual({ ko: ["en"] });
    });

    it("should throw error if fallback language not in languages list", () => {
      const config: Partial<I18nexusConfig> = {
        languages: [
          { code: "en", name: "English" },
          { code: "ko", name: "Korean" },
        ],
        fallback: {
          languages: {
            ko: ["ja"], // ja not in languages list
          },
        },
      };

      expect(() => validateConfig(config)).toThrow(
        'Fallback language "ja" for "ko" not found in languages list',
      );
    });

    it("should set default values", () => {
      const config: Partial<I18nexusConfig> = {
        languages: [{ code: "en", name: "English" }],
      };

      const result = validateConfig(config);
      expect(result.localesDir).toBe("./locales");
      expect(result.cookieName).toBe("i18n-language");
      expect(result.namespaces?.enabled).toBe(false);
    });
  });

  describe("toNamespaceFallbackConfig", () => {
    it("should convert config to namespace fallback config", () => {
      const config: I18nexusConfig = {
        ...defaultConfig,
        languages: [{ code: "en", name: "English" }],
        namespaces: {
          enabled: true,
          defaultNamespace: "common",
          fallbackChain: {
            pages: ["common"],
            errors: ["common"],
          },
        },
        fallback: {
          languages: {
            ko: ["en"],
          },
          showWarnings: true,
        },
      };

      const result = toNamespaceFallbackConfig(config);

      expect(result.defaultNamespace).toBe("common");
      expect(result.fallbackChain).toEqual({
        pages: ["common"],
        errors: ["common"],
      });
      expect(result.languageFallback).toEqual({ ko: ["en"] });
      expect(result.showWarnings).toBe(true);
    });

    it("should handle missing namespace config", () => {
      const config: I18nexusConfig = {
        ...defaultConfig,
        languages: [{ code: "en", name: "English" }],
      };

      const result = toNamespaceFallbackConfig(config);

      expect(result.defaultNamespace).toBeUndefined();
      expect(result.fallbackChain).toEqual({});
      expect(result.languageFallback).toEqual({});
    });
  });

  describe("toDynamicTranslationOptions", () => {
    it("should convert config to dynamic translation options", () => {
      const config: I18nexusConfig = {
        ...defaultConfig,
        languages: [{ code: "en", name: "English" }],
        dynamic: {
          prefix: "api",
          suffix: "_text",
          fallback: "Missing translation",
          showWarnings: false,
        },
      };

      const result = toDynamicTranslationOptions(config);

      expect(result.prefix).toBe("api");
      expect(result.suffix).toBe("_text");
      expect(result.fallback).toBe("Missing translation");
      expect(result.showWarnings).toBe(false);
    });
  });

  describe("isValidConfig", () => {
    it("should return true for valid config", () => {
      const config: Partial<I18nexusConfig> = {
        languages: [{ code: "en", name: "English" }],
      };

      expect(isValidConfig(config)).toBe(true);
    });

    it("should return false for invalid config", () => {
      const config = {
        languages: [],
      };

      expect(isValidConfig(config)).toBe(false);
    });

    it("should return false for non-object", () => {
      expect(isValidConfig(null)).toBe(false);
      expect(isValidConfig("string")).toBe(false);
      expect(isValidConfig(123)).toBe(false);
    });
  });

  describe("defaultConfig", () => {
    it("should have required fields", () => {
      expect(defaultConfig.defaultLanguage).toBe("en");
      expect(defaultConfig.languages).toHaveLength(1);
      expect(defaultConfig.localesDir).toBe("./locales");
      expect(defaultConfig.cookieName).toBe("i18n-language");
    });

    it("should have namespace config", () => {
      expect(defaultConfig.namespaces).toBeDefined();
      expect(defaultConfig.namespaces?.enabled).toBe(false);
      expect(defaultConfig.namespaces?.fallbackChain).toEqual({});
    });

    it("should have fallback config", () => {
      expect(defaultConfig.fallback).toBeDefined();
      expect(defaultConfig.fallback?.languages).toEqual({});
      expect(defaultConfig.fallback?.showWarnings).toBe(true);
    });
  });
});
