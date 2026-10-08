export type SystemCode = "US" | "UK" | "EU" | "JP" | "CN" | "KR" | "AU" | "INTL";
export type Gender = "men" | "women";
export type Category = "tops" | "shirts" | "jeans" | "pants" | "dresses" | "jackets";
export type Unit = "cm" | "in";
export type IntlSize = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL";
export type MeasurementKey =
  | "chest"
  | "bust"
  | "waist"
  | "hip"
  | "height"
  | "inseam"
  | "shoulder"
  | "sleeve";

export interface Range {
  min: number;
  max: number;
}

export type BodyMeasurements = Partial<Record<MeasurementKey, Range>>;

export interface SizeRow {
  id: string;
  intl: IntlSize;
  sizes: Partial<Record<SystemCode, string>>;
  body: BodyMeasurements;
}

export interface SizeDataset {
  gender: Gender;
  category: Category;
  version: string;
  lastReviewed: string;
  sourceNote: string;
  rows: SizeRow[];
}

export interface ConversionInput {
  gender: Gender;
  category: Category;
  from: SystemCode;
  size: string;
  to: SystemCode;
}

export interface ConversionResult {
  ok: boolean;
  input: ConversionInput;
  targetSize: string | null;
  row: SizeRow | null;
  candidates: SizeRow[];
  confidence: "exact-row" | "range" | "approximate";
  message: string;
}

export type MeasurementValues = Partial<Record<MeasurementKey, number>>;

export interface FinderInput {
  gender: Gender;
  category: Category;
  measurements: MeasurementValues;
  unit: Unit;
}

export interface FinderResult {
  ok: boolean;
  errors: Partial<Record<MeasurementKey, string>>;
  row: SizeRow | null;
  betweenRows: [SizeRow, SizeRow] | null;
  recommendations: Partial<Record<SystemCode, string>>;
  matchedRanges: BodyMeasurements;
  message: string;
}

export interface SizeSelection {
  system: SystemCode;
  size: string;
}

export interface ComparisonResult {
  selections: SizeSelection[];
  rows: Array<{ selection: SizeSelection; row: SizeRow | null }>;
  measurements: MeasurementKey[];
  error: string | null;
}
