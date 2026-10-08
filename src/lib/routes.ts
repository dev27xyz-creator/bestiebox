import { datasets, systems } from "../data";
import type { Category, Gender, SizeRow, SystemCode } from "../types";

export type RouteKind = "home" | "hub" | "pair" | "size" | "how";
export interface RouteDefinition {
  path: string;
  kind: RouteKind;
  title: string;
  description: string;
  gender?: Gender;
  category?: Category;
  from?: SystemCode;
  to?: SystemCode;
  size?: string;
  rowId?: string;
}

const hubs: RouteDefinition[] = [
  { path: "/", kind: "home", title: "Clothing Size Comparison Tool | BestieBox", description: "Compare clothing sizes across international sizing systems with body-measurement context." },
  { path: "/clothing-size-converter/", kind: "hub", title: "Clothing Size Converter | BestieBox", description: "Convert clothing sizes between US, UK, EU, Japan, China, Korea, Australia, and International labels." },
  { path: "/mens-size-converter/", kind: "hub", gender: "men", title: "Men's Clothing Size Converter | BestieBox", description: "Find approximate men's clothing size conversions and compare them with body measurements." },
  { path: "/womens-size-converter/", kind: "hub", gender: "women", title: "Women's Clothing Size Converter | BestieBox", description: "Compare women's clothing sizes across international systems with measurement ranges." },
  { path: "/tshirt-size-converter/", kind: "hub", category: "tops", title: "T-Shirt Size Converter | BestieBox", description: "Compare T-shirt size labels using international size mappings and body measurements." },
  { path: "/shirt-size-converter/", kind: "hub", category: "shirts", title: "Shirt Size Converter | BestieBox", description: "Compare shirt sizes across countries, with approximate mappings and body measurements." },
  { path: "/jeans-size-converter/", kind: "hub", category: "jeans", title: "Jeans Size Converter | BestieBox", description: "Compare jeans sizes internationally using waist, hip, and inseam ranges." },
  { path: "/dress-size-converter/", kind: "hub", gender: "women", category: "dresses", title: "Dress Size Converter | BestieBox", description: "Compare dress sizes across countries with bust, waist, and hip measurement ranges." },
  { path: "/jacket-size-converter/", kind: "hub", category: "jackets", title: "Jacket Size Converter | BestieBox", description: "Compare jacket sizes across international systems using body measurements." },
  { path: "/find-my-clothing-size/", kind: "hub", title: "Find My Clothing Size | BestieBox", description: "Enter body measurements to estimate clothing sizes across international systems." },
  { path: "/compare-clothing-sizes/", kind: "hub", title: "Compare Clothing Sizes | BestieBox", description: "Compare two to four clothing sizes side by side, including their measurement ranges." },
  { path: "/how-we-calculate/", kind: "how", title: "How BestieBox Calculates Size Conversions", description: "Learn how BestieBox size mappings work, what they can and cannot tell you, and why retailer charts matter." },
];

const label = (code: SystemCode) => systems.find((item) => item.code === code)?.name ?? code;
const slugSize = (value: string) => value.toLowerCase().replace(/[–—]/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const pairs: RouteDefinition[] = [];
for (const from of systems) {
  for (const to of systems) {
    if (from.code === to.code) continue;
    const fromSlug = from.code === "INTL" ? "international" : from.code.toLowerCase();
    const toSlug = to.code === "INTL" ? "international" : to.code.toLowerCase();
    pairs.push({
      path: `/${fromSlug}-to-${toSlug}-clothing-size/`,
      kind: "pair",
      from: from.code,
      to: to.code,
      title: `${label(from.code)} to ${label(to.code)} Clothing Size Conversion | BestieBox`,
      description: `Compare approximate clothing-size mappings from ${label(from.code)} to ${label(to.code)} with body-measurement ranges.`,
    });
  }
}

const specific: RouteDefinition[] = [];
const popularSourceSystems: SystemCode[] = ["US", "UK", "EU"];
for (const dataset of datasets) {
  for (const row of dataset.rows) {
    for (const from of popularSourceSystems) {
      for (const to of ["EU", "US"] as const) {
        if (from === to || !row.sizes[from] || !row.sizes[to]) continue;
        const size = row.sizes[from]!;
        const path = `/sizes/${dataset.gender}/${dataset.category}/${from.toLowerCase()}-size-${slugSize(size)}-to-${to.toLowerCase()}/`;
        const genderLabel = dataset.gender === "men" ? "Men's" : "Women's";
        const categoryLabel = dataset.category === "tops" ? "T-shirt" : dataset.category;
        specific.push({
          path,
          kind: "size",
          gender: dataset.gender,
          category: dataset.category,
          from,
          to,
          size,
          rowId: row.id,
          title: `${genderLabel} ${categoryLabel} Size ${size} to ${label(to)} | BestieBox`,
          description: `See the approximate ${from} ${size} to ${to} size mapping for ${genderLabel.toLowerCase()} ${categoryLabel.toLowerCase()}s, plus the matching body-measurement ranges.`,
        });
      }
    }
  }
}

const genericSpecific: RouteDefinition[] = [
  { path: "/us-size-m-to-eu/", kind: "size", gender: "men", category: "tops", from: "US", to: "EU", size: "M", rowId: "men-tops-m", title: "US Men's M to EU Clothing Size | BestieBox", description: "See the approximate men's US M to EU clothing-size conversion, body measurements, and nearby sizes." },
  { path: "/us-8-to-eu/", kind: "size", gender: "women", category: "dresses", from: "US", to: "EU", size: "8", rowId: "women-dresses-m", title: "US Women's Size 8 to EU Dress Size | BestieBox", description: "Compare a US women's dress size 8 with its approximate EU equivalent and measurement ranges." },
  { path: "/uk-12-to-eu/", kind: "size", gender: "women", category: "dresses", from: "UK", to: "EU", size: "12", rowId: "women-dresses-m", title: "UK Women's Size 12 to EU Dress Size | BestieBox", description: "Compare a UK women's dress size 12 with its approximate EU equivalent and body-measurement ranges." },
  { path: "/eu-40-to-us/", kind: "size", gender: "women", category: "dresses", from: "EU", to: "US", size: "40", rowId: "women-dresses-m", title: "EU Women's Size 40 to US Dress Size | BestieBox", description: "Compare an EU women's dress size 40 with its approximate US equivalent and body-measurement ranges." },
];

export const routeDefinitions: RouteDefinition[] = [...hubs, ...pairs, ...specific, ...genericSpecific];

export function normalizePath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return `/${pathname.split("/").filter(Boolean).join("/")}/`;
}

export function getRouteDefinition(pathname: string): RouteDefinition | undefined {
  const normalized = normalizePath(pathname);
  return routeDefinitions.find((route) => route.path === normalized);
}

export function getRouteRow(route: RouteDefinition): SizeRow | undefined {
  if (!route.gender || !route.category || !route.rowId) return undefined;
  return datasets.find((item) => item.gender === route.gender && item.category === route.category)
    ?.rows.find((row) => row.id === route.rowId);
}
