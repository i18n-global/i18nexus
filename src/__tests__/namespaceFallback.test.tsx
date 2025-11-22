/**
 * Tests for namespace fallback system (namespaceFallback.tsx)
 */

import React from "react";
import { renderHook } from "@testing-library/react";
import { createI18nWithFallback, createScopedTranslation } from "../utils/namespaceFallback";

describe("Namespace Fallback", () => {
  const translations = {
    en: {
      common: {
        greeting: "Hello",
        farewell: "Goodbye",
        save: "Save",
        cancel: "Cancel",
      },
      pages: {
        home: {
          title: "Home Page",
        },
        // greeting, farewell not defined - should fallback to common
      },
      errors: {
        notFound: "Not Found",
        // save, cancel not defined - should fallback to common
      },
    },
    ko: {
      common: {
        greeting: "안녕하세요",
        // farewell not defined - should fallback to en
      },
      pages: {
        home: {
          title: "홈 페이지",
        },
      },
    },
  };

  describe("createI18nWithFallback", () => {
    it("should create i18n instance with fallback config", () => {
      const i18n = createI18nWithFallback(translations, {
        defaultNamespace: "common",
        fallbackChain: {
          pages: ["common"],
          errors: ["common"],
        },
        languageFallback: {
          ko: ["en"],
        },
      });

      expect(i18n).toBeDefined();
      expect(i18n.Provider).toBeDefined();
      expect(i18n.useTranslation).toBeDefined();
      expect(i18n.config).toBeDefined();
    });

    it("should flatten nested translations", () => {
      const i18n = createI18nWithFallback(translations);

      expect(i18n.flattenedTranslations).toBeDefined();
      expect(i18n.flattenedTranslations.en).toHaveProperty("common.greeting");
      expect(i18n.flattenedTranslations.en).toHaveProperty("pages.home.title");
    });
  });

  describe("Translation with Fallback", () => {
    it("should use direct hit when available", () => {
      const i18n = createI18nWithFallback(translations, {
        fallbackChain: {
          pages: ["common"],
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider>{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      expect(result.current.t("common.greeting")).toBe("Hello");
      expect(result.current.t("pages.home.title")).toBe("Home Page");
    });

    it("should fallback to namespace chain", () => {
      const i18n = createI18nWithFallback(translations, {
        fallbackChain: {
          pages: ["common"],
          errors: ["common"],
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider>{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      // pages.greeting should fallback to common.greeting
      expect(result.current.t("pages.greeting")).toBe("Hello");

      // errors.save should fallback to common.save
      expect(result.current.t("errors.save")).toBe("Save");
    });

    it("should fallback to language chain", () => {
      const i18n = createI18nWithFallback(translations, {
        languageFallback: {
          ko: ["en"],
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider initialLanguage="ko">{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      // ko.common.farewell not defined, should use en.common.farewell
      expect(result.current.t("common.farewell")).toBe("Goodbye");
    });

    it("should use default namespace when specified", () => {
      const i18n = createI18nWithFallback(translations, {
        defaultNamespace: "common",
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider>{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      // Should try "common.greeting" when "greeting" not found directly
      expect(result.current.t("greeting")).toBe("Hello");
    });
  });

  describe("hasKey", () => {
    it("should check if key exists", () => {
      const i18n = createI18nWithFallback(translations);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider>{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      expect(result.current.hasKey("common.greeting")).toBe(true);
      expect(result.current.hasKey("common.nonexistent")).toBe(false);
    });

    it("should check with fallback", () => {
      const i18n = createI18nWithFallback(translations, {
        fallbackChain: {
          pages: ["common"],
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider>{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      // pages.greeting exists via fallback
      expect(result.current.hasKey("pages.greeting")).toBe(true);
    });
  });

  describe("getKeys", () => {
    it("should return all available keys", () => {
      const i18n = createI18nWithFallback(translations);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider>{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      const keys = result.current.getKeys();
      expect(keys).toContain("common.greeting");
      expect(keys).toContain("pages.home.title");
      expect(keys).toContain("errors.notFound");
    });
  });

  describe("createScopedTranslation", () => {
    it("should create scoped translation function", () => {
      const mockT = jest.fn((key: string) => key);
      const tScoped = createScopedTranslation(mockT, "errors");

      tScoped("notFound");
      expect(mockT).toHaveBeenCalledWith("errors.notFound");
    });

    it("should pass variables through", () => {
      const mockT = jest.fn((key: string, vars: any) => key);
      const tScoped = createScopedTranslation(mockT, "errors");

      tScoped("notFound", { code: 404 });
      expect(mockT).toHaveBeenCalledWith("errors.notFound", { code: 404 });
    });

    it("should handle nested namespaces", () => {
      const mockT = jest.fn((key: string) => key);
      const tScoped = createScopedTranslation(mockT, "api.errors");

      tScoped("notFound");
      expect(mockT).toHaveBeenCalledWith("api.errors.notFound");
    });
  });

  describe("Warnings", () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it("should show warnings when enabled", () => {
      const i18n = createI18nWithFallback(translations, {
        fallbackChain: {
          pages: ["common"],
        },
        showWarnings: true,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider>{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      result.current.t("pages.greeting"); // Uses fallback

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("pages.greeting"),
      );
    });

    it("should not show warnings when disabled", () => {
      const i18n = createI18nWithFallback(translations, {
        fallbackChain: {
          pages: ["common"],
        },
        showWarnings: false,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <i18n.Provider>{children}</i18n.Provider>
      );

      const { result } = renderHook(() => i18n.useTranslation(), { wrapper });

      result.current.t("pages.greeting");

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
