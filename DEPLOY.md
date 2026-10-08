# Cloudflare Pages deployment

## Build settings

- Framework preset: Vite (or None)
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: 24
- Root directory: `/`

`public/_headers` is copied into the output and sets basic response headers and long-lived caching for fingerprinted assets. `public/_redirects` provides the SPA fallback for direct route requests. Each known SEO route is also pre-rendered to its own HTML file. The build emits `sitemap.xml`, `robots.txt`, a `404.html`, and a generated route manifest.

## Domain

In Cloudflare Pages, add the `bestiebox.site` custom domain and complete the DNS instructions shown by Cloudflare. Confirm that HTTPS is active. Canonicals and sitemap entries use `https://bestiebox.site/`; update `scripts/prerender.mjs` and the canonical defaults in `index.html` if the production domain changes.

## Caching

- Keep hashed files under `/assets/` immutable for one year.
- HTML and route pages should revalidate normally; do not cache them as immutable.
- Cloudflare Pages applies `public/_headers` and `public/_redirects` from the deployment output.

## Launch checks

1. Verify route-specific titles, descriptions, canonicals, JSON-LD, and breadcrumbs in `dist/`.
2. Check `https://bestiebox.site/sitemap.xml` and `robots.txt`.
3. Submit the sitemap in Google Search Console after the domain is verified.
4. Check Lighthouse mobile scores, keyboard use, reduced motion, dark mode, and PNG sharing on a real phone.
5. Obtain independent human review of all size data before publishing. The current data is approximate and not independently verified.
