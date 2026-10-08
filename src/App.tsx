import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { approximationNote, compareSizes, convertSize as convertSizeLabel, findSizeFromMeasurements, formatRange } from "./lib/engine";
import { datasets, getDataset, systems } from "./data";
import { getRouteDefinition, getRouteRow, routeDefinitions } from "./lib/routes";
import { ADS_ENABLED, AFFILIATE_LINKS } from "./config";
import type {
  Category,
  ComparisonResult,
  ConversionResult,
  FinderResult,
  Gender,
  MeasurementKey,
  SizeSelection,
  SystemCode,
  Unit,
} from "./types";
import {
  ArrowLeftRightIcon,
  ArrowRightIcon,
  BestieMark,
  CheckIcon,
  ChevronDownIcon,
  CompareIcon,
  CopyIcon,
  DotGridIcon,
  DownloadIcon,
  DressIcon,
  JacketIcon,
  JeansIcon,
  InfoIcon,
  MinusIcon,
  MoonIcon,
  PlusIcon,
  ShirtIcon,
  TshirtIcon,
  PantsIcon,
  RulerIcon,
  SunIcon,
} from "./components/icons";

type Mode = "convert" | "find" | "compare";
type ThemeOverride = boolean | null;

const categories: Array<{ value: Category; label: string; shortLabel: string }> = [
  { value: "tops", label: "T-shirts", shortLabel: "T-shirts" },
  { value: "shirts", label: "Shirts", shortLabel: "Shirts" },
  { value: "jeans", label: "Jeans", shortLabel: "Jeans" },
  { value: "pants", label: "Trousers", shortLabel: "Trousers" },
  { value: "dresses", label: "Dresses", shortLabel: "Dresses" },
  { value: "jackets", label: "Jackets", shortLabel: "Jackets" },
];

const guides = [
  { label: "Clothing size converter", path: "/clothing-size-converter" },
  { label: "Men’s size converter", path: "/mens-size-converter" },
  { label: "Women’s size converter", path: "/womens-size-converter" },
  { label: "T-shirt size converter", path: "/tshirt-size-converter" },
  { label: "Shirt size converter", path: "/shirt-size-converter" },
  { label: "Jeans size converter", path: "/jeans-size-converter" },
  { label: "Dress size converter", path: "/dress-size-converter" },
  { label: "Jacket size converter", path: "/jacket-size-converter" },
  { label: "Find my clothing size", path: "/find-my-clothing-size" },
  { label: "Compare clothing sizes", path: "/compare-clothing-sizes" },
  { label: "How we calculate", path: "/how-we-calculate" },
];

const measurementNames: Record<MeasurementKey, string> = {
  chest: "Chest",
  bust: "Bust",
  waist: "Waist",
  hip: "Hip",
  height: "Height",
  inseam: "Inseam",
  shoulder: "Shoulder",
  sleeve: "Sleeve",
};

function requiredMeasurements(gender: Gender, category: Category): MeasurementKey[] {
  if (category === "dresses") return ["bust", "waist", "hip"];
  if (category === "jeans" || category === "pants") return ["waist", "hip"];
  return gender === "women" ? ["bust", "waist"] : ["chest", "waist"];
}

function getSizeOptions(gender: Gender, category: Category, code: SystemCode): string[] {
  const rows = getDataset(gender, category)?.rows ?? [];
  const available = rows.flatMap((row) => row.sizes[code] ? [row.sizes[code]!] : []);
  return [...new Set(available)];
}

function getSystemName(code: SystemCode): string {
  return systems.find((system) => system.code === code)?.name ?? code;
}

function getSystemShortName(code: SystemCode): string {
  return systems.find((system) => system.code === code)?.shortName ?? code;
}

function CategoryGlyph({ category }: { category: Category }) {
  const iconProps = { width: 23, height: 23 };
  switch (category) {
    case "tops": return <TshirtIcon {...iconProps} />;
    case "shirts": return <ShirtIcon {...iconProps} />;
    case "jeans": return <JeansIcon {...iconProps} />;
    case "pants": return <PantsIcon {...iconProps} />;
    case "dresses": return <DressIcon {...iconProps} />;
    case "jackets": return <JacketIcon {...iconProps} />;
  }
}

type RecentSize = { gender: Gender; category: Category; system: SystemCode; size: string };

function readPreferredSystem(): SystemCode {
  try {
    const stored = window.localStorage.getItem("bestiebox-from-system");
    return systems.some((system) => system.code === stored) ? stored as SystemCode : "US";
  } catch {
    return "US";
  }
}

function readRecentSizes(): RecentSize[] {
  try {
    const stored = JSON.parse(window.localStorage.getItem("bestiebox-recent-sizes") ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter((item): item is RecentSize =>
      item && (item.gender === "men" || item.gender === "women") &&
      categories.some((category) => category.value === item.category) &&
      systems.some((system) => system.code === item.system) &&
      typeof item.size === "string",
    ).slice(0, 6);
  } catch {
    return [];
  }
}

function defaultSizeFor(gender: Gender, category: Category, system: SystemCode): string {
  const options = getSizeOptions(gender, category, system);
  return options.find((size) => size === "M" || size === "8-10" || size === "32-34") ??
    options[Math.floor(options.length / 2)] ?? "";
}

function routeContext(pathname: string): {
  gender?: Gender;
  category?: Category;
  mode?: Mode;
  pair?: [SystemCode, SystemCode];
  size?: string;
} {
  const path = pathname.toLowerCase();
  const context: ReturnType<typeof routeContext> = {};
  const route = getRouteDefinition(pathname);
  if (path.includes("find-my-clothing-size")) context.mode = "find";
  else if (path.includes("compare-clothing-sizes")) context.mode = "compare";
  else context.mode = "convert";

  if (route) {
    context.gender = route.gender;
    context.category = route.category;
    if (route.from && route.to) context.pair = [route.from, route.to];
    if (route.size) {
      const row = getRouteRow(route);
      context.size = (route.from && row?.sizes[route.from]) || route.size;
    }
  }
  if (path.includes("mens-size-converter") || path.includes("/mens/")) context.gender = "men";
  if (path.includes("womens-size-converter") || path.includes("/womens/")) context.gender = "women";

  if (path.includes("tshirt-size-converter") || path.includes("t-shirt")) context.category = "tops";
  else if (path.includes("shirt-size-converter")) context.category = "shirts";
  else if (path.includes("jeans-size-converter") || path.includes("/jeans/")) context.category = "jeans";
  else if (path.includes("dress-size-converter") || path.includes("/dresses/")) context.category = "dresses";
  else if (path.includes("jacket-size-converter") || path.includes("/jackets/")) context.category = "jackets";
  else if (path.includes("pants-size-converter") || path.includes("/pants/")) context.category = "pants";

  const pairMatch = path.match(/(us|uk|eu|jp|cn|kr|au|international)-to-(us|uk|eu|jp|cn|kr|au|international)/);
  if (pairMatch) {
    const fromCode = pairMatch[1] === "international" ? "intl" : pairMatch[1];
    const toCode = pairMatch[2] === "international" ? "intl" : pairMatch[2];
    const from = systems.find((system) => system.code.toLowerCase() === fromCode)?.code;
    const to = systems.find((system) => system.code.toLowerCase() === toCode)?.code;
    if (from && to) context.pair = [from, to];
  }
  return context;
}

function SystemFlag({ code }: { code: SystemCode }) {
  if (code === "INTL") return <span className="intl-mark" aria-label="International sizing">INTL</span>;
  if (code === "US") {
    return (
      <svg className="system-flag" viewBox="0 0 32 20" role="img" aria-label="United States flag">
        <rect width="32" height="20" fill="#fff" />
        <path fill="#c7474f" d="M0 0h32v2H0zm0 4h32v2H0zm0 4h32v2H0zm0 4h32v2H0zm0 4h32v2H0z" />
        <rect width="14" height="11" fill="#31517a" />
        <path fill="#fff2c8" d="m3 2 .5 1h1l-.8.6.3 1L3 4l-1 .6.4-1-.8-.6h1L3 2Zm5 0 .5 1h1l-.8.6.3 1L8 4l-1 .6.4-1-.8-.6h1L8 2Zm-2.5 3 .5 1h1l-.8.6.3 1-1-.6-1 .6.4-1-.8-.6h1l.4-1Zm5 0 .5 1h1l-.8.6.3 1-1-.6-1 .6.4-1-.8-.6h1l.4-1ZM3 8l.5 1h1l-.8.6.3 1-1-.6-1 .6.4-1-.8-.6h1L3 8Z" />
      </svg>
    );
  }
  if (code === "UK") {
    return (
      <svg className="system-flag" viewBox="0 0 32 20" role="img" aria-label="United Kingdom flag">
        <rect width="32" height="20" fill="#304d7b" />
        <path fill="#fff" d="M0 0h5l27 16v4h-5L0 4V0Zm27 0h5v4L5 20H0v-4L27 0Z" />
        <path fill="#c5444b" d="M0 0h2l30 18v2h-2L0 2V0Zm30 0h2v2L2 20H0v-2L30 0Z" />
        <path fill="#fff" d="M12 0h8v20h-8zM0 6h32v8H0z" />
        <path fill="#c5444b" d="M14 0h4v20h-4zM0 8h32v4H0z" />
      </svg>
    );
  }
  if (code === "EU") {
    return (
      <svg className="system-flag" viewBox="0 0 32 20" role="img" aria-label="European Union flag">
        <rect width="32" height="20" fill="#3153a3" />
        <g fill="#f4cf59">
          <circle cx="16" cy="4.4" r="1" /><circle cx="19.6" cy="5.5" r="1" /><circle cx="21.6" cy="8.5" r="1" />
          <circle cx="21.1" cy="12.1" r="1" /><circle cx="18.4" cy="14.8" r="1" /><circle cx="14.9" cy="15.4" r="1" />
          <circle cx="11.4" cy="14.1" r="1" /><circle cx="9.6" cy="11" r="1" /><circle cx="10.2" cy="7.5" r="1" />
          <circle cx="12.9" cy="5.1" r="1" />
        </g>
      </svg>
    );
  }
  if (code === "JP") {
    return <svg className="system-flag" viewBox="0 0 32 20" role="img" aria-label="Japan flag"><rect width="32" height="20" fill="#fff" /><circle cx="16" cy="10" r="5.5" fill="#bc4147" /></svg>;
  }
  if (code === "CN") {
    return (
      <svg className="system-flag" viewBox="0 0 32 20" role="img" aria-label="China flag">
        <rect width="32" height="20" fill="#c84446" />
        <path fill="#f4d35e" d="m6 3 .8 2.1 2.2.1-1.7 1.3.6 2.1L6 7.4l-1.8 1.2.6-2.1L3.1 5.2l2.2-.1L6 3Zm5.3.8.3.9 1 .1-.8.5.3 1-.8-.6-.8.6.3-1-.8-.5 1-.1.3-.9Zm1.8 2 .3.9 1 .1-.8.5.3 1-.8-.6-.8.6.3-1-.8-.5 1-.1.3-.9Zm-.1 3 .3.9 1 .1-.8.5.3 1-.8-.6-.8.6.3-1-.8-.5 1-.1.3-.9Zm-1.7 2.3.3.9 1 .1-.8.5.3 1-.8-.6-.8.6.3-1-.8-.5 1-.1.3-.9Z" />
      </svg>
    );
  }
  if (code === "KR") {
    return (
      <svg className="system-flag" viewBox="0 0 32 20" role="img" aria-label="South Korea flag">
        <rect width="32" height="20" fill="#fff" />
        <path fill="#c84d55" d="M16 4a6 6 0 0 1 0 12 3 3 0 0 0 0-6 3 3 0 0 1 0-6Z" />
        <path fill="#315483" d="M16 16a6 6 0 0 1 0-12 3 3 0 0 0 0 6 3 3 0 0 1 0 6Z" />
        <path stroke="#252d35" strokeWidth="1.3" d="m5 4 4 4m-4 0 4-4m14 8 4 4m-4 0 4-4" />
      </svg>
    );
  }
  return (
    <svg className="system-flag" viewBox="0 0 32 20" role="img" aria-label="Australia flag">
      <rect width="32" height="20" fill="#285084" />
      <rect width="13" height="9" fill="#fff" />
      <path fill="#c84850" d="M0 0h2l11 7v2h-2L0 2V0Zm11 0h2v2L2 9H0V7L11 0Z" />
      <path fill="#fff" d="M5 0h3v9H5zM0 3h13v3H0z" />
      <path fill="#c84850" d="M6 0h1v9H6zM0 4h13v1H0z" />
      <circle cx="22" cy="13" r="1.2" fill="#fff2c8" />
      <circle cx="27" cy="6" r=".8" fill="#fff2c8" />
      <circle cx="17" cy="5" r=".8" fill="#fff2c8" />
      <circle cx="26" cy="16" r=".8" fill="#fff2c8" />
    </svg>
  );
}

function RouteBreadcrumbs({ route }: { route: NonNullable<ReturnType<typeof getRouteDefinition>> }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <a href="/" >Home</a>
      {route.kind !== "home" && <><span aria-hidden="true">/</span><a href="/clothing-size-converter/">Clothing size converter</a></>}
      {route.kind !== "home" && <><span aria-hidden="true">/</span><span aria-current="page">{route.title.replace(/ \| BestieBox$/, "")}</span></>}
    </nav>
  );
}

function RouteDetails({ route, unit }: { route: NonNullable<ReturnType<typeof getRouteDefinition>>; unit: Unit }) {
  if (route.kind === "size") {
    const row = getRouteRow(route);
    const dataset = route.gender && route.category ? getDataset(route.gender, route.category) : undefined;
    const rowIndex = dataset && row ? dataset.rows.findIndex((item) => item.id === row.id) : -1;
    const nearby = dataset && row ? [dataset.rows[rowIndex - 1], dataset.rows[rowIndex + 1]].filter(Boolean) : [];
    const nearbyRoutes = nearby.map((nearRow) => routeDefinitions.find((candidate) =>
      candidate.kind === "size" && candidate.gender === route.gender &&
      candidate.category === route.category && candidate.from === route.from &&
      candidate.to === route.to && candidate.rowId === nearRow.id,
    )).filter(Boolean);
    const fromSize = row && route.from ? row.sizes[route.from] ?? route.size : route.size;
    const toSize = row && route.to ? row.sizes[route.to] : undefined;
    const measurements = row ? Object.entries(row.body) as Array<[MeasurementKey, { min: number; max: number }]> : [];
    return (
      <section className="route-details" aria-labelledby="route-details-heading">
        <div className="route-details-copy">
          <span className="eyebrow"><span className="eyebrow-mark" />Size guide notes</span>
          <h2 id="route-details-heading">{fromSize && route.from ? `${getSystemShortName(route.from)} ${fromSize}` : "This clothing size"}{toSize && route.to ? ` to ${getSystemShortName(route.to)} ${toSize}` : ""}</h2>
          <p>{route.description} The mapping comes from a general guide row, not a guarantee that two garments will fit the same.</p>
          {nearbyRoutes.length > 0 && (
            <nav className="neighbor-links" aria-label="Nearby size guides">
              <span>Nearby guide rows</span>
              {nearbyRoutes.map((nearRoute) => <a key={nearRoute!.path} href={nearRoute!.path}>{nearRoute!.size} <ArrowRightIcon width={13} height={13} /></a>)}
            </nav>
          )}
        </div>
        {measurements.length > 0 && (
          <div className="route-table-wrap">
            <table className="measurement-table">
              <caption>Body measurements for this guide row</caption>
              <thead><tr><th scope="col">Measurement</th><th scope="col">{route.from ? `${getSystemShortName(route.from)} ${fromSize ?? ""}` : "Guide row"}</th><th scope="col">{route.to ? `${getSystemShortName(route.to)} ${toSize ?? "—"}` : "Body range"}</th></tr></thead>
              <tbody>{measurements.map(([key, range]) => <tr key={key}><th scope="row">{measurementNames[key]}</th><td>{formatRange(range, unit)}</td><td>{formatRange(range, unit)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="route-faq">
          <h3>Common questions</h3>
          <details><summary>Is this size conversion exact?</summary><p>No. It is an approximate comparison between general size-guide rows. Brands and garment cuts vary.</p></details>
          <details><summary>Which measurements matter for this size?</summary><p>{measurements.map(([key, range]) => `${measurementNames[key]} ${formatRange(range, unit)}`).join("; ") || "Check the retailer's chart for the garment."} Compare your own measurements with the retailer’s chart.</p></details>
          <details><summary>Should I order based only on this conversion?</summary><p>No. Use the measurement range as context and check the retailer’s own chart before ordering.</p></details>
        </div>
      </section>
    );
  }

  if (route.kind === "pair") {
    return (
      <section className="route-details pair-details">
        <div>
          <span className="eyebrow"><span className="eyebrow-mark" />Country-pair guide</span>
          <h2>{route.from} and {route.to} labels, with measurement context.</h2>
          <p>{route.description} Select a garment category above to see its matching rows and body measurements.</p>
          <p>BestieBox compares available rows for each category. Labels are approximate; use the body ranges as the more useful reference.</p>
        </div>
        <nav className="neighbor-links" aria-label="Related size guides">
          <a href="/mens-size-converter/">Men’s size guide <ArrowRightIcon width={13} height={13} /></a>
          <a href="/womens-size-converter/">Women’s size guide <ArrowRightIcon width={13} height={13} /></a>
          <a href="/how-we-calculate/">How conversions are calculated <ArrowRightIcon width={13} height={13} /></a>
        </nav>
      </section>
    );
  }
  return null;
}

function AdSlot({ placement }: { placement: "result" | "footer" }) {
  if (!ADS_ENABLED) return <div className={`ad-slot ad-slot-${placement}`} aria-hidden="true" />;
  return <aside className={`ad-slot ad-slot-${placement}`} aria-label="Advertisement" />;
}

function App() {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const pathname = location.pathname;
  const initialContext = routeContext(pathname);
  const initialGender = initialContext.gender ?? "men";
  const initialCategory = initialContext.category ?? "tops";
  const initialFrom = initialContext.pair?.[0] ?? readPreferredSystem();
  const initialTo = initialContext.pair?.[1] ?? (initialFrom === "US" ? "EU" : "US");
  const initialSize = initialContext.size ?? defaultSizeFor(initialGender, initialCategory, initialFrom);
  const [gender, setGender] = useState<Gender>(initialGender);
  const [category, setCategory] = useState<Category>(initialCategory);
  const [mode, setMode] = useState<Mode>(initialContext.mode ?? "convert");
  const [unit, setUnit] = useState<Unit>(() => {
    try {
      return window.localStorage.getItem("bestiebox-unit") === "in" ? "in" : "cm";
    } catch {
      return "cm";
    }
  });
  const [themeOverride, setThemeOverride] = useState<ThemeOverride>(null);
  const [systemDark, setSystemDark] = useState(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  const isDark = themeOverride ?? systemDark;
  const [fromSystem, setFromSystem] = useState<SystemCode>(initialFrom);
  const [toSystem, setToSystem] = useState<SystemCode>(initialTo);
  const [convertSize, setConvertSize] = useState(initialSize);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(() => {
    if (initialContext.size || pathname === "/") {
      return convertSizeLabel({
        gender: initialGender,
        category: initialCategory,
        from: initialFrom,
        size: initialSize,
        to: initialTo,
      });
    }
    return null;
  });
  const [finderValues, setFinderValues] = useState<Partial<Record<MeasurementKey, string>>>({});
  const [finderResult, setFinderResult] = useState<FinderResult | null>(null);
  const [compareSelections, setCompareSelections] = useState<SizeSelection[]>([
    { system: "US", size: "" },
    { system: "UK", size: "" },
  ]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [recentSizes, setRecentSizes] = useState<RecentSize[]>(readRecentSizes);
  const activeRoute = getRouteDefinition(pathname);
  const activeDataset = getDataset(gender, category);
  const categoryOptions = categories.filter((item) => gender === "women" || item.value !== "dresses");

  const navigate = (path: string) => {
    if (path === pathname) return;
    routerNavigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const convertOptions = useMemo(() => getSizeOptions(gender, category, fromSystem), [gender, category, fromSystem]);
  const requiredKeys = useMemo(() => requiredMeasurements(gender, category), [gender, category]);

  useEffect(() => {
    const context = routeContext(pathname);
    if (context.gender) setGender(context.gender);
    if (context.category) setCategory(context.category);
    if (context.mode) setMode(context.mode);
    if (context.pair) {
      updateFromSystem(context.pair[0]);
      setToSystem(context.pair[1]);
    }
    if (context.size) {
      const resolvedGender = context.gender ?? gender;
      const resolvedCategory = context.category ?? category;
      const resolvedFrom = context.pair?.[0] ?? fromSystem;
      const resolvedTo = context.pair?.[1] ?? toSystem;
      setConvertSize(context.size);
      setConversionResult(convertSizeLabel({
        gender: resolvedGender,
        category: resolvedCategory,
        from: resolvedFrom,
        size: context.size,
        to: resolvedTo,
      }));
    } else {
      setConversionResult(null);
    }
    setFinderResult(null);
    setComparisonResult(null);
  }, [pathname]);

  useEffect(() => {
    if (convertOptions.length && !convertOptions.includes(convertSize)) setConvertSize(convertOptions[0]);
  }, [convertOptions, convertSize]);

  useEffect(() => {
    setCompareSelections((current) => {
      let changed = false;
      const next = current.map((selection) => {
        const options = getSizeOptions(gender, category, selection.system);
        if (options.length && !options.includes(selection.size)) {
          changed = true;
          return { ...selection, size: options[0] };
        }
        return selection;
      });
      return changed ? next : current;
    });
  }, [gender, category]);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const update = () => setSystemDark(media.matches);
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, [isDark, themeOverride]);

  function updateFromSystem(nextSystem: SystemCode) {
    setFromSystem(nextSystem);
    try {
      window.localStorage.setItem("bestiebox-from-system", nextSystem);
    } catch {
      // The selected system remains active for this session if storage is blocked.
    }
  }

  function rememberRecentSize() {
    const item = { gender, category, system: fromSystem, size: convertSize };
    const next = [item, ...recentSizes.filter((recent) =>
      !(recent.gender === item.gender && recent.category === item.category &&
        recent.system === item.system && recent.size === item.size),
    )].slice(0, 6);
    setRecentSizes(next);
    try {
      window.localStorage.setItem("bestiebox-recent-sizes", JSON.stringify(next));
    } catch {
      // Recent sizes remain available for this session if storage is blocked.
    }
  }

  function changeUnit(nextUnit: Unit) {
    if (nextUnit === unit) return;
    setFinderValues((current) => {
      const converted: Partial<Record<MeasurementKey, string>> = {};
      Object.entries(current).forEach(([key, raw]) => {
        const value = Number.parseFloat(raw ?? "");
        if (!Number.isFinite(value)) return;
        const nextValue = nextUnit === "in" ? value / 2.54 : value * 2.54;
        converted[key as MeasurementKey] = nextUnit === "in" ? nextValue.toFixed(1) : String(Math.round(nextValue));
      });
      return converted;
    });
    setUnit(nextUnit);
    try {
      window.localStorage.setItem("bestiebox-unit", nextUnit);
    } catch {
      // Unit preference remains active in memory when storage is unavailable.
    }
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    const route = nextMode === "convert" ? "/clothing-size-converter" : nextMode === "find" ? "/find-my-clothing-size" : "/compare-clothing-sizes";
    navigate(route);
  }

  function submitConversion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = convertSizeEngine({ gender, category, from: fromSystem, size: convertSize, to: toSystem });
    setConversionResult(result);
    setCopied(false);
    rememberRecentSize();
  }

  function updateFinderValue(key: MeasurementKey, value: string) {
    setFinderValues((current) => ({ ...current, [key]: value }));
    setFinderResult(null);
  }

  function submitFinder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const measurements: Partial<Record<MeasurementKey, number>> = {};
    Object.entries(finderValues).forEach(([key, value]) => {
      if (value !== undefined && value.trim() !== "") measurements[key as MeasurementKey] = Number.parseFloat(value);
    });
    const result = findSizeFromMeasurements({ gender, category, measurements, unit });
    setFinderResult(result);
    setCopied(false);
  }

  function updateCompare(index: number, field: "system" | "size", value: string) {
    setCompareSelections((current) => current.map((selection, selectionIndex) => {
      if (selectionIndex !== index) return selection;
      if (field === "system") {
        const system = value as SystemCode;
        const options = getSizeOptions(gender, category, system);
        return { system, size: options[0] ?? "M" };
      }
      return { ...selection, size: value };
    }));
    setComparisonResult(null);
  }

  function addCompareColumn() {
    if (compareSelections.length >= 4) return;
    const nextSystem = systems.find((system) => !compareSelections.some((selection) => selection.system === system.code))?.code ?? "INTL";
    const options = getSizeOptions(gender, category, nextSystem);
    setCompareSelections((current) => [...current, { system: nextSystem, size: options[0] ?? "M" }]);
    setComparisonResult(null);
  }

  function removeCompareColumn(index: number) {
    if (compareSelections.length <= 2) return;
    setCompareSelections((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setComparisonResult(null);
  }

  function submitComparison(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setComparisonResult(compareSizes(compareSelections, gender, category));
    setCopied(false);
  }

  function getShareLines(): string[] {
    const categoryLabel = categories.find((item) => item.value === category)?.label ?? "Clothing";
    if (mode === "convert" && conversionResult) {
      const headline = conversionResult.ok
        ? `${getSystemShortName(fromSystem)} ${convertSize} → ${getSystemShortName(toSystem)} ${conversionResult.targetSize}`
        : conversionResult.message;
      const body = conversionResult.row
        ? Object.entries(conversionResult.row.body).map(([key, range]) => `${measurementNames[key as MeasurementKey]}: ${formatRange(range, unit)}`)
        : [];
      return ["BestieBox size context", `${gender === "women" ? "Women’s" : "Men’s"} ${categoryLabel}`, headline, ...body, approximationNote];
    }
    if (mode === "find" && finderResult) {
      const recs = systems.flatMap((system) => finderResult.recommendations[system.code]
        ? [`${system.name}: ${finderResult.recommendations[system.code]}`]
        : []);
      const body = Object.entries(finderResult.matchedRanges).map(([key, range]) => `${measurementNames[key as MeasurementKey]}: ${formatRange(range, unit)}`);
      return ["BestieBox size context", `${gender === "women" ? "Women’s" : "Men’s"} ${categoryLabel}`, finderResult.row ? `Guide row: ${finderResult.row.intl}` : finderResult.message, ...recs, ...body, approximationNote];
    }
    if (mode === "compare" && comparisonResult) {
      const headings = comparisonResult.rows.map(({ selection }) => `${getSystemShortName(selection.system)} ${selection.size}`);
      const measurementLines = comparisonResult.measurements.map((key) => {
        const values = comparisonResult.rows.map(({ row }) => row ? formatRange(row.body[key], unit) : "—");
        return `${measurementNames[key]}: ${values.join(" | ")}`;
      });
      return ["BestieBox size context", `${gender === "women" ? "Women’s" : "Men’s"} ${categoryLabel}`, headings.join(" | "), ...measurementLines, approximationNote];
    }
    return [];
  }

  async function copyResult() {
    const text = getShareLines().join("\n");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "true");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const success = document.execCommand("copy");
      document.body.removeChild(field);
      setCopied(success);
    }
    window.setTimeout(() => setCopied(false), 2400);
  }

  function downloadResult() {
    const lines = getShareLines();
    if (!lines.length) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1350;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#f7f3e9";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#245a48";
    context.fillRect(0, 0, canvas.width, 19);
    context.fillStyle = "#e57b56";
    context.beginPath();
    context.arc(1050, 160, 110, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#203c35";
    context.font = "600 34px Georgia, serif";
    context.fillText("BestieBox", 92, 115);
    context.fillStyle = "#597069";
    context.font = "700 17px sans-serif";
    context.fillText("SIZE LABELS, WITH BODY CONTEXT", 92, 155);

    let y = 250;
    lines.slice(1).forEach((line, index) => {
      if (line === approximationNote) return;
      context.fillStyle = index === 0 ? "#203c35" : "#405b4f";
      context.font = index === 0 ? "600 42px Georgia, serif" : "500 24px sans-serif";
      const words = line.split(" ");
      let row = "";
      words.forEach((word) => {
        const test = row ? `${row} ${word}` : word;
        if (context.measureText(test).width > 990 && row) {
          context.fillText(row, 92, y);
          y += index === 0 ? 56 : 42;
          row = word;
        } else row = test;
      });
      context.fillText(row, 92, y);
      y += index === 0 ? 74 : 48;
    });
    context.fillStyle = "#dce4d7";
    context.fillRect(92, 1090, 1016, 1);
    context.fillStyle = "#597069";
    context.font = "500 19px sans-serif";
    const noteWords = approximationNote.split(" ");
    let noteLine = "";
    let noteY = 1140;
    noteWords.forEach((word) => {
      const test = noteLine ? `${noteLine} ${word}` : word;
      if (context.measureText(test).width > 1010 && noteLine) {
        context.fillText(noteLine, 92, noteY);
        noteLine = word;
        noteY += 31;
      } else noteLine = test;
    });
    context.fillText(noteLine, 92, noteY);
    context.fillStyle = "#245a48";
    context.font = "700 15px sans-serif";
    context.fillText("bestiebox · fit context, not a perfect equivalence", 92, 1285);
    const link = document.createElement("a");
    link.download = "bestiebox-size-context.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  const hasResult = (mode === "convert" && Boolean(conversionResult))
    || (mode === "find" && Boolean(finderResult))
    || (mode === "compare" && Boolean(comparisonResult));

  return (
    <div className="app-shell">
      <div className="page-wrap">
        <header className="topbar">
          <button className="brand" type="button" onClick={() => navigate("/")} aria-label="BestieBox home">
            <span className="brand-mark"><BestieMark width={24} height={24} /></span>
            <span><span className="brand-name">BestieBox</span><span className="brand-caption">size context, together</span></span>
          </button>
          <div className="header-actions">
            <button className="text-link" type="button" onClick={() => navigate("/how-we-calculate")}>How it works</button>
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setThemeOverride(!isDark)}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </header>

        <main>
          {activeRoute ? <>
          <section className="intro">
            <span className="eyebrow"><span className="eyebrow-mark" />{activeRoute.kind === "home" ? "A better fitting-room sidekick" : "BestieBox size guide"}</span>
            <h1>{activeRoute.kind === "home" ? "Clothing Size Comparison Tool" : activeRoute.title.replace(/ \| BestieBox$/, "")}</h1>
            <p className="intro-copy">{activeRoute.kind === "home"
              ? "Compare clothing sizes across countries with body measurements to make unfamiliar labels easier to understand."
              : activeRoute.description}</p>
            <div className="intro-aside"><RulerIcon width={19} height={19} /> Approximate labels, supported by body measurements.</div>
          </section>
          <RouteBreadcrumbs route={activeRoute} />

          <section className="workspace" aria-label="Clothing size tool" data-category={category}>
            <div className="workspace-top">
              <div className="mode-tabs" role="tablist" aria-label="Choose a size tool">
                <button className="mode-tab" type="button" role="tab" aria-selected={mode === "convert"} onClick={() => switchMode("convert")}>
                  <ArrowLeftRightIcon width={17} height={17} /> Convert
                </button>
                <button className="mode-tab" type="button" role="tab" aria-selected={mode === "find"} onClick={() => switchMode("find")}>
                  <RulerIcon width={17} height={17} /> Find my size
                </button>
                <button className="mode-tab" type="button" role="tab" aria-selected={mode === "compare"} onClick={() => switchMode("compare")}>
                  <CompareIcon width={17} height={17} /> Compare
                </button>
              </div>
              <div className="unit-control" role="group" aria-label="Measurement unit">
                <span className="unit-label">BODY UNITS</span>
                <button className="unit-button" type="button" aria-pressed={unit === "cm"} onClick={() => changeUnit("cm")}>cm</button>
                <button className="unit-button" type="button" aria-pressed={unit === "in"} onClick={() => changeUnit("in")}>in</button>
              </div>
            </div>

            <div className="workspace-context">
              <div className="context-group">
                <span className="field-label">Fit guide</span>
                <div className="segmented" role="group" aria-label="Fit guide">
                  <button className="segment-button" type="button" aria-pressed={gender === "women"} onClick={() => { setGender("women"); setConversionResult(null); setFinderResult(null); setComparisonResult(null); }}>Women</button>
                  <button className="segment-button" type="button" aria-pressed={gender === "men"} onClick={() => { setGender("men"); if (category === "dresses") setCategory("tops"); setConversionResult(null); setFinderResult(null); setComparisonResult(null); }}>Men</button>
                </div>
              </div>
            </div>
            <div className="category-picker" role="group" aria-label="Clothing category">
              {categoryOptions.map((item) => (
                <button
                  className="category-tile"
                  type="button"
                  key={item.value}
                  data-category={item.value}
                  aria-pressed={category === item.value}
                  onClick={() => { setCategory(item.value); setConversionResult(null); setFinderResult(null); setComparisonResult(null); }}
                >
                  <span className="category-icon-tile"><CategoryGlyph category={item.value} /></span>
                  <span>{item.shortLabel}</span>
                </button>
              ))}
            </div>

            <div className="workspace-content">
              <section className="input-panel" aria-label={`${mode} controls`}>
                {mode === "convert" && (
                  <form onSubmit={submitConversion}>
                    <div className="panel-heading">
                      <div><h2>Translate a label</h2><p className="panel-subtitle">Start with the size on the tag or product page.</p></div>
                    </div>
                    <div className="convert-flow">
                      <div className="field">
                        <label htmlFor="from-system">From</label>
                        <div className="system-select-wrap">
                          <SystemFlag code={fromSystem} />
                          <select id="from-system" value={fromSystem} onChange={(event) => { updateFromSystem(event.target.value as SystemCode); setConversionResult(null); }}>
                            {systems.map((system) => <option key={system.code} value={system.code}>{system.name}</option>)}
                          </select>
                          <ChevronDownIcon width={15} height={15} />
                        </div>
                      </div>
                      <button className="swap-button" type="button" onClick={() => { updateFromSystem(toSystem); setToSystem(fromSystem); setConversionResult(null); }} aria-label="Swap sizing systems">
                        <ArrowLeftRightIcon width={17} height={17} />
                      </button>
                      <div className="field">
                        <label htmlFor="to-system">To</label>
                        <div className="system-select-wrap">
                          <SystemFlag code={toSystem} />
                          <select id="to-system" value={toSystem} onChange={(event) => { setToSystem(event.target.value as SystemCode); setConversionResult(null); }}>
                            {systems.map((system) => <option key={system.code} value={system.code}>{system.name}</option>)}
                          </select>
                          <ChevronDownIcon width={15} height={15} />
                        </div>
                      </div>
                    </div>
                    <div className="field" style={{ marginTop: 15 }}>
                      <label htmlFor="tag-size">Size on the label</label>
                      <div className="select-wrap">
                        <select id="tag-size" value={convertSize} onChange={(event) => { setConvertSize(event.target.value); setConversionResult(null); }} required disabled={!convertOptions.length}>
                          {convertOptions.length ? convertOptions.map((size) => <option key={size} value={size}>{size}</option>) : <option value="">No sizes listed</option>}
                        </select>
                        <ChevronDownIcon width={15} height={15} />
                      </div>
                    </div>
                    {recentSizes.some((item) => item.gender === gender && item.category === category && item.system === fromSystem) && (
                      <div className="recent-sizes" aria-label="Recently used sizes">
                        <span>Recent</span>
                        {recentSizes.filter((item) => item.gender === gender && item.category === category && item.system === fromSystem).slice(0, 4).map((item) => (
                          <button type="button" key={`${item.system}-${item.size}`} onClick={() => { setConvertSize(item.size); setConversionResult(convertSizeLabel({ gender, category, from: fromSystem, size: item.size, to: toSystem })); }}>
                            {item.size}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="button-row">
                      <button className="primary-button" type="submit" disabled={!convertOptions.length}>Show size context <ArrowRightIcon width={17} height={17} /></button>
                    </div>
                    <p className="help-copy">Country labels don’t map perfectly. We’ll show the closest guide row and its measurement range.</p>
                  </form>
                )}

                {mode === "find" && (
                  <form onSubmit={submitFinder}>
                    <div className="panel-heading">
                      <div><h2>Start with your measurements</h2><p className="panel-subtitle">A soft tape measure is handy. Keep it relaxed, not pulled tight.</p></div>
                    </div>
                    <div className="finder-fields">
                      {requiredKeys.map((key) => (
                        <div className="field" key={key}>
                          <label htmlFor={`measure-${key}`}>{measurementNames[key]} <span aria-hidden="true">*</span></label>
                          <input
                            id={`measure-${key}`}
                            type="number"
                            inputMode="decimal"
                            min="1"
                            step="any"
                            placeholder={unit === "cm" ? "e.g. 92" : "e.g. 36"}
                            value={finderValues[key] ?? ""}
                            onChange={(event) => updateFinderValue(key, event.target.value)}
                            aria-invalid={Boolean(finderResult?.errors[key])}
                            aria-describedby={finderResult?.errors[key] ? `error-${key}` : `help-${key}`}
                          />
                          {finderResult?.errors[key]
                            ? <span className="help-copy" id={`error-${key}`} role="alert">{finderResult.errors[key]}</span>
                            : <span className="help-copy" id={`help-${key}`}>{unit === "cm" ? "Measure around the fullest point." : "Measure around the fullest point."}</span>}
                        </div>
                      ))}
                      {(category === "jeans" || category === "pants" ? ["inseam", "height"] as MeasurementKey[] : ["height"] as MeasurementKey[]).map((key) => (
                        <div className="field" key={key}>
                          <label htmlFor={`measure-${key}`}>{measurementNames[key]} <span className="optional-label">(optional)</span></label>
                          <input
                            id={`measure-${key}`}
                            type="number"
                            inputMode="decimal"
                            min="1"
                            step="any"
                            placeholder={unit === "cm" ? "e.g. 170" : "e.g. 67"}
                            value={finderValues[key] ?? ""}
                            onChange={(event) => updateFinderValue(key, event.target.value)}
                            aria-invalid={Boolean(finderResult?.errors[key])}
                            aria-describedby={finderResult?.errors[key] ? `error-${key}` : `help-${key}`}
                          />
                          {finderResult?.errors[key] && <span className="help-copy" id={`error-${key}`} role="alert">{finderResult.errors[key]}</span>}
                        </div>
                      ))}
                    </div>
                    <div className="button-row">
                      <button className="primary-button" type="submit">Find my guide row <ArrowRightIcon width={17} height={17} /></button>
                    </div>
                    <details className="measure-help">
                      <summary>How to measure</summary>
                      <div className="measure-diagrams">
                        <div>
                          <svg viewBox="0 0 84 84" role="img" aria-label="Tape measure around the upper body">
                            <path fill="currentColor" opacity=".2" d="M31 13h22l10 9-6 13-6-3v34H33V32l-6 3-6-13 10-9Z" />
                            <path d="M24 34c11 7 25 7 36 0" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
                          </svg>
                          <span>Chest or bust: wrap around the fullest point.</span>
                        </div>
                        <div>
                          <svg viewBox="0 0 84 84" role="img" aria-label="Tape measure around the waist">
                            <path fill="currentColor" opacity=".2" d="M31 10h22l5 18-5 9 7 34H24l7-34-5-9 5-18Z" />
                            <path d="M28 38c8 5 20 5 28 0" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
                          </svg>
                          <span>Waist and hips: measure without pulling the tape tight.</span>
                        </div>
                      </div>
                    </details>
                    <p className="help-copy">Your measurements stay in this browser; they aren’t sent anywhere.</p>
                  </form>
                )}

                {mode === "compare" && (
                  <form onSubmit={submitComparison}>
                    <div className="panel-heading">
                      <div><h2>Put labels side by side</h2><p className="panel-subtitle">Compare 2–4 guide rows by the body ranges behind them.</p></div>
                    </div>
                    <div className="compare-list">
                      {compareSelections.map((selection, index) => {
                        const options = getSizeOptions(gender, category, selection.system);
                        return (
                          <div className="compare-select-row" key={`compare-${index}`}>
                            <div className="field">
                              <label htmlFor={`compare-system-${index}`}>Sizing system {index + 1}</label>
                              <div className="select-wrap">
                                <select id={`compare-system-${index}`} value={selection.system} onChange={(event) => updateCompare(index, "system", event.target.value)}>
                                  {systems.map((system) => <option key={system.code} value={system.code}>{system.name}</option>)}
                                </select>
                                <ChevronDownIcon width={15} height={15} />
                              </div>
                            </div>
                            <div className="field">
                              <label htmlFor={`compare-size-${index}`}>Size</label>
                              <div className="select-wrap">
                                <select id={`compare-size-${index}`} value={selection.size} onChange={(event) => updateCompare(index, "size", event.target.value)} disabled={!options.length}>
                                  {options.length ? options.map((size) => <option key={size} value={size}>{size}</option>) : <option value="">No sizes</option>}
                                </select>
                                <ChevronDownIcon width={15} height={15} />
                              </div>
                            </div>
                            {compareSelections.length > 2 && (
                              <button className="remove-button" type="button" onClick={() => removeCompareColumn(index)} aria-label={`Remove sizing system ${index + 1}`}><MinusIcon width={16} height={16} /></button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {compareSelections.length < 4 && <button className="add-row" type="button" onClick={addCompareColumn}><PlusIcon width={16} height={16} /> Add a sizing system</button>}
                    <div className="button-row">
                      <button className="primary-button" type="submit">Compare body context <ArrowRightIcon width={17} height={17} /></button>
                    </div>
                  </form>
                )}
              </section>

              <section className="result-panel" aria-label="Size context results" aria-live="polite" aria-atomic="true">
                {!hasResult && (
                  <div className="result-empty">
                    <span className="empty-stamp"><DotGridIcon width={28} height={28} /></span>
                    <span className="result-label"><span className="eyebrow-mark" />Your results, with context</span>
                    <h2 className="empty-title">Less guessing. More useful numbers.</h2>
                    <p className="empty-copy">Choose a label, share your measurements, or compare a few sizes. We’ll show the body ranges behind the guide.</p>
                  </div>
                )}

                {mode === "convert" && conversionResult && (
                  <div>
                    <span className="result-label"><span className="eyebrow-mark" />Closest guide label</span>
                    {conversionResult.ok
                      ? <h2 className="result-title"><SystemFlag code={fromSystem} /> <span>{getSystemShortName(fromSystem)} {convertSize}</span><span className="arrow-inline">→</span><SystemFlag code={toSystem} /> <span>{getSystemShortName(toSystem)} {conversionResult.targetSize}</span></h2>
                      : <h2 className="result-title">No matching label yet</h2>}
                    <p className="result-deck">{conversionResult.ok ? "Use the measurement ranges below as your anchor; the target label is a guide, not an exact equivalent." : "Try a listed size or another sizing system to see the available guide context."}</p>
                    {!conversionResult.ok && <div className="result-error" role="status">{conversionResult.message}</div>}
                    {conversionResult.row && (
                      <div className="measurements">
                        {Object.entries(conversionResult.row.body).map(([key, range]) => (
                          <div className="measurement-chip" key={key}><span>{measurementNames[key as MeasurementKey]}</span><span>{formatRange(range, unit)}</span></div>
                        ))}
                      </div>
                    )}
                    <Approximation />
                    <ResultTools copied={copied} onCopy={copyResult} onDownload={downloadResult} />
                  </div>
                )}

                {mode === "find" && finderResult && (
                  <div>
                    <span className="result-label"><span className="eyebrow-mark" />Your measurement match</span>
                    {finderResult.row
                      ? <h2 className="result-title">Guide row <em>{finderResult.row.intl}</em></h2>
                      : <h2 className="result-title">Check your measurements</h2>}
                    {finderResult.message.replace(approximationNote, "").trim() && <p className="result-deck">{finderResult.message.replace(approximationNote, "").trim()}</p>}
                    {finderResult.ok && (
                      <>
                        <p className="result-deck">This row’s body ranges are a useful place to start. Here are the labels shown in each sizing system.</p>
                        <div className="measurements">
                          {systems.flatMap((system) => finderResult.recommendations[system.code]
                            ? [<div className="measurement-chip" key={system.code}><span>{system.name}</span><span>{finderResult.recommendations[system.code]}</span></div>]
                            : [])}
                        </div>
                        <div className="find-note">
                          {Object.entries(finderResult.matchedRanges).map(([key, range]) => `${measurementNames[key as MeasurementKey]} ${formatRange(range, unit)}`).join(" · ")}
                        </div>
                      </>
                    )}
                    {Object.keys(finderResult.errors).length > 0 && (
                      <div className="result-error" role="alert">{Object.values(finderResult.errors).filter(Boolean).join(" ")}</div>
                    )}
                    <Approximation />
                    <ResultTools copied={copied} onCopy={copyResult} onDownload={downloadResult} />
                  </div>
                )}

                {mode === "compare" && comparisonResult && (
                  <div>
                    <span className="result-label"><span className="eyebrow-mark" />Body ranges side by side</span>
                    <h2 className="result-title">Same body. Different labels.</h2>
                    {comparisonResult.error
                      ? <div className="result-error" role="status">{comparisonResult.error}</div>
                      : <div className="compare-results">
                        <table className="compare-table">
                          <thead>
                            <tr>
                              <th scope="col">Measurement</th>
                              {comparisonResult.rows.map(({ selection }, index) => (
                                <th scope="col" key={`head-${index}`}>
                                  <span className="column-heading"><span><SystemFlag code={selection.system} /> {getSystemShortName(selection.system)} {selection.size}</span><small>{getSystemName(selection.system)}</small></span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonResult.measurements.map((key) => (
                              <tr key={key}>
                                <td>{measurementNames[key]}</td>
                                {comparisonResult.rows.map(({ row }, index) => <td key={`${key}-${index}`}>{row ? formatRange(row.body[key], unit) : "—"}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>}
                    <p className="result-deck">These ranges explain the guide rows; they don’t promise that two labels fit identically.</p>
                    <Approximation />
                    <ResultTools copied={copied} onCopy={copyResult} onDownload={downloadResult} />
                  </div>
                )}
              </section>
            </div>
          </section>

          {pathname === "/how-we-calculate" && (
            <section className="method-section" id="how-we-calculate">
              <div>
                <span className="eyebrow"><span className="eyebrow-mark" />A note on the numbers</span>
                <h2>Clothing sizes are a guide, not a universal language.</h2>
                <p>BestieBox uses the supplied size-guide rows and their body-measurement ranges. We match the selected country label to a guide row, then show the body context attached to that row.</p>
              </div>
              <ul className="method-points">
                <li><span className="point-number">01</span><span>We compare the available labels in the chosen category and sizing system.</span></li>
                <li><span className="point-number">02</span><span>When you enter measurements, we look for guide ranges that contain them and show a nearby row when they fall between.</span></li>
                <li><span className="point-number">03</span><span>Fit and sizing vary by brand, garment cut, and fabric. Check the retailer’s own chart before ordering.</span></li>
              </ul>
            </section>
          )}

          <section className="guide-section" aria-label="Size guide routes">
            <div className="guide-intro">
              <span className="eyebrow"><span className="eyebrow-mark" />Go straight to a guide</span>
              <h2>Pick up where you’re shopping.</h2>
              <p>Same handy tools, ready for a specific clothing type or task.</p>
            </div>
            <nav className="guide-links" aria-label="More BestieBox size guides">
              {guides.map((guide) => (
                <button className="guide-link" type="button" key={guide.path} onClick={() => navigate(guide.path)}>
                  <ArrowRightIcon width={14} height={14} />{guide.label}
                </button>
              ))}
            </nav>
          </section>
        </main>

        <footer className="footer">
          <span className="footer-brand"><BestieMark width={16} height={16} /> BestieBox</span>
          <span>Helpful size context for a world that shops everywhere.</span>
          <div className="footer-links">
            <button type="button" onClick={() => navigate("/how-we-calculate")}>How we calculate</button>
            <button type="button" onClick={() => navigate("/")}>Back to tool</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function convertSizeEngine(input: { gender: Gender; category: Category; from: SystemCode; size: string; to: SystemCode }) {
  return convertSizeLabel(input);
}

function Approximation() {
  return <p className="approx-note"><InfoIcon width={15} height={15} />{approximationNote}</p>;
}

function ResultTools({ copied, onCopy, onDownload }: { copied: boolean; onCopy: () => void; onDownload: () => void }) {
  return (
    <div className="result-tools">
      <button className="quiet-button" type="button" onClick={onCopy}>{copied ? <CheckIcon width={15} height={15} /> : <CopyIcon width={15} height={15} />}{copied ? "Copied" : "Copy as text"}</button>
      <button className="quiet-button" type="button" onClick={onDownload}><DownloadIcon width={15} height={15} />Download PNG</button>
      {copied && <span className="copied-label" role="status">Ready to paste</span>}
    </div>
  );
}

export default App;
