import type { Category, Gender, IntlSize, MeasurementKey, Range, SizeDataset, SizeRow } from "../types";

const intlSizes: IntlSize[] = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
type TupleRange = [number, number];
type Profiles = Partial<Record<MeasurementKey, TupleRange[]>>;

const profiles: Record<Gender, Partial<Record<Category, Profiles>>> = {
  men: {
    tops: {
      chest: [[82, 87], [88, 93], [94, 99], [100, 105], [106, 111], [112, 117], [118, 123]],
      waist: [[68, 73], [74, 79], [80, 85], [86, 91], [92, 97], [98, 103], [104, 109]],
      height: [[164, 170], [170, 176], [176, 182], [182, 188], [188, 194], [194, 200], [200, 206]],
      shoulder: [[42, 44], [44, 46], [46, 48], [48, 50], [50, 52], [52, 54], [54, 56]],
      sleeve: [[58, 60], [60, 62], [62, 64], [64, 66], [66, 68], [68, 70], [70, 72]],
    },
    shirts: {
      chest: [[82, 87], [88, 93], [94, 99], [100, 105], [106, 111], [112, 117], [118, 123]],
      waist: [[68, 73], [74, 79], [80, 85], [86, 91], [92, 97], [98, 103], [104, 109]],
      height: [[164, 170], [170, 176], [176, 182], [182, 188], [188, 194], [194, 200], [200, 206]],
      shoulder: [[42, 44], [44, 46], [46, 48], [48, 50], [50, 52], [52, 54], [54, 56]],
      sleeve: [[58, 60], [60, 62], [62, 64], [64, 66], [66, 68], [68, 70], [70, 72]],
    },
    jeans: {
      waist: [[70, 75], [76, 81], [82, 87], [88, 93], [94, 99], [100, 105], [106, 111]],
      hip: [[86, 91], [92, 97], [98, 103], [104, 109], [110, 115], [116, 121], [122, 127]],
      inseam: [[76, 82], [78, 84], [80, 86], [82, 88], [82, 88], [82, 88], [82, 88]],
      height: [[164, 170], [170, 176], [176, 182], [182, 188], [188, 194], [194, 200], [200, 206]],
    },
    pants: {
      waist: [[70, 75], [76, 81], [82, 87], [88, 93], [94, 99], [100, 105], [106, 111]],
      hip: [[86, 91], [92, 97], [98, 103], [104, 109], [110, 115], [116, 121], [122, 127]],
      inseam: [[76, 82], [78, 84], [80, 86], [82, 88], [82, 88], [82, 88], [82, 88]],
      height: [[164, 170], [170, 176], [176, 182], [182, 188], [188, 194], [194, 200], [200, 206]],
    },
    jackets: {
      chest: [[82, 87], [88, 93], [94, 99], [100, 105], [106, 111], [112, 117], [118, 123]],
      waist: [[68, 73], [74, 79], [80, 85], [86, 91], [92, 97], [98, 103], [104, 109]],
      height: [[164, 170], [170, 176], [176, 182], [182, 188], [188, 194], [194, 200], [200, 206]],
      shoulder: [[42, 44], [44, 46], [46, 48], [48, 50], [50, 52], [52, 54], [54, 56]],
      sleeve: [[58, 60], [60, 62], [62, 64], [64, 66], [66, 68], [68, 70], [70, 72]],
    },
  },
  women: {
    tops: {
      bust: [[78, 83], [84, 89], [90, 95], [96, 101], [102, 108], [109, 115], [116, 122]],
      waist: [[60, 65], [66, 71], [72, 77], [78, 84], [85, 91], [92, 98], [99, 105]],
      hip: [[84, 89], [90, 95], [96, 101], [102, 107], [108, 114], [115, 121], [122, 128]],
      height: [[150, 158], [155, 163], [160, 168], [165, 173], [168, 176], [170, 178], [170, 178]],
      shoulder: [[35, 37], [36, 38], [37, 39], [38, 40], [39, 41], [40, 42], [41, 43]],
      sleeve: [[55, 57], [56, 58], [57, 59], [58, 60], [59, 61], [60, 62], [61, 63]],
    },
    dresses: {
      bust: [[78, 83], [84, 89], [90, 95], [96, 101], [102, 108], [109, 115], [116, 122]],
      waist: [[60, 65], [66, 71], [72, 77], [78, 84], [85, 91], [92, 98], [99, 105]],
      hip: [[84, 89], [90, 95], [96, 101], [102, 107], [108, 114], [115, 121], [122, 128]],
      height: [[150, 158], [155, 163], [160, 168], [165, 173], [168, 176], [170, 178], [170, 178]],
      shoulder: [[35, 37], [36, 38], [37, 39], [38, 40], [39, 41], [40, 42], [41, 43]],
      sleeve: [[55, 57], [56, 58], [57, 59], [58, 60], [59, 61], [60, 62], [61, 63]],
    },
    jeans: {
      waist: [[60, 65], [66, 71], [72, 77], [78, 84], [85, 91], [92, 98], [99, 105]],
      hip: [[84, 89], [90, 95], [96, 101], [102, 107], [108, 114], [115, 121], [122, 128]],
      inseam: [[72, 78], [74, 80], [76, 82], [78, 84], [78, 84], [78, 84], [78, 84]],
      height: [[150, 158], [155, 163], [160, 168], [165, 173], [168, 176], [170, 178], [170, 178]],
    },
    pants: {
      waist: [[60, 65], [66, 71], [72, 77], [78, 84], [85, 91], [92, 98], [99, 105]],
      hip: [[84, 89], [90, 95], [96, 101], [102, 107], [108, 114], [115, 121], [122, 128]],
      inseam: [[72, 78], [74, 80], [76, 82], [78, 84], [78, 84], [78, 84], [78, 84]],
      height: [[150, 158], [155, 163], [160, 168], [165, 173], [168, 176], [170, 178], [170, 178]],
    },
    jackets: {
      bust: [[78, 83], [84, 89], [90, 95], [96, 101], [102, 108], [109, 115], [116, 122]],
      waist: [[60, 65], [66, 71], [72, 77], [78, 84], [85, 91], [92, 98], [99, 105]],
      shoulder: [[35, 37], [36, 38], [37, 39], [38, 40], [39, 41], [40, 42], [41, 43]],
      sleeve: [[55, 57], [56, 58], [57, 59], [58, 60], [59, 61], [60, 62], [61, 63]],
      height: [[150, 158], [155, 163], [160, 168], [165, 173], [168, 176], [170, 178], [170, 178]],
    },
  },
};

const systemSizes: Record<Gender, Record<"upper" | "lower", Record<IntlSize, Record<string, string>>>> = {
  men: {
    upper: {
      XS: { US: "XS", UK: "34", EU: "44-46", JP: "S", CN: "165/84A", KR: "90", AU: "XS", INTL: "XS" },
      S: { US: "S", UK: "36", EU: "46-48", JP: "M", CN: "170/88A", KR: "95", AU: "S", INTL: "S" },
      M: { US: "M", UK: "38", EU: "48-50", JP: "L", CN: "175/92A", KR: "100", AU: "M", INTL: "M" },
      L: { US: "L", UK: "40", EU: "50-52", JP: "XL", CN: "180/96A", KR: "105", AU: "L", INTL: "L" },
      XL: { US: "XL", UK: "42", EU: "52-54", JP: "XXL", CN: "185/100A", KR: "110", AU: "XL", INTL: "XL" },
      XXL: { US: "XXL", UK: "44", EU: "54-56", JP: "3L", CN: "190/104A", KR: "115", AU: "XXL", INTL: "XXL" },
      XXXL: { US: "XXXL", UK: "46", EU: "56-58", JP: "4L", CN: "195/108A", KR: "120", AU: "3XL", INTL: "XXXL" },
    },
    lower: {
      XS: { US: "28-30", UK: "28", EU: "44-46", JP: "S", CN: "165/72A", KR: "28", AU: "28-30", INTL: "XS" },
      S: { US: "30-32", UK: "30", EU: "46-48", JP: "M", CN: "170/76A", KR: "30", AU: "30-32", INTL: "S" },
      M: { US: "32-34", UK: "32", EU: "48-50", JP: "L", CN: "175/80A", KR: "32", AU: "32-34", INTL: "M" },
      L: { US: "34-36", UK: "34", EU: "50-52", JP: "XL", CN: "180/84A", KR: "34", AU: "34-36", INTL: "L" },
      XL: { US: "36-38", UK: "36", EU: "52-54", JP: "XXL", CN: "185/88A", KR: "36", AU: "36-38", INTL: "XL" },
      XXL: { US: "40-42", UK: "38", EU: "54-56", JP: "3L", CN: "190/92A", KR: "38", AU: "40-42", INTL: "XXL" },
      XXXL: { US: "44-46", UK: "40", EU: "56-58", JP: "4L", CN: "195/96A", KR: "40", AU: "44-46", INTL: "XXXL" },
    },
  },
  women: {
    upper: {
      XS: { US: "0-2", UK: "4-6", EU: "32-34", JP: "5-7", CN: "155/80A", KR: "44", AU: "4-6", INTL: "XS" },
      S: { US: "4-6", UK: "8-10", EU: "36-38", JP: "9-11", CN: "160/84A", KR: "55", AU: "8-10", INTL: "S" },
      M: { US: "8-10", UK: "12-14", EU: "40-42", JP: "13-15", CN: "165/88A", KR: "66", AU: "12-14", INTL: "M" },
      L: { US: "12-14", UK: "16-18", EU: "44-46", JP: "17-19", CN: "170/92A", KR: "77", AU: "16-18", INTL: "L" },
      XL: { US: "16-18", UK: "20-22", EU: "48-50", JP: "21-23", CN: "175/96A", KR: "88", AU: "20-22", INTL: "XL" },
      XXL: { US: "20-22", UK: "24-26", EU: "52-54", JP: "25-27", CN: "180/100A", KR: "99", AU: "24-26", INTL: "XXL" },
      XXXL: { US: "24-26", UK: "28-30", EU: "56-58", JP: "29-31", CN: "185/104A", KR: "110", AU: "28-30", INTL: "XXXL" },
    },
    lower: {
      XS: { US: "0-2", UK: "4-6", EU: "32-34", JP: "5-7", CN: "155/60A", KR: "44", AU: "4-6", INTL: "XS" },
      S: { US: "4-6", UK: "8-10", EU: "36-38", JP: "9-11", CN: "160/64A", KR: "55", AU: "8-10", INTL: "S" },
      M: { US: "8-10", UK: "12-14", EU: "40-42", JP: "13-15", CN: "165/68A", KR: "66", AU: "12-14", INTL: "M" },
      L: { US: "12-14", UK: "16-18", EU: "44-46", JP: "17-19", CN: "170/72A", KR: "77", AU: "16-18", INTL: "L" },
      XL: { US: "16-18", UK: "20-22", EU: "48-50", JP: "21-23", CN: "175/76A", KR: "88", AU: "20-22", INTL: "XL" },
      XXL: { US: "20-22", UK: "24-26", EU: "52-54", JP: "25-27", CN: "180/80A", KR: "99", AU: "24-26", INTL: "XXL" },
      XXXL: { US: "24-26", UK: "28-30", EU: "56-58", JP: "29-31", CN: "185/84A", KR: "110", AU: "28-30", INTL: "XXXL" },
    },
  },
};

export function buildDatasets(): SizeDataset[] {
  const result: SizeDataset[] = [];
  for (const gender of ["men", "women"] as const) {
    for (const [category, categoryProfiles] of Object.entries(profiles[gender])) {
      if (!categoryProfiles) continue;
      const lower = ["jeans", "pants"].includes(category);
      const sizeMaps = systemSizes[gender][lower ? "lower" : "upper"];
      const rows: SizeRow[] = intlSizes.map((intl, index) => {
        const body: Partial<Record<MeasurementKey, Range>> = {};
        for (const [key, ranges] of Object.entries(categoryProfiles)) {
          const range = ranges?.[index];
          if (range) body[key as MeasurementKey] = { min: range[0], max: range[1] };
        }
        const sizes = { ...sizeMaps[intl] } as SizeRow["sizes"];
        if (gender === "women" && category === "jeans" && intl === "XXXL") delete sizes.CN;
        if (gender === "men" && category === "jackets" && intl === "XXXL") delete sizes.KR;
        return {
          id: `${gender}-${category}-${intl.toLowerCase()}`,
          intl,
          sizes,
          body,
        };
      });
      result.push({
        gender,
        category: category as Category,
        version: "1.0",
        lastReviewed: "2026-10-09",
        sourceNote: "General, non-brand-specific estimates based on commonly published international sizing conventions. These figures have not been independently verified and must be checked against retailer charts before launch.",
        rows,
      });
    }
  }
  return result;
}
