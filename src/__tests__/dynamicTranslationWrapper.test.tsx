/**
 * Tests for dynamic translation wrapper (dynamicTranslationWrapper.tsx)
 */

import React from "react";
import { renderHook } from "@testing-library/react";
import {
  useDynamicTranslation,
  mapDynamicTranslations,
  createDynamicTranslationMap,
  useDynamicTranslationMap,
  useDynamicTranslationValue,
} from "../utils/dynamicTranslationWrapper";
import { I18nProvider } from "../components/I18nProvider";

describe("Dynamic Translation Wrapper", () => {
  const translations = {
    en: {
      "errors.404": "Not Found",
      "errors.500": "Server Error",
      "errors.403": "Forbidden",
      "status.active": "Active",
      "status.inactive": "Inactive",
      "status.pending": "Pending",
      "api.success": "Success",
      "api.error": "Error",
    },
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <I18nProvider translations={translations}>{children}</I18nProvider>
  );

  describe("useDynamicTranslation", () => {
    it("should translate dynamic keys", () => {
      const { result } = renderHook(() => useDynamicTranslation(), { wrapper });

      expect(result.current("errors.404")).toBe("Not Found");
      expect(result.current("status.active")).toBe("Active");
    });

    it("should use prefix option", () => {
      const { result } = renderHook(
        () => useDynamicTranslation({ prefix: "errors" }),
        { wrapper },
      );

      expect(result.current("404")).toBe("Not Found");
      expect(result.current("500")).toBe("Server Error");
    });

    it("should use suffix option", () => {
      const customTranslations = {
        en: {
          "greeting_text": "Hello",
          "farewell_text": "Goodbye",
        },
      };

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider translations={customTranslations}>
          {children}
        </I18nProvider>
      );

      const { result } = renderHook(
        () => useDynamicTranslation({ suffix: "_text" }),
        { wrapper: customWrapper },
      );

      expect(result.current("greeting")).toBe("Hello");
      expect(result.current("farewell")).toBe("Goodbye");
    });

    it("should use fallback when key not found", () => {
      const { result } = renderHook(
        () =>
          useDynamicTranslation({
            fallback: "Translation missing",
            showWarnings: false,
          }),
        { wrapper },
      );

      expect(result.current("nonexistent.key")).toBe("Translation missing");
    });

    it("should apply transform function", () => {
      const customTranslations = {
        en: {
          GREETING: "Hello",
          FAREWELL: "Goodbye",
        },
      };

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider translations={customTranslations}>
          {children}
        </I18nProvider>
      );

      const { result } = renderHook(
        () =>
          useDynamicTranslation({
            transform: (key) => key.toUpperCase(),
          }),
        { wrapper: customWrapper },
      );

      expect(result.current("greeting")).toBe("Hello");
      expect(result.current("farewell")).toBe("Goodbye");
    });

    it("should merge default variables", () => {
      const customTranslations = {
        en: {
          message: "Hello {{name}} from {{app}}",
        },
      };

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider translations={customTranslations}>
          {children}
        </I18nProvider>
      );

      const { result } = renderHook(
        () =>
          useDynamicTranslation({
            defaultVariables: { app: "MyApp" },
          }),
        { wrapper: customWrapper },
      );

      expect(result.current("message", { name: "John" })).toBe(
        "Hello John from MyApp",
      );
    });
  });

  describe("hasKey", () => {
    it("should check if key exists", () => {
      const { result } = renderHook(() => useDynamicTranslation(), { wrapper });

      expect(result.current.hasKey("errors.404")).toBe(true);
      expect(result.current.hasKey("nonexistent")).toBe(false);
    });

    it("should check with prefix", () => {
      const { result } = renderHook(
        () => useDynamicTranslation({ prefix: "errors" }),
        { wrapper },
      );

      expect(result.current.hasKey("404")).toBe(true);
      expect(result.current.hasKey("999")).toBe(false);
    });
  });

  describe("getRaw", () => {
    it("should get raw translation", () => {
      const { result } = renderHook(() => useDynamicTranslation(), { wrapper });

      expect(result.current.getRaw("errors.404")).toBe("Not Found");
    });

    it("should get raw with prefix", () => {
      const { result } = renderHook(
        () => useDynamicTranslation({ prefix: "errors" }),
        { wrapper },
      );

      expect(result.current.getRaw("404")).toBe("Not Found");
    });
  });

  describe("scope", () => {
    it("should create scoped translator", () => {
      const { result } = renderHook(
        () => useDynamicTranslation({ prefix: "errors" }),
        { wrapper },
      );

      const scoped = result.current.scope("http");

      // errors.http.404
      const customTranslations = {
        en: {
          "errors.http.404": "HTTP Not Found",
        },
      };

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider translations={customTranslations}>
          {children}
        </I18nProvider>
      );

      const { result: scopedResult } = renderHook(
        () => useDynamicTranslation({ prefix: "errors" }),
        { wrapper: customWrapper },
      );

      const httpScoped = scopedResult.current.scope("http");
      expect(httpScoped("404")).toBe("HTTP Not Found");
    });
  });

  describe("mapDynamicTranslations", () => {
    it("should map array of keys to translations", () => {
      const { result } = renderHook(
        () => useDynamicTranslation({ prefix: "errors" }),
        { wrapper },
      );

      const errorCodes = ["404", "500", "403"];
      const messages = mapDynamicTranslations(errorCodes, result.current);

      expect(messages).toEqual(["Not Found", "Server Error", "Forbidden"]);
    });

    it("should handle variables in mapping", () => {
      const customTranslations = {
        en: {
          "error.404": "Error {{code}}: Not Found",
          "error.500": "Error {{code}}: Server Error",
        },
      };

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider translations={customTranslations}>
          {children}
        </I18nProvider>
      );

      const { result } = renderHook(
        () => useDynamicTranslation({ prefix: "error" }),
        { wrapper: customWrapper },
      );

      const codes = ["404", "500"];
      const messages = mapDynamicTranslations(codes, result.current, {
        code: "X",
      });

      expect(messages[0]).toContain("Error X");
    });
  });

  describe("createDynamicTranslationMap", () => {
    it("should create translation map", () => {
      const { result } = renderHook(
        () => useDynamicTranslation({ prefix: "status" }),
        { wrapper },
      );

      const statuses = ["active", "inactive", "pending"];
      const map = createDynamicTranslationMap(statuses, result.current);

      expect(map).toEqual({
        active: "Active",
        inactive: "Inactive",
        pending: "Pending",
      });
    });
  });

  describe("useDynamicTranslationMap", () => {
    it("should create map with hook", () => {
      const { result } = renderHook(
        () =>
          useDynamicTranslationMap(["active", "inactive", "pending"], {
            prefix: "status",
          }),
        { wrapper },
      );

      expect(result.current).toEqual({
        active: "Active",
        inactive: "Inactive",
        pending: "Pending",
      });
    });
  });

  describe("useDynamicTranslationValue", () => {
    it("should translate single value", () => {
      const { result } = renderHook(
        () =>
          useDynamicTranslationValue("errors.404", {
            fallback: "Unknown",
            showWarnings: false,
          }),
        { wrapper },
      );

      expect(result.current).toBe("Not Found");
    });

    it("should use fallback for missing key", () => {
      const { result } = renderHook(
        () =>
          useDynamicTranslationValue("nonexistent", {
            fallback: "Unknown",
            showWarnings: false,
          }),
        { wrapper },
      );

      expect(result.current).toBe("Unknown");
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

    it("should show warnings for missing keys when enabled", () => {
      const { result } = renderHook(
        () =>
          useDynamicTranslation({
            fallback: "Missing",
            showWarnings: true,
          }),
        { wrapper },
      );

      result.current("nonexistent.key");

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("nonexistent.key"),
      );
    });

    it("should not show warnings when disabled", () => {
      const { result } = renderHook(
        () =>
          useDynamicTranslation({
            fallback: "Missing",
            showWarnings: false,
          }),
        { wrapper },
      );

      result.current("nonexistent.key");

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
