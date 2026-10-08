import mensTops from "./mens-tops.json";
import mensShirts from "./mens-shirts.json";
import mensJeans from "./mens-jeans.json";
import mensPants from "./mens-pants.json";
import mensJackets from "./mens-jackets.json";
import womensTops from "./womens-tops.json";
import womensDresses from "./womens-dresses.json";
import womensJeans from "./womens-jeans.json";
import womensPants from "./womens-pants.json";
import womensJackets from "./womens-jackets.json";
import systemsJson from "./systems.json";
import type { Category, Gender, SizeDataset, SystemCode } from "../types";

export const systems = systemsJson as Array<{
  code: SystemCode;
  name: string;
  shortName: string;
  flag: string | null;
}>;

export const datasets: SizeDataset[] = [
  mensTops,
  mensShirts,
  mensJeans,
  mensPants,
  mensJackets,
  womensTops,
  womensDresses,
  womensJeans,
  womensPants,
  womensJackets,
] as SizeDataset[];

export function getDataset(gender: Gender, category: Category): SizeDataset | undefined {
  const resolvedCategory = gender === "women" && category === "shirts" ? "tops" : category;
  return datasets.find((dataset) => dataset.gender === gender && dataset.category === resolvedCategory);
}

export function allSystems(): SystemCode[] {
  return systems.map((system) => system.code);
}
