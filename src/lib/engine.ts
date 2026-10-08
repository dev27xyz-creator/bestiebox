import { getDataset, systems } from "../data";
import type {
  BodyMeasurements,
  Category,
  ComparisonResult,
  ConversionInput,
  ConversionResult,
  FinderInput,
  FinderResult,
  Gender,
  MeasurementKey,
  Range,
  SizeRow,
  SizeSelection,
  SystemCode,
  Unit,
} from "../types";

const approximationNote =
  "Approximate conversion. For the most accurate fit, compare your body measurements with the retailer's size chart.";

export { approximationNote };

function normalizeSize(value: string, system?: SystemCode): string {
  let normalized = value
    .trim()
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ");
  if (system) normalized = normalized.replace(new RegExp(`^${system.toLowerCase()}\\s+`), "");
  return normalized.replace(/\s*-\s*/g, "-").toUpperCase();
}

function rowMatches(row: SizeRow, system: SystemCode, size: string): boolean {
  const candidate = row.sizes[system];
  if (!candidate) return false;
  const normalizedInput = normalizeSize(size, system);
  return [candidate, row.intl].some((value) => {
    const normalizedValue = normalizeSize(value, system);
    if (normalizedValue === normalizedInput) return true;
    const numericInput = normalizedInput.match(/^(\d+(?:\.\d+)?)$/);
    const numericRange = normalizedValue.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
    return Boolean(numericInput && numericRange &&
      Number(numericInput[1]) >= Number(numericRange[1]) &&
      Number(numericInput[1]) <= Number(numericRange[2]));
  });
}

function numericLabelIsRange(value: string): boolean {
  return /[\d]\s*-\s*[\d]/.test(value);
}

export function convertSize(input: ConversionInput): ConversionResult {
  const dataset = getDataset(input.gender, input.category);
  const candidates = dataset?.rows.filter((row) => rowMatches(row, input.from, input.size)) ?? [];
  if (!candidates.length) {
    return {
      ok: false,
      input,
      targetSize: null,
      row: null,
      candidates: [],
      confidence: "approximate",
      message: `We couldn't find ${input.size || "that size"} in ${input.from}. Choose a listed size or try another system.`,
    };
  }
  const row = candidates[0];
  const targetSize = row.sizes[input.to] ?? null;
  if (!targetSize) {
    return {
      ok: false,
      input,
      targetSize: null,
      row,
      candidates,
      confidence: "approximate",
      message: `This size row has no ${input.to} mapping yet. Its body measurements are still shown below.`,
    };
  }
  return {
    ok: true,
    input,
    targetSize,
    row,
    candidates,
    confidence: candidates.length > 1 ? "range" : numericLabelIsRange(targetSize) ? "range" : "exact-row",
    message: approximationNote,
  };
}

function rangeContains(range: Range | undefined, value: number): boolean {
  return Boolean(range && value >= range.min && value <= range.max);
}

function distanceToRange(range: Range | undefined, value: number): number {
  if (!range) return Number.POSITIVE_INFINITY;
  if (value < range.min) return range.min - value;
  if (value > range.max) return value - range.max;
  return 0;
}

function requiredMeasurements(gender: Gender, category: Category): MeasurementKey[] {
  if (category === "dresses") return ["bust", "waist", "hip"];
  if (category === "jeans" || category === "pants") return ["waist", "hip"];
  return gender === "women" ? ["bust", "waist"] : ["chest", "waist"];
}

function convertToCm(value: number, unit: Unit): number {
  return unit === "in" ? value * 2.54 : value;
}

function nearRange(value: number, range: Range): boolean {
  return value >= range.min - 0.01 && value <= range.max + 0.01;
}

export function findSizeFromMeasurements(input: FinderInput): FinderResult {
  const dataset = getDataset(input.gender, input.category);
  if (!dataset) {
    return {
      ok: false,
      errors: {},
      row: null,
      betweenRows: null,
      recommendations: {},
      matchedRanges: {},
      message: "We don't have a size guide for this category yet.",
    };
  }

  const required = requiredMeasurements(input.gender, input.category);
  const measurements: Partial<Record<MeasurementKey, number>> = {};
  const errors: FinderResult["errors"] = {};
  for (const key of required) {
    const raw = input.measurements[key];
    if (raw === undefined || Number.isNaN(raw)) {
      errors[key] = `Enter your ${key} measurement.`;
      continue;
    }
    if (!Number.isFinite(raw) || raw <= 0) {
      errors[key] = "Enter a positive measurement.";
      continue;
    }
    const cm = convertToCm(raw, input.unit);
    if (cm < 25 || cm > 250) {
      errors[key] = "Check this measurement. It should be between 25 and 250 cm.";
      continue;
    }
    measurements[key] = cm;
  }
  for (const [key, raw] of Object.entries(input.measurements) as [MeasurementKey, number][]) {
    if (required.includes(key) || raw === undefined || Number.isNaN(raw)) continue;
    const cm = convertToCm(raw, input.unit);
    const max = key === "height" ? 250 : 160;
    if (!Number.isFinite(raw) || raw <= 0 || cm < 15 || cm > max) {
      errors[key] = `Enter a realistic ${key} measurement.`;
    } else {
      measurements[key] = cm;
    }
  }
  if (Object.keys(errors).length) {
    return {
      ok: false,
      errors,
      row: null,
      betweenRows: null,
      recommendations: {},
      matchedRanges: {},
      message: "Check the highlighted measurements to see your size.",
    };
  }

  const matchesByKey = required.map((key) => ({
    key,
    rows: dataset.rows.filter((row) => rangeContains(row.body[key], measurements[key]!)),
  }));
  const intersection = dataset.rows.find((row) => required.every((key) => rangeContains(row.body[key], measurements[key]!)));
  let selected: SizeRow;
  let betweenRows: [SizeRow, SizeRow] | null = null;
  let message = approximationNote;

  if (intersection) {
    selected = intersection;
  } else if (matchesByKey.some((item) => item.rows.length === 0)) {
    const unmatchedKey = matchesByKey.find((item) => item.rows.length === 0)!.key;
    const value = measurements[unmatchedKey]!;
    selected = dataset.rows.reduce((closest, row) =>
      distanceToRange(row.body[unmatchedKey], value) < distanceToRange(closest.body[unmatchedKey], value) ? row : closest,
    );
    message = `Your ${unmatchedKey} is outside these guide ranges. ${selected.intl} is the nearest size shown; check a retailer's chart before ordering. ${approximationNote}`;
  } else {
    const matched = matchesByKey.flatMap((item) => item.rows);
    if (matched.length) {
      const unique = [...new Map(matched.map((row) => [row.id, row])).values()]
        .sort((a, b) => dataset.rows.indexOf(a) - dataset.rows.indexOf(b));
      selected = unique[unique.length - 1];
      const lowerIndex = Math.max(0, dataset.rows.indexOf(selected) - 1);
      betweenRows = [dataset.rows[lowerIndex], selected];
      message = `Your measurements fall across ${betweenRows[0].intl} and ${betweenRows[1].intl}. We recommend the larger size for more room. ${approximationNote}`;
    } else {
      const primary = required[0];
      const value = measurements[primary]!;
      selected = dataset.rows.reduce((closest, row) =>
        distanceToRange(row.body[primary], value) < distanceToRange(closest.body[primary], value) ? row : closest,
      );
      message = `Your measurements are outside these guide ranges. ${selected.intl} is the nearest size shown; check a retailer's chart before ordering. ${approximationNote}`;
    }
  }

  const recommendations: Partial<Record<SystemCode, string>> = {};
  for (const system of systems) {
    const mappedSize = selected.sizes[system.code];
    if (mappedSize) recommendations[system.code] = mappedSize;
  }
  const matchedRanges: BodyMeasurements = {};
  for (const [key, value] of Object.entries(selected.body)) {
    if (value) matchedRanges[key as MeasurementKey] = value;
  }
  return { ok: true, errors: {}, row: selected, betweenRows, recommendations, matchedRanges, message };
}

export function compareSizes(
  selections: SizeSelection[],
  gender: Gender,
  category: Category,
): ComparisonResult {
  const dataset = getDataset(gender, category);
  if (selections.length < 2 || selections.length > 4) {
    return { selections, rows: [], measurements: [], error: "Choose between 2 and 4 sizes to compare." };
  }
  if (!dataset) return { selections, rows: [], measurements: [], error: "No size guide is available for this selection." };

  const rows = selections.map((selection) => ({
    selection,
    row: dataset.rows.find((row) => rowMatches(row, selection.system, selection.size)) ?? null,
  }));
  if (rows.some(({ row }) => row === null)) {
    return { selections, rows, measurements: [], error: "One or more sizes could not be matched. Check the selections and try again." };
  }
  const measurementKeys = [...new Set(rows.flatMap(({ row }) => Object.keys(row!.body) as MeasurementKey[]))];
  return { selections, rows, measurements: measurementKeys, error: null };
}

export function formatRange(range: Range | undefined, unit: Unit): string {
  if (!range) return "—";
  if (unit === "cm") return `${Math.round(range.min)}–${Math.round(range.max)} cm`;
  const toHalfInch = (cm: number) => Math.round((cm / 2.54) * 2) / 2;
  const format = (value: number) => Number.isInteger(value) ? `${value}` : value.toFixed(1);
  return `${format(toHalfInch(range.min))}–${format(toHalfInch(range.max))} in`;
}

export function formatMeasurement(value: number | undefined, unit: Unit): string {
  if (value === undefined) return "—";
  if (unit === "cm") return `${Math.round(value)} cm`;
  const inches = Math.round((value / 2.54) * 2) / 2;
  return `${Number.isInteger(inches) ? inches : inches.toFixed(1)} in`;
}
