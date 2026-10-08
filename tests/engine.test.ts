import { afterEach, describe, expect, it } from "vitest";
import { getDataset } from "../src/data";
import {
  approximationNote,
  compareSizes,
  convertSize,
  findSizeFromMeasurements,
  formatMeasurement,
  formatRange,
} from "../src/lib/engine";
import type { SizeRow } from "../src/types";

describe("formatRange", () => {
  it.each([
    [{ min: 96, max: 100 }, "cm", "96–100 cm"],
    [{ min: 81, max: 86 }, "cm", "81–86 cm"],
    [{ min: 82.4, max: 87.6 }, "cm", "82–88 cm"],
    [{ min: 0, max: 0 }, "cm", "0–0 cm"],
    [{ min: 96, max: 100 }, "in", "38–39.5 in"],
    [{ min: 81, max: 86 }, "in", "32–34 in"],
    [{ min: 2.54, max: 3.81 }, "in", "1–1.5 in"],
    [undefined, "cm", "—"],
    [undefined, "in", "—"],
  ] as const)("formats %s in %s as %s", (range, unit, expected) => {
    expect(formatRange(range, unit)).toBe(expected);
  });

  it.each([
    [96, "cm", "96 cm"],
    [81, "cm", "81 cm"],
    [96, "in", "38 in"],
    [100, "in", "39.5 in"],
    [undefined, "cm", "—"],
  ] as const)("formats a single value", (value, unit, expected) => {
    expect(formatMeasurement(value, unit)).toBe(expected);
  });
});

describe("convertSize", () => {
  it.each([
    ["US", "M", "EU", "48-50", "men", "tops"],
    ["US", "M", "UK", "38", "men", "tops"],
    ["US", "M", "JP", "L", "men", "tops"],
    ["US", "M", "CN", "175/92A", "men", "tops"],
    ["US", "M", "KR", "100", "men", "tops"],
    ["US", "M", "AU", "M", "men", "tops"],
    ["INTL", "L", "US", "L", "men", "tops"],
    ["US", "8", "EU", "40-42", "women", "dresses"],
    ["US", "4-6", "UK", "8-10", "women", "dresses"],
    ["EU", "40-42", "US", "8-10", "women", "tops"],
    ["US", "32", "EU", "46-48", "men", "jeans"],
    ["US", "8-10", "AU", "12-14", "women", "pants"],
  ] as const)("maps %s %s to %s", (from, size, to, expected, gender, category) => {
    const result = convertSize({ from, size, to, gender, category });
    expect(result.ok).toBe(true);
    expect(result.targetSize).toBe(expected);
    expect(result.row).not.toBeNull();
  });

  it("normalizes system prefixes, spaces, case, and unicode dashes", () => {
    const prefixed = convertSize({ gender: "men", category: "tops", from: "US", size: "  us m ", to: "EU" });
    expect(prefixed.targetSize).toBe("48-50");
    const dashed = convertSize({ gender: "women", category: "dresses", from: "EU", size: "40–42", to: "US" });
    expect(dashed.targetSize).toBe("8-10");
  });

  it("returns every candidate when a numeric size lands in overlapping ranges", () => {
    const dataset = getDataset("women", "tops")!;
    const xs = dataset.rows[0];
    const original = xs.sizes.US;
    xs.sizes.US = "4-6";
    try {
      const result = convertSize({ gender: "women", category: "tops", from: "US", size: "4", to: "EU" });
      expect(result.candidates).toHaveLength(2);
      expect(result.targetSize).toBe("32-34");
    } finally {
      xs.sizes.US = original;
    }
  });

  it("reports an unknown source size without fabricating a target", () => {
    const result = convertSize({ gender: "men", category: "tops", from: "US", size: "tiny", to: "EU" });
    expect(result.ok).toBe(false);
    expect(result.targetSize).toBeNull();
    expect(result.message).toContain("couldn't find");
  });

  it("explains a missing system mapping", () => {
    const result = convertSize({ gender: "women", category: "jeans", from: "INTL", size: "XXXL", to: "CN" });
    expect(result.ok).toBe(false);
    expect(result.targetSize).toBeNull();
    expect(result.message).toContain("no CN mapping");
    expect(result.row?.body.waist).toBeDefined();
  });

  it("exposes all candidates and uses a non-exact confidence for numeric ranges", () => {
    const result = convertSize({ gender: "men", category: "tops", from: "US", size: "M", to: "EU" });
    expect(result.confidence).toBe("range");
    expect(result.message).toBe(approximationNote);
  });
});

describe("findSizeFromMeasurements", () => {
  it.each([
    [82, 68, "XS"],
    [87, 73, "XS"],
    [88, 74, "S"],
    [93, 79, "S"],
    [94, 80, "M"],
    [99, 85, "M"],
    [100, 86, "L"],
    [105, 91, "L"],
  ])("matches men's chest/waist boundary %s/%s to %s", (chest, waist, expected) => {
    const result = findSizeFromMeasurements({
      gender: "men",
      category: "tops",
      unit: "cm",
      measurements: { chest, waist },
    });
    expect(result.ok).toBe(true);
    expect(result.row?.intl).toBe(expected);
  });

  it("converts inch inputs to centimeters before matching", () => {
    const result = findSizeFromMeasurements({
      gender: "men",
      category: "tops",
      unit: "in",
      measurements: { chest: 38, waist: 32 },
    });
    expect(result.row?.intl).toBe("M");
    expect(result.recommendations.EU).toBe("48-50");
  });

  it("returns sizes for every mapped system", () => {
    const result = findSizeFromMeasurements({
      gender: "women",
      category: "dresses",
      unit: "cm",
      measurements: { bust: 92, waist: 75, hip: 99 },
    });
    expect(result.ok).toBe(true);
    expect(result.recommendations.US).toBe("8-10");
    expect(result.recommendations.INTL).toBe("M");
    expect(result.recommendations.JP).toBeDefined();
  });

  it("returns an inline error for each missing required measurement", () => {
    const result = findSizeFromMeasurements({
      gender: "women",
      category: "dresses",
      unit: "cm",
      measurements: { bust: 90 },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.waist).toBeTruthy();
    expect(result.errors.hip).toBeTruthy();
  });

  it.each([0, -2, 251, Number.NaN, Number.POSITIVE_INFINITY])("rejects an implausible required measurement: %s", (value) => {
    const result = findSizeFromMeasurements({
      gender: "men",
      category: "tops",
      unit: "cm",
      measurements: { chest: value, waist: 80 },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.chest).toBeTruthy();
  });

  it("rejects a non-sensible optional inseam", () => {
    const result = findSizeFromMeasurements({
      gender: "men",
      category: "pants",
      unit: "cm",
      measurements: { waist: 82, hip: 100, inseam: 200 },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.inseam).toContain("realistic");
  });

  it("chooses the larger size and explains between-size measurements", () => {
    const result = findSizeFromMeasurements({
      gender: "men",
      category: "tops",
      unit: "cm",
      measurements: { chest: 96, waist: 90 },
    });
    expect(result.row?.intl).toBe("L");
    expect(result.betweenRows?.map((row) => row.intl)).toEqual(["M", "L"]);
    expect(result.message).toContain("fall across");
  });

  it("returns the nearest row with a clear note when measurements are outside the guide", () => {
    const result = findSizeFromMeasurements({
      gender: "men",
      category: "tops",
      unit: "cm",
      measurements: { chest: 130, waist: 130 },
    });
    expect(result.ok).toBe(true);
    expect(result.row?.intl).toBe("XXXL");
    expect(result.message).toContain("outside these guide ranges");
  });

  it("uses an unmatched secondary dimension to report out-of-range instead of between sizes", () => {
    const result = findSizeFromMeasurements({
      gender: "men",
      category: "tops",
      unit: "cm",
      measurements: { chest: 96, waist: 130 },
    });
    expect(result.row?.intl).toBe("XXXL");
    expect(result.message).toContain("waist is outside");
  });

  it("uses waist and hip as the required dimensions for pants", () => {
    const result = findSizeFromMeasurements({
      gender: "women",
      category: "pants",
      unit: "cm",
      measurements: { waist: 74, hip: 98 },
    });
    expect(result.row?.intl).toBe("M");
    expect(result.errors.bust).toBeUndefined();
  });

  it("uses bust, waist, and hip for dresses", () => {
    const result = findSizeFromMeasurements({
      gender: "women",
      category: "dresses",
      unit: "cm",
      measurements: { bust: 92, waist: 75, hip: 99 },
    });
    expect(result.row?.intl).toBe("M");
  });

  it("preserves optional height data for result context without requiring it", () => {
    const result = findSizeFromMeasurements({
      gender: "men",
      category: "tops",
      unit: "cm",
      measurements: { chest: 96, waist: 82, height: 178 },
    });
    expect(result.ok).toBe(true);
    expect(result.row?.body.height).toEqual({ min: 176, max: 182 });
  });
});

describe("compareSizes", () => {
  it("returns two resolved comparison rows", () => {
    const result = compareSizes([
      { system: "US", size: "M" },
      { system: "EU", size: "48-50" },
    ], "men", "tops");
    expect(result.error).toBeNull();
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].row?.id).toBe(result.rows[1].row?.id);
    expect(result.measurements).toContain("chest");
  });

  it("supports the maximum of four comparison columns", () => {
    const result = compareSizes([
      { system: "US", size: "M" },
      { system: "UK", size: "38" },
      { system: "EU", size: "48-50" },
      { system: "INTL", size: "M" },
    ], "men", "tops");
    expect(result.error).toBeNull();
    expect(result.rows).toHaveLength(4);
  });

  it("rejects fewer than two selections", () => {
    const result = compareSizes([{ system: "US", size: "M" }], "men", "tops");
    expect(result.error).toContain("between 2 and 4");
  });

  it("rejects more than four selections", () => {
    const result = compareSizes([
      { system: "US", size: "M" },
      { system: "UK", size: "38" },
      { system: "EU", size: "48-50" },
      { system: "JP", size: "L" },
      { system: "AU", size: "M" },
    ], "men", "tops");
    expect(result.error).toContain("between 2 and 4");
  });

  it("reports an unknown comparison size", () => {
    const result = compareSizes([
      { system: "US", size: "M" },
      { system: "EU", size: "unlisted" },
    ], "men", "tops");
    expect(result.error).toContain("could not be matched");
  });

  it("supports international letter sizes", () => {
    const result = compareSizes([
      { system: "INTL", size: "L" },
      { system: "US", size: "L" },
    ], "men", "tops");
    expect(result.rows[0].row?.intl).toBe("L");
  });

  it("normalizes an en dash in numeric size labels", () => {
    const result = compareSizes([
      { system: "US", size: "8–10" },
      { system: "EU", size: "40-42" },
    ], "women", "dresses");
    expect(result.error).toBeNull();
  });
});
