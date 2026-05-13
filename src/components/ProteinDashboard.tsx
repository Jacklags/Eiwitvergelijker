import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  X,
  SlidersHorizontal,
  Sun,
  Moon,
  Grid3X3,
  List,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  products as ALL_PRODUCTS,
  SHOPS,
  computeRow,
  type Product,
  type ProductType,
  type ComputedRow,
} from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { UserDiscountCodes, type UserCode } from "@/components/UserDiscountCodes";
import type { DealTier, ProductVariantPrice } from "@/lib/read-model";

type SortKey =
  | "pricePerGramProtein"
  | "pricePerGramProteinExShipping"
  | "price"
  | "proteinPer100g"
  | "sizeGrams"
  | "effectivePrice";
type SortDir = "asc" | "desc";
type Theme = "light" | "nixtio";
type ProteinPriceUnit = "gram" | "kilo";
type VariantViewMode = "inline" | "drawer" | "modal";

const PROTEIN_TYPES: ProductType[] = ["Whey", "Vegan", "Isolaat", "Caseïne"];

const USER_CODES_STORAGE_KEY = "eiwitindex.userCodes.v1";

interface ProteinDashboardProps {
  initialProducts?: Product[];
  initialDealTiers?: DealTier[];
  initialVariants?: ProductVariantPrice[];
}

function formatEur(n: number, digits = 2) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

function getProductIdFromRowId(rowId: string): string {
  return rowId.split(":")[0] ?? rowId;
}

function formatPackSize(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)} kg` : `${grams} g`;
}

function inferFlavor(text: string): string | null {
  const normalized = text.toLowerCase();
  const knownFlavors: Array<{ token: RegExp; label: string }> = [
    { token: /\bvanille\b|\bvanilla\b/, label: "Vanille" },
    { token: /\bchocolade\b|\bchocolate\b/, label: "Chocolade" },
    { token: /\bbanaan\b|\bbanana\b/, label: "Banaan" },
    { token: /\baardbei\b|\bstrawberry\b/, label: "Aardbei" },
    { token: /\bcookies?\b/, label: "Cookies" },
    { token: /\bneutral\b|\bnaturel\b/, label: "Naturel" },
  ];
  const hit = knownFlavors.find((entry) => entry.token.test(normalized));
  return hit?.label ?? null;
}

interface VariantVisualData extends ProductVariantPrice {
  proteinPer100g: number;
  kcalPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  priceHistory?: { date: string; price: number }[];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildStableHistory(
  history: { date: string; price: number }[],
): { date: string; price: number }[] {
  if (history.length === 0) return history;
  const result: { date: string; price: number }[] = [];
  let currentPrice = history[0]?.price ?? 0;
  let nextChangeIndex = 9;

  for (let index = 0; index < history.length; index += 1) {
    const point = history[index];
    if (index === 0) {
      currentPrice = point.price;
      result.push({ ...point, price: round2(currentPrice) });
      continue;
    }

    if (index >= nextChangeIndex) {
      const swing =
        ((Math.sin(index / 7) + Math.cos(index / 11)) * 0.055 + (index % 2 === 0 ? 0.02 : -0.015)) *
        currentPrice;
      currentPrice = Math.max(5, currentPrice + swing);
      nextChangeIndex += 8 + (index % 9);
    }

    result.push({ ...point, price: round2(currentPrice) });
  }

  return result;
}

function computeFlavorOffset(flavor: string): number {
  let hash = 0;
  for (const char of flavor) hash += char.charCodeAt(0);
  return ((hash % 7) - 3) * 0.003;
}

function buildVariantVisuals(
  row: ComputedRow,
  rawVariants: ProductVariantPrice[],
): VariantVisualData[] {
  const sourceVariants =
    rawVariants.length > 0
      ? rawVariants
      : [
          (() => {
            const inferredFlavor = inferFlavor(`${row.name} ${row.affiliateUrl}`);
            return {
              variant_id: `${row.id}-base`,
              product_id: getProductIdFromRowId(row.id),
              shop_id: row.shop,
              variant_label: formatPackSize(row.sizeGrams),
              flavor: inferredFlavor,
              pack_size_grams: row.sizeGrams,
              product_price: row.priceAfterUser,
              price_per_kg_product: round2(row.priceAfterUser / (row.sizeGrams / 1000)),
              resolved_affiliate_url: row.affiliateUrl,
            } satisfies ProductVariantPrice;
          })(),
        ];

  return sourceVariants.map((variant) => {
    const v = variant as ProductVariantPrice;
    const proteinPer100g = v.proteinPer100g ?? row.proteinPer100g;
    const syncedPrice =
      variant.pack_size_grams === row.sizeGrams ? row.priceAfterUser : variant.product_price;
    const proteinKg = (variant.pack_size_grams * proteinPer100g) / 100000;
    return {
      ...variant,
      product_price: round2(syncedPrice),
      price_per_kg_product: round2(syncedPrice / Math.max(proteinKg, 0.001)),
      proteinPer100g,
      kcalPer100g: v.kcalPer100g ?? row.nutrition.kcal,
      carbsPer100g: v.carbsPer100g ?? row.nutrition.carbs,
      fatPer100g: v.fatPer100g ?? row.nutrition.fat,
      priceHistory: v.priceHistory,
    };
  });
}

export function ProteinDashboard({
  initialProducts = [],
  initialDealTiers: _initialDealTiers = [],
  initialVariants = [],
}: ProteinDashboardProps) {
  const [activeTypes, setActiveTypes] = useState<Set<ProductType>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("pricePerGramProtein");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [shakeGrams, setShakeGrams] = useState<number>(30);
  const [theme, setTheme] = useState<Theme>("light");
  const [userCodes, setUserCodes] = useState<UserCode[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [proteinPriceUnit, setProteinPriceUnit] = useState<ProteinPriceUnit>("gram");
  const [variantViewMode, setVariantViewMode] = useState<VariantViewMode>("inline");
  const [variantPanelRow, setVariantPanelRow] = useState<ComputedRow | null>(null);
  const [variantPanelOpen, setVariantPanelOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(USER_CODES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as UserCode[];
      if (Array.isArray(parsed)) {
        setUserCodes(parsed.filter((c) => typeof c?.id === "string"));
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(USER_CODES_STORAGE_KEY, JSON.stringify(userCodes));
    } catch {
      // ignore quota errors
    }
  }, [userCodes]);

  const themeClass = theme === "nixtio" ? "theme-nixtio" : "";

  const userPctForShop = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of userCodes) {
      if (c.shop && c.pct > 0) {
        const existing = map.get(c.shop) ?? 0;
        if (c.pct > existing) map.set(c.shop, c.pct);
      }
    }
    return (shop: string) => map.get(shop) ?? 0;
  }, [userCodes]);

  const sourceProducts = initialProducts.length > 0 ? initialProducts : ALL_PRODUCTS;
  const tab = "protein";

  const rows: ComputedRow[] = useMemo(() => {
    return sourceProducts
      .filter((p) => p.category === tab)
      .map((p) => computeRow(p, userPctForShop(p.shop)))
      .filter((r) => {
        if (tab === "protein" && activeTypes.size > 0 && !activeTypes.has(r.type)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const av = a[sortKey] as number;
        const bv = b[sortKey] as number;
        return sortDir === "asc" ? av - bv : bv - av;
      });
  }, [sourceProducts, tab, activeTypes, sortKey, sortDir, userPctForShop]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const toggleSet = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const activeFilterCount = activeTypes.size;

  const resetFilters = () => {
    setActiveTypes(new Set());
  };

  const activeUserCodes = userCodes.filter((c) => c.shop && c.pct > 0);
  const variantsByProductId = useMemo(() => {
    const map = new Map<string, ProductVariantPrice[]>();
    for (const variant of initialVariants) {
      const existing = map.get(variant.product_id) ?? [];
      existing.push(variant);
      map.set(variant.product_id, existing);
    }
    return map;
  }, [initialVariants]);

  const variantsFromOfferGroups = useMemo(() => {
    const map = new Map<string, ProductVariantPrice[]>();
    for (const p of sourceProducts) {
      if (!p.offerGroup?.length) continue;
      map.set(
        p.id,
        p.offerGroup.map((v) => {
          const proteinKg = (v.sizeGrams * v.proteinPer100g) / 100000;
          return {
            variant_id: v.offerId,
            product_id: v.productId,
            shop_id: v.shopId,
            variant_label: formatPackSize(v.sizeGrams),
            flavor: v.flavorDisplay?.trim() || inferFlavor(v.displayName),
            pack_size_grams: v.sizeGrams,
            product_price: v.price,
            price_per_kg_product: round2(v.price / Math.max(proteinKg, 0.001)),
            resolved_affiliate_url: v.affiliateUrl,
            proteinPer100g: v.proteinPer100g,
            kcalPer100g: v.nutrition.kcal,
            carbsPer100g: v.nutrition.carbs,
            fatPer100g: v.nutrition.fat,
            priceHistory: v.history,
          } satisfies ProductVariantPrice;
        }),
      );
    }
    return map;
  }, [sourceProducts]);

  const resolveRowVariants = useCallback(
    (rowId: string) =>
      variantsFromOfferGroups.get(rowId) ??
      variantsByProductId.get(getProductIdFromRowId(rowId)) ??
      [],
    [variantsFromOfferGroups, variantsByProductId],
  );

  const openVariantPanel = (row: ComputedRow) => {
    setVariantPanelRow(row);
    setVariantPanelOpen(true);
  };

  return (
    <div className={`${themeClass} min-h-screen bg-background text-foreground`}>
      <header className="sticky top-0 z-20 border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground">
              <span className="text-sm font-bold text-background">P</span>
            </div>
            <div>
              <p className="text-lg font-semibold leading-none tracking-tight">Eiwit.Index</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Goedkoopste prijs per gram eiwit · Nederland
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="mr-2 hidden items-center gap-1 font-mono text-xs text-muted-foreground sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              {ALL_PRODUCTS.length} producten · {SHOPS.length} winkels
            </div>
            <button
              onClick={() => setTheme(theme === "light" ? "nixtio" : "light")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card transition-colors hover:bg-secondary"
              title={theme === "light" ? "Nixtio donker thema" : "Licht thema"}
              aria-label="Wissel thema"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4 text-accent" />
              )}
            </button>
          </div>
        </div>

        <div className="-mb-px mx-auto flex max-w-[1400px] gap-0 px-4 sm:px-6">
          <span className="border-b-2 border-foreground px-4 py-2.5 text-sm font-medium text-foreground">
            Eiwit
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 sm:px-6">
        <section className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="h-4 bg-accent px-1.5 text-[10px] text-accent-foreground hover:bg-accent">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <p className="text-sm font-semibold">Type eiwit</p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-1.5">
                  {PROTEIN_TYPES.map((t) => {
                    const active = activeTypes.has(t);
                    return (
                      <button
                        key={t}
                        onClick={() => setActiveTypes(toggleSet(activeTypes, t))}
                        className={`rounded border px-2.5 py-1 text-xs transition-colors ${
                          active
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background text-foreground hover:border-foreground"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <UserDiscountCodes shops={SHOPS} codes={userCodes} onChange={setUserCodes} />

          <div className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3">
            <Label htmlFor="shake-grams" className="text-xs text-muted-foreground">
              Shake
            </Label>
            <Input
              id="shake-grams"
              type="number"
              value={shakeGrams}
              onChange={(e) => setShakeGrams(Math.max(1, Number(e.target.value) || 0))}
              min={1}
              max={200}
              className="h-7 w-14 px-1.5 py-0 text-center font-mono text-xs"
            />
            <span className="text-xs text-muted-foreground">g</span>
          </div>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-xs">
              <X className="mr-1 h-3 w-3" /> Filters wissen
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <div className="font-mono text-xs text-muted-foreground">{rows.length} resultaten</div>
            <div className="inline-flex rounded-md border border-border">
              {(["inline", "drawer", "modal"] as VariantViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setVariantViewMode(mode)}
                  className={`inline-flex h-8 items-center px-2.5 text-[11px] ${
                    variantViewMode === mode
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground"
                  }`}
                  title={`Varianten tonen: ${mode}`}
                >
                  {mode === "inline" ? "Inline" : mode === "drawer" ? "Drawer" : "Modal"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setProteinPriceUnit(proteinPriceUnit === "gram" ? "kilo" : "gram")}
              className="rounded border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
              title="Wissel prijsweergave: per gram of per kilo eiwit"
            >
              {proteinPriceUnit === "gram" ? "€/g" : "€/kg"}
            </button>
            <div className="inline-flex rounded-md border border-border">
              <button
                onClick={() => setViewMode("table")}
                className={`inline-flex h-8 items-center px-2.5 text-xs ${
                  viewMode === "table" ? "bg-secondary text-foreground" : "text-muted-foreground"
                }`}
                aria-label="Tabelweergave"
                title="Tabelweergave"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`inline-flex h-8 items-center px-2.5 text-xs ${
                  viewMode === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground"
                }`}
                aria-label="Gridweergave"
                title="Gridweergave"
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>

        {activeUserCodes.length > 0 && (
          <section className="-mt-2 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Jouw codes
            </span>
            {activeUserCodes.map((c) => (
              <span
                key={c.id}
                className="inline-flex h-6 items-center gap-1 rounded border border-border bg-secondary/60 pl-2 pr-1 text-[11px] text-foreground"
              >
                <span className="font-medium">{c.shop}</span>
                <span className="font-mono text-muted-foreground">−{c.pct}%</span>
                <button
                  onClick={() => setUserCodes(userCodes.filter((x) => x.id !== c.id))}
                  aria-label={`Verwijder code voor ${c.shop}`}
                  className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </section>
        )}

        {viewMode === "table" ? (
          <section className="overflow-hidden rounded-md border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="border-b border-border bg-secondary/60">
                  <tr className="text-left">
                    <th className="w-8"></th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Product
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <button
                        onClick={() => toggleSort("price")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        Prijs <SortIcon k="price" />
                      </button>
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <button
                        onClick={() => toggleSort("sizeGrams")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        Hoeveelheid <SortIcon k="sizeGrams" />
                      </button>
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <button
                        onClick={() => toggleSort("pricePerGramProtein")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        Prijs/serving ({shakeGrams}g) <SortIcon k="pricePerGramProtein" />
                      </button>
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <button
                        onClick={() => toggleSort("pricePerGramProtein")}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {proteinPriceUnit === "gram"
                          ? "Prijs per gram eiwit"
                          : "Prijs per kilo eiwit"}{" "}
                        <SortIcon k="pricePerGramProtein" />
                      </button>
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Shop
                    </th>
                    <th className="px-3 py-2.5">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                        Geen producten gevonden met deze filters.
                      </td>
                    </tr>
                  )}
                  {rows.map((r, index) => {
                    const isExpanded = expanded === r.id;
                    return (
                      <RowItem
                        key={r.id}
                        row={r}
                        rowIndex={index}
                        isExpanded={isExpanded}
                        shakeGrams={shakeGrams}
                        compact
                        proteinPriceUnit={proteinPriceUnit}
                        variantViewMode={variantViewMode}
                        variants={resolveRowVariants(r.id)}
                        onOpenVariantPanel={() => openVariantPanel(r)}
                        onToggle={() => setExpanded(isExpanded ? null : r.id)}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((r) => {
              const isExpanded = expanded === r.id;
              const serving30 = r.pricePerGramProtein * shakeGrams;
              return (
                <article
                  key={r.id}
                  className="overflow-hidden rounded-md border border-border bg-card"
                >
                  <button
                    className="w-full px-4 py-3 text-left"
                    onClick={() => setExpanded(isExpanded ? null : r.id)}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={r.thumbnail}
                        alt={r.name}
                        className="h-12 w-12 rounded-md bg-muted object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.brand} · {r.shop}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Prijs</p>
                        <p className="font-mono">{formatEur(r.priceAfterUser, 2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Hoeveelheid</p>
                        <p className="font-mono">
                          {r.sizeGrams >= 1000
                            ? `${(r.sizeGrams / 1000).toFixed(r.sizeGrams % 1000 === 0 ? 0 : 1)} kg`
                            : `${r.sizeGrams} g`}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Prijs/serving ({shakeGrams}g)</p>
                        <p className="font-mono">{formatEur(serving30, 4)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          {proteinPriceUnit === "gram"
                            ? "Prijs per gram eiwit"
                            : "Prijs per kilo eiwit"}
                        </p>
                        <div className="flex items-center gap-1">
                          <p className="font-mono font-semibold">
                            {formatEur(
                              proteinPriceUnit === "gram"
                                ? r.pricePerGramProtein
                                : r.pricePerGramProtein * 1000,
                              proteinPriceUnit === "gram" ? 4 : 2,
                            )}
                          </p>
                        </div>
                        {/* subtle helper line */}
                        {proteinPriceUnit === "gram" && (
                          <p className="text-[10px] text-muted-foreground">
                            {centsPerGram.toFixed(2)} cent/gram
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground">Shop link</p>
                        <a
                          href={r.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center font-medium hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Shop <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-4">
                      <GridExpandedContent
                        row={r}
                        variantViewMode={variantViewMode}
                        variants={resolveRowVariants(r.id)}
                        onOpenVariantPanel={() => openVariantPanel(r)}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>

      {variantViewMode === "drawer" && variantPanelOpen && variantPanelRow ? (
        <div className="fixed inset-0 z-40">
          <button
            aria-label="Sluit varianten drawer"
            className="absolute inset-0 bg-black/50"
            onClick={() => setVariantPanelOpen(false)}
          />
          <aside className="absolute right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-background p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Variantoverzicht</p>
                <p className="text-xs text-muted-foreground">
                  Vergelijk de actuele varianten zonder paginawissel.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setVariantPanelOpen(false)}>
                Sluiten
              </Button>
            </div>
            <VariantPanelContent
              row={variantPanelRow}
              variants={resolveRowVariants(variantPanelRow.id)}
              variantViewMode={variantViewMode}
            />
          </aside>
        </div>
      ) : null}

      {variantViewMode === "modal" && variantPanelOpen && variantPanelRow ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button
            aria-label="Sluit varianten modal"
            className="absolute inset-0 bg-black/50"
            onClick={() => setVariantPanelOpen(false)}
          />
          <div className="relative z-50 max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-md border border-border bg-background p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Variantoverzicht</p>
                <p className="text-xs text-muted-foreground">
                  Alle varianten in een compact vergelijkingsvenster.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setVariantPanelOpen(false)}>
                Sluiten
              </Button>
            </div>
            <VariantPanelContent
              row={variantPanelRow}
              variants={resolveRowVariants(variantPanelRow.id)}
              variantViewMode={variantViewMode}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RowItem({
  row,
  rowIndex,
  isExpanded,
  shakeGrams,
  compact,
  proteinPriceUnit,
  variantViewMode,
  variants,
  onOpenVariantPanel,
  onToggle,
}: {
  row: ComputedRow;
  rowIndex: number;
  isExpanded: boolean;
  shakeGrams: number;
  compact: boolean;
  proteinPriceUnit: ProteinPriceUnit;
  variantViewMode: VariantViewMode;
  variants: ProductVariantPrice[];
  onOpenVariantPanel: () => void;
  onToggle: () => void;
}) {
  const pricePerServing30 = row.pricePerGramProtein * shakeGrams;
  const displayProteinUnitPrice =
    proteinPriceUnit === "gram" ? row.pricePerGramProtein : row.pricePerGramProtein * 1000;
  const centsPerGram = row.pricePerGramProtein * 100;
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-b transition-colors ${
          isExpanded
            ? "border-primary/50 bg-primary/15"
            : rowIndex % 2 === 0
              ? "border-border bg-card hover:bg-secondary/40"
              : "border-border bg-secondary/20 hover:bg-secondary/40"
        }`}
      >
        <td className="py-2.5 pl-3">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </td>
        <td className="px-3 py-2.5">
          <div className="flex min-w-[220px] items-center gap-3">
            <img
              src={row.thumbnail}
              alt={row.name}
              className="h-10 w-10 shrink-0 rounded-md bg-muted object-cover"
              loading="lazy"
            />
            <div className="min-w-0">
              <div className="truncate font-medium leading-tight">{row.name}</div>
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span>
                  {row.brand} · {row.shop}
                </span>
                {variants.length > 1 ? (
                  <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground">
                    {variants.length} varianten
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-3 py-2.5 font-mono">
          {formatEur(row.priceAfterUser, 2)}
        </td>
        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">
          {row.sizeGrams >= 1000
            ? `${(row.sizeGrams / 1000).toFixed(row.sizeGrams % 1000 === 0 ? 0 : 1)} kg`
            : `${row.sizeGrams} g`}
        </td>
        <td className="whitespace-nowrap px-3 py-2.5 font-mono">
          {formatEur(pricePerServing30, 2)}
        </td>
        <td className="whitespace-nowrap px-3 py-2.5 font-mono">
          <div className="leading-tight">
            <div className="flex items-center gap-1">
              <span className="font-semibold">
                {formatEur(displayProteinUnitPrice, proteinPriceUnit === "gram" ? 4 : 2)}
              </span>
            </div>
            {proteinPriceUnit === "gram" && (
              <div className="mt-0.5 text-[10px] text-muted-foreground">
                {centsPerGram.toFixed(2)} cent/gram
              </div>
            )}
          </div>
        </td>
        <td className="px-3 py-2.5 text-xs text-muted-foreground">{row.shop}</td>
        <td className="px-3 py-2.5 pr-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(row.affiliateUrl, "_blank", "noopener,noreferrer");
            }}
            className="inline-flex items-center rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition-transform duration-150 hover:scale-[1.03] hover:bg-emerald-500"
          >
            Shop <ExternalLink className="ml-1 h-3 w-3" />
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-primary/40 bg-primary/10">
          <td colSpan={compact ? 8 : 8} className="px-6 py-5">
            <GridExpandedContent
              row={row}
              variantViewMode={variantViewMode}
              variants={variants}
              onOpenVariantPanel={onOpenVariantPanel}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function VariantDetailContent({
  variants,
  selectedVariantId,
  onSelectVariant,
  showAllFlavorLines,
  onToggleAllFlavorLines,
  onOpenVariantPanel,
  variantViewMode,
}: {
  variants: VariantVisualData[];
  selectedVariantId: string | null;
  onSelectVariant: (variantId: string) => void;
  showAllFlavorLines: boolean;
  onToggleAllFlavorLines: () => void;
  onOpenVariantPanel?: () => void;
  variantViewMode: VariantViewMode;
}) {
  const selectedVariant =
    variants.find((variant) => variant.variant_id === selectedVariantId) ?? variants[0] ?? null;
  const selectedFlavor = selectedVariant?.flavor ?? variants[0]?.flavor ?? null;
  const flavorOptions = Array.from(
    new Set(variants.map((variant) => variant.flavor).filter(Boolean)),
  ) as string[];
  const visibleVariants = selectedFlavor
    ? variants.filter((variant) => variant.flavor === selectedFlavor)
    : variants;

  return (
    <div className="space-y-2 rounded-md border border-border bg-card/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="variant-flavor" className="text-[11px] text-muted-foreground">
            Smaak
          </Label>
          <select
            id="variant-flavor"
            value={selectedFlavor ?? ""}
            onChange={(event) => {
              const flavor = event.target.value;
              const firstOfFlavor =
                variants.find((variant) => variant.flavor === flavor) ?? variants[0];
              if (firstOfFlavor) onSelectVariant(firstOfFlavor.variant_id);
            }}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          >
            {flavorOptions.map((flavor) => (
              <option key={flavor} value={flavor}>
                {flavor}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showAllFlavorLines ? "default" : "outline"}
            size="sm"
            className="h-8 text-[11px]"
            onClick={onToggleAllFlavorLines}
          >
            Alle lijnen
          </Button>
          {variantViewMode !== "inline" && onOpenVariantPanel ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[11px]"
              onClick={onOpenVariantPanel}
            >
              Paneel
            </Button>
          ) : null}
        </div>
      </div>

      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Beschikbare maten
      </div>
      <div className="overflow-hidden rounded-md border border-border">
        <div className="grid grid-cols-[34px_1fr_1fr_1fr] bg-secondary/40 px-2 py-1 text-[11px] font-medium text-muted-foreground">
          <span />
          <span>Maat</span>
          <span className="text-right">Prijs</span>
          <span className="text-right">€/kg eiwit</span>
        </div>
        {visibleVariants.map((variant) => (
          <button
            key={variant.variant_id}
            onClick={() => onSelectVariant(variant.variant_id)}
            className={`grid w-full grid-cols-[34px_1fr_1fr_1fr] items-center border-t border-border px-2 py-1.5 text-left text-xs transition-colors ${
              selectedVariant?.variant_id === variant.variant_id
                ? "bg-primary/10 text-foreground"
                : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
            }`}
          >
            <span
              className={`mx-auto h-3.5 w-3.5 rounded-full border ${
                selectedVariant?.variant_id === variant.variant_id
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-muted-foreground/60"
              }`}
            />
            <span className="font-medium">{variant.variant_label}</span>
            <span className="text-right font-mono">{formatEur(variant.product_price, 2)}</span>
            <span
              className={`text-right font-mono ${
                selectedVariant?.variant_id === variant.variant_id ? "text-emerald-400" : ""
              }`}
            >
              {formatEur(variant.price_per_kg_product, 2)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function VariantPanelContent({
  row,
  variants,
  variantViewMode,
}: {
  row: ComputedRow;
  variants: ProductVariantPrice[];
  variantViewMode: VariantViewMode;
}) {
  const variantVisuals = useMemo(() => buildVariantVisuals(row, variants), [row, variants]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variantVisuals[0]?.variant_id ?? null,
  );
  const [showAllFlavorLines, setShowAllFlavorLines] = useState(false);

  useEffect(() => {
    setSelectedVariantId(variantVisuals[0]?.variant_id ?? null);
  }, [row.id, variantVisuals]);

  return (
    <VariantDetailContent
      variants={variantVisuals}
      selectedVariantId={selectedVariantId}
      onSelectVariant={setSelectedVariantId}
      showAllFlavorLines={showAllFlavorLines}
      onToggleAllFlavorLines={() => setShowAllFlavorLines((v) => !v)}
      variantViewMode={variantViewMode}
    />
  );
}

function GridExpandedContent({
  row,
  variantViewMode,
  variants,
  onOpenVariantPanel,
}: {
  row: ComputedRow;
  variantViewMode: VariantViewMode;
  variants: ProductVariantPrice[];
  onOpenVariantPanel: () => void;
}) {
  const variantVisuals = useMemo(() => buildVariantVisuals(row, variants), [row, variants]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variantVisuals[0]?.variant_id ?? null,
  );
  const [showAllFlavorLines, setShowAllFlavorLines] = useState(false);
  const [pulseValues, setPulseValues] = useState(false);

  useEffect(() => {
    setSelectedVariantId(variantVisuals[0]?.variant_id ?? null);
  }, [row.id, variantVisuals]);
  useEffect(() => {
    setPulseValues(true);
    const timer = window.setTimeout(() => setPulseValues(false), 420);
    return () => window.clearTimeout(timer);
  }, [selectedVariantId]);

  const selectedVariant =
    variantVisuals.find((variant) => variant.variant_id === selectedVariantId) ??
    variantVisuals[0] ??
    null;
  const stableHistory = useMemo(() => {
    const sel =
      variantVisuals.find((v) => v.variant_id === selectedVariantId) ?? variantVisuals[0] ?? null;
    const hist = sel?.priceHistory?.length ? sel.priceHistory : row.history;
    return buildStableHistory(hist);
  }, [variantVisuals, selectedVariantId, row.history]);
  const historySourceIsVariantOwn = useMemo(() => {
    const sel =
      variantVisuals.find((v) => v.variant_id === selectedVariantId) ?? variantVisuals[0] ?? null;
    return Boolean(sel?.priceHistory?.length);
  }, [variantVisuals, selectedVariantId]);
  const historyFactor = historySourceIsVariantOwn
    ? 1
    : selectedVariant
      ? selectedVariant.product_price / Math.max(row.priceAfterUser, 0.01)
      : 1;
  const selectedSize = selectedVariant?.pack_size_grams ?? row.sizeGrams;
  const flavorSeries = Array.from(
    new Set(variantVisuals.map((variant) => variant.flavor).filter(Boolean)),
  ).map((flavor, index) => {
    const variantForFlavor =
      variantVisuals
        .filter((variant) => variant.flavor === flavor)
        .sort(
          (a, b) =>
            Math.abs(a.pack_size_grams - selectedSize) - Math.abs(b.pack_size_grams - selectedSize),
        )[0] ?? selectedVariant;
    const factor = variantForFlavor
      ? variantForFlavor.product_price / Math.max(row.priceAfterUser, 0.01)
      : historyFactor;
    return {
      key: `flavor_${index}`,
      label: flavor ?? `Smaak ${index + 1}`,
      factor,
      color: ["#60a5fa", "#f59e0b", "#a78bfa", "#34d399", "#f87171"][index % 5],
    };
  });

  const selectedProteinKg =
    selectedVariant !== null
      ? (selectedVariant.pack_size_grams * selectedVariant.proteinPer100g) / 100000
      : Math.max((row.sizeGrams * row.proteinPer100g) / 100000, 0.001);

  const chartData = stableHistory.map((point) => {
    const entry: Record<string, number | string> = {
      date: point.date,
      selected: round2((point.price * historyFactor) / Math.max(selectedProteinKg, 0.001)),
    };
    for (const series of flavorSeries) {
      const variantForSeries =
        variantVisuals.find((variant) =>
          series.label ? variant.flavor === series.label : false,
        ) ?? selectedVariant;
      const seriesProteinKg = variantForSeries
        ? (variantForSeries.pack_size_grams * variantForSeries.proteinPer100g) / 100000
        : selectedProteinKg;
      entry[series.key] = round2((point.price * series.factor) / Math.max(seriesProteinKg, 0.001));
    }
    return entry;
  });
  const plottedValues = chartData.flatMap((entry) => {
    const values = [Number(entry.selected)];
    if (showAllFlavorLines) {
      values.push(...flavorSeries.map((series) => Number(entry[series.key])));
    }
    return values.filter((value) => Number.isFinite(value));
  });
  const maxPlottedValue = plottedValues.length > 0 ? Math.max(...plottedValues) : 100;
  const yStep = maxPlottedValue > 40 ? 15 : 10;
  const yMax = maxPlottedValue > 40 ? Math.max(60, Math.ceil(maxPlottedValue / yStep) * yStep) : 40;
  const yTicks = Array.from({ length: yMax / yStep + 1 }, (_, index) => index * yStep);

  const hasPriceDelta =
    selectedVariant !== null &&
    Math.abs(selectedVariant.product_price - row.priceAfterUser) >= 0.01;
  const hasProteinDelta =
    selectedVariant !== null &&
    Math.abs(selectedVariant.proteinPer100g - row.proteinPer100g) >= 0.1;
  const hasCarbDelta =
    selectedVariant !== null && Math.abs(selectedVariant.carbsPer100g - row.nutrition.carbs) >= 0.1;
  const hasFatDelta =
    selectedVariant !== null && Math.abs(selectedVariant.fatPer100g - row.nutrition.fat) >= 0.1;
  const hasKcalDelta =
    selectedVariant !== null && Math.abs(selectedVariant.kcalPer100g - row.nutrition.kcal) >= 1;

  const totalProteinGrams = selectedVariant
    ? (selectedVariant.pack_size_grams * selectedVariant.proteinPer100g) / 100
    : row.totalProteinGrams;
  const pulseClass = pulseValues
    ? "scale-[1.08] text-[1.02em] font-semibold bg-primary/20"
    : "scale-100 bg-transparent";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="md:col-span-2">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Prijsverloop · 60 dagen (€/kg eiwit)
        </p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="2 2" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(d) => d.slice(5)}
                interval={9}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                domain={[0, yMax]}
                ticks={yTicks}
                tickFormatter={(v) => `€${v}`}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(v) => formatEur(Number(v))}
              />
              <Line
                type="monotone"
                dataKey="selected"
                stroke="var(--foreground)"
                strokeWidth={2}
                dot={false}
              />
              {showAllFlavorLines &&
                flavorSeries.map((series) => (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    stroke={series.color}
                    strokeWidth={1.6}
                    dot={false}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3">
          <VariantDetailContent
            variants={variantVisuals}
            selectedVariantId={selectedVariantId}
            onSelectVariant={setSelectedVariantId}
            showAllFlavorLines={showAllFlavorLines}
            onToggleAllFlavorLines={() => setShowAllFlavorLines((v) => !v)}
            onOpenVariantPanel={onOpenVariantPanel}
            variantViewMode={variantViewMode}
          />
        </div>
      </div>
      <div className="h-full rounded-md border border-border bg-card/80 p-3">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Voedingswaarde · per 100g
        </p>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-border pb-1.5">
            <dt className="text-muted-foreground">Calorieën</dt>
            <dd
              className={`rounded px-1 font-mono transition-all duration-300 ${hasKcalDelta ? pulseClass : ""}`}
            >
              {selectedVariant?.kcalPer100g ?? row.nutrition.kcal} kcal
            </dd>
          </div>
          <div className="flex justify-between border-b border-border pb-1.5">
            <dt className="text-muted-foreground">Eiwit</dt>
            <dd
              className={`rounded px-1 font-mono transition-all duration-300 ${hasProteinDelta ? pulseClass : ""}`}
            >
              {selectedVariant?.proteinPer100g ?? row.proteinPer100g} g
            </dd>
          </div>
          <div className="flex justify-between border-b border-border pb-1.5">
            <dt className="text-muted-foreground">Koolhydraten</dt>
            <dd
              className={`rounded px-1 font-mono transition-all duration-300 ${hasCarbDelta ? pulseClass : ""}`}
            >
              {selectedVariant?.carbsPer100g ?? row.nutrition.carbs} g
            </dd>
          </div>
          <div className="flex justify-between border-b border-border pb-1.5">
            <dt className="text-muted-foreground">Vetten</dt>
            <dd
              className={`rounded px-1 font-mono transition-all duration-300 ${hasFatDelta ? pulseClass : ""}`}
            >
              {selectedVariant?.fatPer100g ?? row.nutrition.fat} g
            </dd>
          </div>
          <div className="flex justify-between pt-1">
            <dt className="text-muted-foreground">Totaal eiwit</dt>
            <dd className="font-mono">{Math.round(totalProteinGrams)} g</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Prijs</dt>
            <dd
              className={`rounded px-1 font-mono transition-all duration-300 ${hasPriceDelta ? pulseClass : ""}`}
            >
              {formatEur(selectedVariant?.product_price ?? row.priceAfterUser)}
            </dd>
          </div>
        </dl>
        <div className="mt-3 rounded-md border border-border bg-card/60 p-2 text-xs">
          <p className="font-medium">Klantscore</p>
          <p className="mt-1 text-muted-foreground">
            {(((row.proteinPer100g / 20 + row.nutrition.kcal / 160) % 1) + 4).toFixed(1)} / 5 op
            basis van smaak en mengbaarheid.
          </p>
        </div>
        <div className="mt-2 rounded-md border border-border bg-card/60 p-2 text-xs">
          <p className="font-medium">Ingrediënten</p>
          <p className="mt-1 text-muted-foreground">
            Concentrate / isolate blend, aroma, lecithine, zoetstof. Variant-afhankelijk.
          </p>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Variantselectie past prijs en voedingswaardes direct aan met subtiele markering.
        </p>
      </div>
    </div>
  );
}
