/**
 * Tests for translation validation utilities (translationValidation.ts)
 */

import {
  validateTranslationCompleteness,
  validateNestedTranslationCompleteness,
  getTranslationStats,
  generateCoverageReport,
  assertTranslationCompleteness,
} from "../utils/translationValidation";

describe("Translation Validation", () => {
  describe("validateTranslationCompleteness", () => {
    it("should validate complete translations", () => {
      const translations = {
        en: { greeting: "Hello", farewell: "Goodbye" },
        ko: { greeting: "안녕하세요", farewell: "안녕히 가세요" },
      };

      const result = validateTranslationCompleteness(translations);

      expect(result.valid).toBe(true);
      expect(result.missingKeys).toHaveLength(0);
      expect(result.allKeys).toEqual(["farewell", "greeting"]);
    });

    it("should detect missing keys", () => {
      const translations = {
        en: { greeting: "Hello", farewell: "Goodbye", welcome: "Welcome" },
        ko: { greeting: "안녕하세요" },
        // ko missing: farewell, welcome
      };

      const result = validateTranslationCompleteness(translations);

      expect(result.valid).toBe(false);
      expect(result.missingKeys).toHaveLength(1);
      expect(result.missingKeys[0]).toEqual({
        language: "ko",
        keys: ["farewell", "welcome"],
      });
    });

    it("should detect missing keys in multiple languages", () => {
      const translations = {
        en: { greeting: "Hello", farewell: "Goodbye" },
        ko: { greeting: "안녕하세요" },
        ja: { farewell: "さようなら" },
      };

      const result = validateTranslationCompleteness(translations);

      expect(result.valid).toBe(false);
      expect(result.missingKeys).toHaveLength(2);

      const koMissing = result.missingKeys.find((m) => m.language === "ko");
      const jaMissing = result.missingKeys.find((m) => m.language === "ja");

      expect(koMissing?.keys).toContain("farewell");
      expect(jaMissing?.keys).toContain("greeting");
    });

    it("should handle empty translations", () => {
      const translations = {};

      const result = validateTranslationCompleteness(translations);

      expect(result.valid).toBe(true);
      expect(result.missingKeys).toHaveLength(0);
      expect(result.allKeys).toHaveLength(0);
    });

    it("should list all unique keys", () => {
      const translations = {
        en: { a: "A", b: "B", c: "C" },
        ko: { a: "A", b: "B" },
      };

      const result = validateTranslationCompleteness(translations);

      expect(result.allKeys).toEqual(["a", "b", "c"]);
    });
  });

  describe("validateNestedTranslationCompleteness", () => {
    it("should validate nested translations", () => {
      const translations = {
        en: {
          common: { greeting: "Hello", farewell: "Goodbye" },
          errors: { notFound: "Not Found" },
        },
        ko: {
          common: { greeting: "안녕하세요", farewell: "안녕히 가세요" },
          errors: { notFound: "찾을 수 없음" },
        },
      };

      const result = validateNestedTranslationCompleteness(translations);

      expect(result.valid).toBe(true);
      expect(result.missingKeys).toHaveLength(0);
    });

    it("should detect missing nested keys", () => {
      const translations = {
        en: {
          common: { greeting: "Hello" },
          errors: { notFound: "Not Found", unauthorized: "Unauthorized" },
        },
        ko: {
          common: { greeting: "안녕하세요" },
          // errors namespace completely missing
        },
      };

      const result = validateNestedTranslationCompleteness(translations);

      expect(result.valid).toBe(false);
      expect(result.missingKeys[0].language).toBe("ko");
      expect(result.missingKeys[0].keys).toContain("errors.notFound");
      expect(result.missingKeys[0].keys).toContain("errors.unauthorized");
    });

    it("should flatten nested keys correctly", () => {
      const translations = {
        en: {
          pages: {
            home: { title: "Home", subtitle: "Welcome" },
            about: { title: "About" },
          },
        },
        ko: {
          pages: {
            home: { title: "홈" },
            // missing: pages.home.subtitle, pages.about.title
          },
        },
      };

      const result = validateNestedTranslationCompleteness(translations);

      expect(result.valid).toBe(false);
      expect(result.allKeys).toContain("pages.home.title");
      expect(result.allKeys).toContain("pages.home.subtitle");
      expect(result.allKeys).toContain("pages.about.title");
    });
  });

  describe("getTranslationStats", () => {
    it("should calculate coverage percentages", () => {
      const translations = {
        en: { a: "A", b: "B", c: "C", d: "D" }, // 4 keys = 100%
        ko: { a: "A", b: "B" }, // 2 keys = 50%
        ja: { a: "A", b: "B", c: "C" }, // 3 keys = 75%
      };

      const stats = getTranslationStats(translations);

      expect(stats.en).toBe(100);
      expect(stats.ko).toBe(50);
      expect(stats.ja).toBe(75);
    });

    it("should handle 100% coverage", () => {
      const translations = {
        en: { greeting: "Hello", farewell: "Goodbye" },
        ko: { greeting: "안녕하세요", farewell: "안녕히 가세요" },
      };

      const stats = getTranslationStats(translations);

      expect(stats.en).toBe(100);
      expect(stats.ko).toBe(100);
    });

    it("should handle 0% coverage", () => {
      const translations = {
        en: { greeting: "Hello" },
        ko: {},
      };

      const stats = getTranslationStats(translations);

      expect(stats.en).toBe(100);
      expect(stats.ko).toBe(0);
    });

    it("should round to 2 decimal places", () => {
      const translations = {
        en: { a: "A", b: "B", c: "C" },
        ko: { a: "A" }, // 1/3 = 33.333...
      };

      const stats = getTranslationStats(translations);

      expect(stats.ko).toBe(33.33);
    });
  });

  describe("generateCoverageReport", () => {
    it("should generate report for complete translations", () => {
      const translations = {
        en: { greeting: "Hello", farewell: "Goodbye" },
        ko: { greeting: "안녕하세요", farewell: "안녕히 가세요" },
      };

      const report = generateCoverageReport(translations);

      expect(report).toContain("Total keys: 2");
      expect(report).toContain("Languages: en, ko");
      expect(report).toContain("en: 100%");
      expect(report).toContain("ko: 100%");
      expect(report).toContain("✅ All translations are complete!");
    });

    it("should generate report with missing translations", () => {
      const translations = {
        en: { greeting: "Hello", farewell: "Goodbye" },
        ko: { greeting: "안녕하세요" },
      };

      const report = generateCoverageReport(translations);

      expect(report).toContain("Total keys: 2");
      expect(report).toContain("ko: 50% (1/2)");
      expect(report).toContain("Missing translations:");
      expect(report).toContain("ko: farewell");
      expect(report).toContain("❌ Found 1 missing translations");
    });

    it("should list multiple missing keys", () => {
      const translations = {
        en: { a: "A", b: "B", c: "C" },
        ko: { a: "A" },
      };

      const report = generateCoverageReport(translations);

      expect(report).toContain("ko: b, c");
    });
  });

  describe("assertTranslationCompleteness", () => {
    it("should not throw for complete translations", () => {
      const translations = {
        en: { greeting: "Hello" },
        ko: { greeting: "안녕하세요" },
      };

      expect(() => {
        assertTranslationCompleteness(translations);
      }).not.toThrow();
    });

    it("should throw for incomplete translations", () => {
      const translations = {
        en: { greeting: "Hello", farewell: "Goodbye" },
        ko: { greeting: "안녕하세요" },
      };

      expect(() => {
        assertTranslationCompleteness(translations);
      }).toThrow("Translation validation failed!");
    });

    it("should include report in error message", () => {
      const translations = {
        en: { greeting: "Hello" },
        ko: {},
      };

      expect(() => {
        assertTranslationCompleteness(translations);
      }).toThrow(/Missing translations:/);
    });
  });

  describe("Edge Cases", () => {
    it("should handle single language", () => {
      const translations = {
        en: { greeting: "Hello" },
      };

      const result = validateTranslationCompleteness(translations);

      expect(result.valid).toBe(true);
      expect(result.allKeys).toEqual(["greeting"]);
    });

    it("should handle many languages", () => {
      const translations = {
        en: { greeting: "Hello" },
        ko: { greeting: "안녕하세요" },
        ja: { greeting: "こんにちは" },
        zh: { greeting: "你好" },
        fr: { greeting: "Bonjour" },
      };

      const result = validateTranslationCompleteness(translations);

      expect(result.valid).toBe(true);
      expect(Object.keys(translations)).toHaveLength(5);
    });

    it("should handle many keys", () => {
      const keys = Array.from({ length: 100 }, (_, i) => `key${i}`);
      const en = Object.fromEntries(keys.map((k) => [k, k]));
      const ko = Object.fromEntries(keys.slice(0, 50).map((k) => [k, k]));

      const translations = { en, ko };
      const result = validateTranslationCompleteness(translations);

      expect(result.valid).toBe(false);
      expect(result.allKeys).toHaveLength(100);
      expect(result.missingKeys[0].keys).toHaveLength(50);
    });
  });
});
