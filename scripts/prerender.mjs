import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();
const clientDir = path.join(projectRoot, "dist");
const routes = JSON.parse(await readFile(path.join(projectRoot, "public/generated-routes.json"), "utf8"));
const serverEntry = pathToFileURL(path.join(projectRoot, "dist/server/entry-server.js")).href;
const { render } = await import(serverEntry);
const template = await readFile(path.join(clientDir, "index.html"), "utf8");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function schemaFor(route) {
  const origin = "https://bestiebox.site";
  const canonical = `${origin}${route.path}`;
  const breadcrumbs = [
    { name: "Home", item: `${origin}/` },
    ...(route.kind === "size" || route.kind === "pair" ? [{ name: "Clothing size converter", item: `${origin}/clothing-size-converter/` }] : []),
    { name: route.title.replace(/ \| BestieBox$/, ""), item: canonical },
  ];
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "BestieBox Clothing Size Comparison Tool",
      applicationCategory: "ShoppingApplication",
      operatingSystem: "Any",
      url: canonical,
      description: route.description,
      inLanguage: "en",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.item,
      })),
    },
  ];
  if (route.kind === "size" || route.kind === "how") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Are clothing size conversions exact?",
          acceptedAnswer: { "@type": "Answer", text: "No. They are approximate comparisons. Retailer sizing, garment cut, and country conventions can vary." },
        },
        {
          "@type": "Question",
          name: "How do I choose the best size?",
          acceptedAnswer: { "@type": "Answer", text: "Compare your body measurements with the retailer's size chart for the specific garment." },
        },
        {
          "@type": "Question",
          name: "Where are measurements stored?",
          acceptedAnswer: { "@type": "Answer", text: "Measurements stay in your browser and are not sent to a server." },
        },
      ],
    });
  }
  return schemas;
}

function renderDocument(route, body) {
  const canonical = `https://bestiebox.site${route.path}`;
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const jsonLd = schemaFor(route).map((schema) => `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`).join("");
  let html = template.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${title}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${description}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${title}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${description}" />`);
  html = html.replace("</head>", `${jsonLd}</head>`);
  return html;
}

for (const route of routes) {
  const body = render(route.path);
  const relativePath = route.path === "/" ? "index.html" : path.join(route.path.replace(/^\/|\/$/g, ""), "index.html");
  const output = path.join(clientDir, relativePath);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, renderDocument(route, body), "utf8");
}

const notFoundRoute = {
  path: "/404/",
  title: "Page Not Found | BestieBox",
  description: "The page could not be found. Return to BestieBox to compare clothing sizes.",
  kind: "404",
};
await writeFile(path.join(clientDir, "404.html"), renderDocument(notFoundRoute, render("/404/")), "utf8");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((route) => `  <url><loc>https://bestiebox.site${route.path}</loc></url>`).join("\n")}\n</urlset>\n`;
await writeFile(path.join(clientDir, "sitemap.xml"), sitemap, "utf8");
await writeFile(path.join(clientDir, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: https://bestiebox.site/sitemap.xml\n", "utf8");
console.log(`Pre-rendered ${routes.length} routes plus 404.html; generated sitemap.xml.`);
