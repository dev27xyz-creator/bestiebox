import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { SizeDataset, SystemCode } from "../src/types";
import systemsJson from "../src/data/systems.json";

const knownSystems = new Set((systemsJson as Array<{ code: SystemCode }>).map(({ code }) => code));
const dataDir = path.resolve("src/data");
const filenames = (await readdir(dataDir)).filter((name) => /^(mens|womens)-.*\.json$/.test(name));
const errors: string[] = [];
const ids = new Set<string>();

if (!filenames.length) errors.push("No generated size datasets found. Run npm run generate:data first.");

for (const filename of filenames) {
  let dataset: SizeDataset;
  try {
    dataset = JSON.parse(await readFile(path.join(dataDir, filename), "utf8")) as SizeDataset;
  } catch (error) {
    errors.push(`${filename}: invalid JSON (${String(error)})`);
    continue;
  }
  if (!dataset.sourceNote?.trim()) errors.push(`${filename}: missing sourceNote.`);
  if (!dataset.lastReviewed?.trim()) errors.push(`${filename}: missing lastReviewed.`);
  if (!dataset.rows.length) errors.push(`${filename}: rows must not be empty.`);
  const previous: Record<string, { min: number; max: number }> = {};
  for (const row of dataset.rows) {
    if (ids.has(row.id)) errors.push(`${filename}: duplicate row id "${row.id}".`);
    ids.add(row.id);
    if (!row.intl || row.sizes.INTL !== row.intl) {
      errors.push(`${filename}/${row.id}: missing or mismatched International anchor.`);
    }
    for (const system of Object.keys(row.sizes)) {
      if (!knownSystems.has(system as SystemCode)) {
        errors.push(`${filename}/${row.id}: unknown system code "${system}".`);
      }
    }
    for (const [measurement, range] of Object.entries(row.body)) {
      if (!range) continue;
      if (!Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min > range.max) {
        errors.push(`${filename}/${row.id}/${measurement}: min must be less than or equal to max.`);
      }
      const prior = previous[measurement];
      if (prior && (range.min < prior.min || range.max < prior.max)) {
        errors.push(`${filename}/${row.id}/${measurement}: range is non-monotonic across sizes.`);
      }
      previous[measurement] = range;
    }
  }
}

if (errors.length) {
  console.error(`Data validation failed with ${errors.length} issue(s):\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${filenames.length} datasets and ${ids.size} unique size rows.`);
}
