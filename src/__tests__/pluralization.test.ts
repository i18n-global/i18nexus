/**
 * Tests for pluralization utilities (pluralization.ts)
 */

import {
  getPluralForm,
  selectPlural,
  createPluralTranslation,
  interpolatePlural,
  pluralWithInterpolation,
  pluralize,
  getSupportedPluralForms,
} from "../utils/pluralization";
import type { PluralOptions } from "../utils/advancedTypes";

describe("Pluralization", () => {
  describe("getPluralForm", () => {
    describe("English", () => {
      it("should return 'one' for 1", () => {
        expect(getPluralForm(1, "en")).toBe("one");
      });

      it("should return 'other' for 0", () => {
        expect(getPluralForm(0, "en")).toBe("other");
      });

      it("should return 'other' for 2+", () => {
        expect(getPluralForm(2, "en")).toBe("other");
        expect(getPluralForm(5, "en")).toBe("other");
        expect(getPluralForm(100, "en")).toBe("other");
      });

      it("should handle negative numbers", () => {
        expect(getPluralForm(-1, "en")).toBe("one");
        expect(getPluralForm(-2, "en")).toBe("other");
      });
    });

    describe("Korean", () => {
      it("should always return 'other' (no plural distinction)", () => {
        expect(getPluralForm(0, "ko")).toBe("other");
        expect(getPluralForm(1, "ko")).toBe("other");
        expect(getPluralForm(2, "ko")).toBe("other");
        expect(getPluralForm(100, "ko")).toBe("other");
      });
    });

    describe("Russian", () => {
      it("should return 'one' for numbers ending in 1 (except 11)", () => {
        expect(getPluralForm(1, "ru")).toBe("one");
        expect(getPluralForm(21, "ru")).toBe("one");
        expect(getPluralForm(101, "ru")).toBe("one");
        expect(getPluralForm(11, "ru")).toBe("many"); // exception
      });

      it("should return 'few' for 2-4 (except 12-14)", () => {
        expect(getPluralForm(2, "ru")).toBe("few");
        expect(getPluralForm(3, "ru")).toBe("few");
        expect(getPluralForm(4, "ru")).toBe("few");
        expect(getPluralForm(22, "ru")).toBe("few");
        expect(getPluralForm(12, "ru")).toBe("many"); // exception
      });

      it("should return 'many' for others", () => {
        expect(getPluralForm(0, "ru")).toBe("many");
        expect(getPluralForm(5, "ru")).toBe("many");
        expect(getPluralForm(11, "ru")).toBe("many");
        expect(getPluralForm(100, "ru")).toBe("many");
      });
    });

    describe("Arabic", () => {
      it("should return 'zero' for 0", () => {
        expect(getPluralForm(0, "ar")).toBe("zero");
      });

      it("should return 'one' for 1", () => {
        expect(getPluralForm(1, "ar")).toBe("one");
      });

      it("should return 'two' for 2", () => {
        expect(getPluralForm(2, "ar")).toBe("two");
      });

      it("should return 'few' for 3-10", () => {
        expect(getPluralForm(3, "ar")).toBe("few");
        expect(getPluralForm(10, "ar")).toBe("few");
      });

      it("should return 'many' for 11-99", () => {
        expect(getPluralForm(11, "ar")).toBe("many");
        expect(getPluralForm(99, "ar")).toBe("many");
      });

      it("should return 'other' for 100+", () => {
        expect(getPluralForm(100, "ar")).toBe("other");
        expect(getPluralForm(200, "ar")).toBe("other");
      });
    });

    describe("French", () => {
      it("should return 'one' for 0 and 1", () => {
        expect(getPluralForm(0, "fr")).toBe("one");
        expect(getPluralForm(1, "fr")).toBe("one");
      });

      it("should return 'other' for 2+", () => {
        expect(getPluralForm(2, "fr")).toBe("other");
        expect(getPluralForm(5, "fr")).toBe("other");
      });
    });
  });

  describe("selectPlural", () => {
    it("should select correct form for English", () => {
      const options: PluralOptions = {
        zero: "no items",
        one: "one item",
        other: "{{count}} items",
      };

      // English: 0 returns 'other' form, not 'zero'
      expect(selectPlural(0, options, "en")).toBe("0 items");
      expect(selectPlural(1, options, "en")).toBe("one item");
      expect(selectPlural(5, options, "en")).toBe("5 items");
    });

    it("should interpolate {{count}} placeholder", () => {
      const options: PluralOptions = {
        one: "{{count}} item",
        other: "{{count}} items",
      };

      expect(selectPlural(1, options, "en")).toBe("1 item");
      expect(selectPlural(5, options, "en")).toBe("5 items");
    });

    it("should fallback to 'other' when form not available", () => {
      const options: PluralOptions = {
        other: "{{count}} items",
      };

      expect(selectPlural(0, options, "en")).toBe("0 items");
      expect(selectPlural(1, options, "en")).toBe("1 items");
    });

    it("should handle Korean (only 'other' form)", () => {
      const options: PluralOptions = {
        other: "{{count}}개",
      };

      expect(selectPlural(0, options, "ko")).toBe("0개");
      expect(selectPlural(1, options, "ko")).toBe("1개");
      expect(selectPlural(5, options, "ko")).toBe("5개");
    });

    it("should handle Russian complex forms", () => {
      const options: PluralOptions = {
        one: "{{count}} товар",
        few: "{{count}} товара",
        many: "{{count}} товаров",
        other: "{{count}} товаров",
      };

      expect(selectPlural(1, options, "ru")).toBe("1 товар");
      expect(selectPlural(2, options, "ru")).toBe("2 товара");
        expect(selectPlural(5, options, "ru")).toBe("5 товаров");
      expect(selectPlural(21, options, "ru")).toBe("21 товар");
    });
  });

  describe("createPluralTranslation", () => {
    const translations = {
      items_plural: {
        zero: "no items",
        one: "one item",
        other: "{{count}} items",
      },
      users_plural: {
        one: "{{count}} user",
        other: "{{count}} users",
      },
      simple: "Not plural",
    };

    it("should translate with pluralization", () => {
      const plural = createPluralTranslation("en", translations);

      // English: 0 uses 'other' form
      expect(plural("items", 0)).toBe("0 items");
      expect(plural("items", 1)).toBe("one item");
      expect(plural("items", 5)).toBe("5 items");
    });

    it("should handle multiple plural keys", () => {
      const plural = createPluralTranslation("en", translations);

      expect(plural("users", 1)).toBe("1 user");
      expect(plural("users", 10)).toBe("10 users");
    });

    it("should fallback to regular translation if no plural", () => {
      const plural = createPluralTranslation("en", translations);

      expect(plural("simple", 1)).toBe("Not plural");
    });

    it("should return key if translation not found", () => {
      const plural = createPluralTranslation("en", translations);

      expect(plural("nonexistent", 1)).toBe("nonexistent");
    });
  });

  describe("interpolatePlural", () => {
    it("should interpolate variables", () => {
      const text = "Hello {{name}}, you have {{count}} messages";
      const result = interpolatePlural(text, { name: "John", count: 5 });

      expect(result).toBe("Hello John, you have 5 messages");
    });

    it("should handle missing variables", () => {
      const text = "Hello {{name}}, {{missing}}";
      const result = interpolatePlural(text, { name: "John" });

      expect(result).toBe("Hello John, {{missing}}");
    });

    it("should handle no variables", () => {
      const text = "No variables here";
      const result = interpolatePlural(text, {});

      expect(result).toBe("No variables here");
    });
  });

  describe("pluralWithInterpolation", () => {
    it("should combine pluralization and interpolation", () => {
      const options: PluralOptions = {
        zero: "No items in {{location}}",
        one: "One item in {{location}}",
        other: "{{count}} items in {{location}}",
      };

      // English: 0 uses 'other' form
      expect(pluralWithInterpolation(0, options, "en", { location: "cart" })).toBe(
        "0 items in cart",
      );
      expect(pluralWithInterpolation(1, options, "en", { location: "cart" })).toBe(
        "One item in cart",
      );
      expect(pluralWithInterpolation(5, options, "en", { location: "cart" })).toBe(
        "5 items in cart",
      );
    });

    it("should auto-inject count variable", () => {
      const options: PluralOptions = {
        one: "{{count}} item",
        other: "{{count}} items",
      };

      expect(pluralWithInterpolation(1, options, "en")).toBe("1 item");
      expect(pluralWithInterpolation(5, options, "en")).toBe("5 items");
    });
  });

  describe("pluralize", () => {
    it("should return singular for 1", () => {
      expect(pluralize(1, "item")).toBe("item");
      expect(pluralize(-1, "item")).toBe("item");
    });

    it("should return plural for 0", () => {
      expect(pluralize(0, "item")).toBe("items");
    });

    it("should return plural for 2+", () => {
      expect(pluralize(2, "item")).toBe("items");
      expect(pluralize(100, "item")).toBe("items");
    });

    it("should use custom plural form", () => {
      expect(pluralize(0, "box", "boxes")).toBe("boxes");
      expect(pluralize(2, "box", "boxes")).toBe("boxes");
      expect(pluralize(1, "box", "boxes")).toBe("box");
    });

    it("should handle irregular plurals", () => {
      expect(pluralize(0, "child", "children")).toBe("children");
      expect(pluralize(1, "child", "children")).toBe("child");
      expect(pluralize(2, "child", "children")).toBe("children");
    });
  });

  describe("getSupportedPluralForms", () => {
    it("should return forms for English", () => {
      expect(getSupportedPluralForms("en")).toEqual(["one", "other"]);
    });

    it("should return forms for Korean", () => {
      expect(getSupportedPluralForms("ko")).toEqual(["other"]);
    });

    it("should return forms for Russian", () => {
      expect(getSupportedPluralForms("ru")).toEqual(["one", "few", "many"]);
    });

    it("should return forms for Arabic", () => {
      expect(getSupportedPluralForms("ar")).toEqual([
        "zero",
        "one",
        "two",
        "few",
        "many",
        "other",
      ]);
    });

    it("should return default for unknown language", () => {
      expect(getSupportedPluralForms("unknown")).toEqual(["one", "other"]);
    });
  });
});
