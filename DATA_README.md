# Size data guide

## Files and schema

`src/data/systems.json` defines the supported size systems. Each generated dataset in `src/data/` is a JSON object with:

- `gender`, `category`: the guide's scope.
- `version`, `lastReviewed`, `sourceNote`: maintenance and provenance fields.
- `rows`: one record per International anchor size, from XS through XXXL.
- Each row has a stable `id`, `intl` anchor, a partial `sizes` map keyed by system code, and a `body` map keyed by measurement name.
- Every measurement range is `{ "min": number, "max": number }` in centimeters.

The source profiles and system mappings live in `src/data/seed-data.ts`. `npm run generate:data` writes the individual static JSON files consumed by the app. Do not edit generated JSON alone; your edits will be overwritten by the next generation.

## Editing safely

1. Update the appropriate body-range profile and system mapping in `seed-data.ts`.
2. Keep every size's measurement ranges monotonic from smaller to larger sizes. Overlapping ranges are allowed only when they are intentional and documented.
3. Keep the `INTL` mapping aligned with the row's `intl` anchor.
4. Use partial mappings only when a country/category mapping is genuinely unavailable. The UI will display a dash and explain the gap.
5. Regenerate and check the output with:

   ```sh
   npm run generate:data
   npm run validate:data
   npm test
   ```

## Verification warning

These non-brand estimates are illustrative generalized comparisons assembled from commonly published sizing conventions. They have not been independently verified against current standards or retailer charts. The `lastReviewed` field is the data snapshot date, not a statement of expert approval. **A knowledgeable reviewer must verify every figure and source before the site is launched.** Do not copy a retailer's chart unless its usage terms permit it.

The app must keep describing results as approximate. Users should compare their body measurements with the retailer's own chart before ordering.
