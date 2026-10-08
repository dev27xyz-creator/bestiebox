# BestieBox Clothing Size Comparison Tool

A static, English-only clothing-size converter, measurement finder, and side-by-side comparison tool. There is no account, backend, database, or third-party runtime API.

## Requirements

- Node.js 24 (or a current supported Node.js release)
- npm

## Commands

```sh
npm install
npm run dev
npm test
npm run validate:data
npm run build
npm run preview
```

The dev server runs on port 5000. `npm run build` regenerates the checked-in JSON datasets, validates them, generates static routes, builds the client and server renderers, and writes a pre-rendered `dist/` site and sitemap.

## Data and supported guides

The guide covers men's tops, shirts, jeans, pants, and jackets; women's tops, dresses, jeans, pants, and jackets; and US, UK, EU, Japan, China, Korea, Australia, and International size labels. All body measurements are centimeters in the source data.

See [DATA_README.md](./DATA_README.md) before changing size data. Current ranges and mappings are general estimates, not retailer charts. Have the full data reviewed before launch.

## Add a size system or category

1. Extend `SystemCode` and `src/data/systems.json` for a new system.
2. Update the canonical measurement profiles and size mappings in `src/data/seed-data.ts`.
3. Add a generated JSON filename in `scripts/generate-data.ts` for any new gender/category guide.
4. Update the data validator and UI category configuration if the new category needs different required measurements.
5. Run `npm run generate:data`, `npm run validate:data`, and `npm test`.
6. Run `npm run build` and check the new routes, metadata, and sitemap entries.

Missing system mappings are allowed and are shown as unavailable rather than inferred.

## Privacy and external services

The conversion engine runs in the browser. The only saved preferences are the selected unit and theme; browser storage is optional and guarded. The base build includes no cookies, trackers, analytics, ads, affiliate URLs, signup, or network-backed conversion requests. Reserved analytics and ad configuration is disabled by default.

## Launch checklist

- [ ] Independently verify each measurement range and country mapping against current, permitted references.
- [ ] Review the wording of all approximate-conversion and privacy notes.
- [ ] Check all category-color contrast and keyboard navigation at desktop and mobile sizes.
- [ ] Run Lighthouse on the published build for Performance, Accessibility, Best Practices, and SEO.
- [ ] Validate JSON-LD and sitemap in search tooling; submit the sitemap after launch.
- [ ] Connect `bestiebox.site` to Cloudflare Pages and verify canonical URLs.
