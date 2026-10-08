import { mkdir, writeFile } from "node:fs/promises";
import { buildDatasets } from "../src/data/seed-data";

const filenames: Record<string, string> = {
  "men:tops": "mens-tops.json",
  "men:shirts": "mens-shirts.json",
  "men:jeans": "mens-jeans.json",
  "men:pants": "mens-pants.json",
  "men:jackets": "mens-jackets.json",
  "women:tops": "womens-tops.json",
  "women:dresses": "womens-dresses.json",
  "women:jeans": "womens-jeans.json",
  "women:pants": "womens-pants.json",
  "women:jackets": "womens-jackets.json",
};

await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
for (const dataset of buildDatasets()) {
  const filename = filenames[`${dataset.gender}:${dataset.category}`];
  if (!filename) continue;
  await writeFile(
    new URL(`../src/data/${filename}`, import.meta.url),
    `${JSON.stringify(dataset, null, 2)}\n`,
    "utf8",
  );
}
console.log(`Generated ${Object.keys(filenames).length} static size datasets.`);
