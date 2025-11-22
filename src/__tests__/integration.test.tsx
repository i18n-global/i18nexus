/**
 * Integration tests for i18nexus
 * Tests the complete system working together
 */

import React from "react";
import { renderHook, act } from "@testing-library/react";
import { createI18nFromConfig } from "../utils/createFromConfig";
import { validateConfig } from "../utils/config";
import type { I18nexusConfig } from "../utils/config";

describe("Integration Tests", () => {
  describe("Config-based initialization with all features", () => {
    const translations = {
      en: {
        common: {
          greeting: "Hello {{name}}!",
          farewell: "Goodbye",
          save: "Save",
          cancel: "Cancel",
        },
        pages: {
          home: {
            title: "Home Page",
            // greeting will fallback to common.greeting
          },
        },
        errors: {
          notFound: "Not Found",
          // save will fallback to common.save
        },
        status: {
          active: "Active",
          inactive: "Inactive",
        },
      },
      ko: {
        common: {
          greeting: "{{name}}님 안녕하세요!",
          // farewell missing - will fallback to en
        },
        pages: {
          home: {
            title: "홈 페이지",
          },
        },
      },
    };

    const config: I18nexusConfig = {
      defaultLanguage: "en",
      languages: [
        { code: "en", name: "English" },
        { code: "ko", name: "한국어" },
      ],
      localesDir: "./locales",
      cookieName: "test-language",
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
        showWarnings: false,
      },
      validation: {
        enabled: true,
        minCoverage: 80,
        strict: false,
      },
    };

    it("should validate config", () => {
      expect(() => validateConfig(config)).not.toThrow();
    });

    it("should create i18n instance from config", () => {
      const i18n = createI18nFromConfig(config, translations);

      expect(i18n).toBeDefined();
      expect(i18n.Provider).toBeDefined();
      expect(i18n.useTranslation).toBeDefined();
    });

    it("should use namespace fallback", () => {
      const i18n = createI18nFromConfig(config, translations);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider>{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      // Direct hit
      expect(result.current.t("common.greeting", { name: "John" })).toBe(
        "Hello John!",
      );

      // Namespace fallback: pages.greeting -> common.greeting
      expect(result.current.t("pages.greeting", { name: "John" })).toBe(
        "Hello John!",
      );

      // Namespace fallback: errors.save -> common.save
      expect(result.current.t("errors.save")).toBe("Save");
    });

    it("should use language fallback", () => {
      const i18n = createI18nFromConfig(config, translations);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider initialLanguage="ko">{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      // Direct hit in Korean
      expect(result.current.t("common.greeting", { name: "홍길동" })).toBe(
        "홍길동님 안녕하세요!",
      );

      // Language fallback: ko.common.farewell -> en.common.farewell
      expect(result.current.t("common.farewell")).toBe("Goodbye");
    });

    it("should combine namespace and language fallback", () => {
      const i18n = createI18nFromConfig(config, translations);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider initialLanguage="ko">{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      // pages.save not in ko.pages -> common.save not in ko.common -> en.common.save
      expect(result.current.t("pages.save")).toBe("Save");
    });

    it("should handle language switching", async () => {
      const i18n = createI18nFromConfig(config, translations);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider>{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      // Initial language (en)
      expect(result.current.currentLanguage).toBe("en");
      expect(result.current.t("common.greeting", { name: "John" })).toBe(
        "Hello John!",
      );

      // TODO: Language switching test (requires useLanguageSwitcher)
    });
  });

  describe("Complete workflow", () => {
    it("should work with simple flat translations", () => {
      const simpleTranslations = {
        en: { greeting: "Hello", farewell: "Goodbye" },
        ko: { greeting: "안녕하세요", farewell: "안녕히 가세요" },
      };

      const simpleConfig: I18nexusConfig = {
        defaultLanguage: "en",
        languages: [
          { code: "en", name: "English" },
          { code: "ko", name: "한국어" },
        ],
        localesDir: "./locales",
        namespaces: {
          enabled: false,
        },
      };

      const i18n = createI18nFromConfig(simpleConfig, simpleTranslations);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider>{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      expect(result.current.t("greeting")).toBe("Hello");
      expect(result.current.t("farewell")).toBe("Goodbye");
    });

    it("should work with nested namespaces", () => {
      const nestedTranslations = {
        en: {
          common: { greeting: "Hello" },
          pages: {
            home: { title: "Home" },
            about: { title: "About" },
          },
        },
      };

      const nestedConfig: I18nexusConfig = {
        defaultLanguage: "en",
        languages: [{ code: "en", name: "English" }],
        localesDir: "./locales",
        namespaces: {
          enabled: true,
        },
      };

      const i18n = createI18nFromConfig(nestedConfig, nestedTranslations);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider>{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      expect(result.current.t("common.greeting")).toBe("Hello");
      expect(result.current.t("pages.home.title")).toBe("Home");
      expect(result.current.t("pages.about.title")).toBe("About");
    });
  });

  describe("Error handling", () => {
    it("should handle missing translation gracefully", () => {
      const translations = {
        en: { greeting: "Hello" },
      };

      const config: I18nexusConfig = {
        defaultLanguage: "en",
        languages: [{ code: "en", name: "English" }],
        localesDir: "./locales",
        fallback: {
          showWarnings: false,
        },
      };

      const i18n = createI18nFromConfig(config, translations);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider>{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      // Should return key if not found
      expect(result.current.t("nonexistent")).toBe("nonexistent");
    });

    it("should handle empty translations", () => {
      const translations = {
        en: {},
      };

      const config: I18nexusConfig = {
        defaultLanguage: "en",
        languages: [{ code: "en", name: "English" }],
        localesDir: "./locales",
      };

      const i18n = createI18nFromConfig(config, translations);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider>{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      expect(result.current.t("anything")).toBe("anything");
    });
  });

  describe("Performance", () => {
    it("should handle large number of keys", () => {
      const keys = Array.from({ length: 1000 }, (_, i) => `key${i}`);
      const en = Object.fromEntries(keys.map((k) => [k, `Value ${k}`]));

      const translations = { en };

      const config: I18nexusConfig = {
        defaultLanguage: "en",
        languages: [{ code: "en", name: "English" }],
        localesDir: "./locales",
      };

      const startTime = performance.now();
      const i18n = createI18nFromConfig(config, translations);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be fast

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider>{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      expect(result.current.t("key0")).toBe("Value key0");
      expect(result.current.t("key999")).toBe("Value key999");
    });

    it("should handle deep nesting", () => {
      const translations = {
        en: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    deepValue: "Found it!",
                  },
                },
              },
            },
          },
        },
      };

      const config: I18nexusConfig = {
        defaultLanguage: "en",
        languages: [{ code: "en", name: "English" }],
        localesDir: "./locales",
        namespaces: {
          enabled: true,
        },
      };

      const i18n = createI18nFromConfig(config, translations);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider>{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      expect(
        result.current.t("level1.level2.level3.level4.level5.deepValue"),
      ).toBe("Found it!");
    });
  });
});
