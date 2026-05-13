import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import type { Product, ProductOfferVariant } from "@/data/products";

export interface DashboardRow {
  offer_id: string;
  product_id: string;
  shop_id: string;
  site_slug: string;
  category_slug: string;
  product_slug: string;
  brand: string;
  product_name: string;
  flavor_name?: string | null;
  image_url: string | null;
  size_grams: number;
  protein_per_100g: number;
  shop_slug: string;
  shop_name: string;
  shop_base_url: string;
  offer_url: string;
  resolved_affiliate_url: string;
  product_price: number;
  list_price: number | null;
  discount_pct: number | null;
  price_per_gram_protein: number;
  price_per_serving_30g_protein: number;
  kcal_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  scraped_at: string;
}

export interface OfferHistoryPoint {
  offer_id: string;
  price_date: string;
  price: number;
}

export interface DealTier {
  label: string;
  min_cents_per_gram: number;
  max_cents_per_gram: number | null;
  text_color: string;
  bg_color: string;
  priority: number;
}

export interface ProductVariantPrice {
  variant_id: string;
  product_id: string;
  shop_id: string;
  variant_label: string;
  flavor: string | null;
  pack_size_grams: number;
  product_price: number;
  price_per_kg_product: number;
  resolved_affiliate_url: string;
  /** Per-variant (scraped); anders gebruikt de UI de hoofdrij. */
  proteinPer100g?: number;
  kcalPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  priceHistory?: Array<{ date: string; price: number }>;
}

const SITE_SLUG = "protein-nl";

/** Zelfde fysieke PDP: host + pad, zonder query/hash (variation zit in query). */
function canonicalPdpKey(offerUrl: string, resolvedUrl: string): string {
  const raw = (offerUrl || "").trim() || (resolvedUrl || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    const path = u.pathname.replace(/\/+$/, "") || "/";
    return `${u.hostname.toLowerCase()}${path}`;
  } catch {
    return "";
  }
}

/** Affiliate-link kan generiek zijn zonder `variation=`; geef dan voorkeur aan de PDP-URL. */
function pickShopAffiliateUrl(resolved: string, offer: string): string {
  const o = (offer || "").trim();
  const r = (resolved || "").trim();
  if (o.includes("variation=") && !r.includes("variation=")) return o;
  return r || o;
}

function commonDisplayTitle(names: string[]): string {
  const t = names.map((n) => n.trim()).filter(Boolean);
  if (t.length === 0) return "";
  const prefixes = t.map((n) => {
    const dash = n.split(/\s+-\s+/);
    return dash[0]?.trim() || n;
  });
  const p0 = prefixes[0]!;
  if (prefixes.every((p) => p === p0)) return p0;
  return t.reduce((a, b) => (a.length <= b.length ? a : b));
}

function dashboardRowToOfferVariant(
  r: DashboardRow,
  historyByOffer: Map<string, OfferHistoryPoint[]>,
): ProductOfferVariant {
  return {
    offerId: r.offer_id,
    productId: r.product_id,
    shopId: r.shop_id,
    displayName: r.product_name,
    flavorDisplay: r.flavor_name ?? null,
    sizeGrams: r.size_grams,
    price: r.product_price,
    affiliateDiscountPct: r.discount_pct ?? undefined,
    proteinPer100g: r.protein_per_100g,
    affiliateUrl: pickShopAffiliateUrl(r.resolved_affiliate_url, r.offer_url),
    history: (historyByOffer.get(r.offer_id) ?? []).map((p) => ({
      date: p.price_date,
      price: p.price,
    })),
    nutrition: {
      kcal: r.kcal_per_100g ?? 0,
      carbs: r.carbs_per_100g ?? 0,
      fat: r.fat_per_100g ?? 0,
    },
  };
}

function groupRowsByPdp(rows: DashboardRow[]): DashboardRow[][] {
  const map = new Map<string, DashboardRow[]>();
  for (const r of rows) {
    const pdp = canonicalPdpKey(r.offer_url, r.resolved_affiliate_url);
    const key =
      pdp.length > 0 ? `${r.shop_id}::${pdp}` : `${r.shop_id}::slug:${r.product_slug}`;
    const list = map.get(key) ?? [];
    list.push(r);
    map.set(key, list);
  }
  return [...map.values()].map((group) => {
    const seen = new Set<string>();
    return group.filter((row) => {
      if (seen.has(row.offer_id)) return false;
      seen.add(row.offer_id);
      return true;
    });
  });
}

export async function fetchDashboardRows(category?: string): Promise<DashboardRow[]> {
  try {
    if (!hasSupabaseConfig || !supabase) {
      return [];
    }

    let query = supabase
      .from("v_dashboard_rows_compact")
      .select("*")
      .eq("site_slug", SITE_SLUG)
      .order("price_per_gram_protein", { ascending: true });

    if (category) {
      query = query.eq("category_slug", category);
    }

    const { data, error } = await query.limit(500);

    if (error) {
      return [];
    }
    return (data ?? []) as DashboardRow[];
  } catch {
    return [];
  }
}

export async function fetchDashboardProducts(category?: string): Promise<Product[]> {
  try {
    const rows = await fetchDashboardRows(category);
    if (!rows.length) return [];
    if (!hasSupabaseConfig || !supabase) return [];

    const offerIds = rows.map((r) => r.offer_id);
    const { data: historyData, error: historyError } = await supabase
      .from("v_offer_history_60d")
      .select("offer_id, price_date, price")
      .in("offer_id", offerIds)
      .order("price_date", { ascending: true });

    if (historyError) return [];

    const historyByOffer = new Map<string, OfferHistoryPoint[]>();
    for (const point of (historyData ?? []) as OfferHistoryPoint[]) {
      const list = historyByOffer.get(point.offer_id) ?? [];
      list.push(point);
      historyByOffer.set(point.offer_id, list);
    }

    const groups = groupRowsByPdp(rows);
    const groupsSorted = [...groups].sort((ga, gb) => {
      const bestA = Math.min(...ga.map((r) => r.price_per_gram_protein));
      const bestB = Math.min(...gb.map((r) => r.price_per_gram_protein));
      return bestA - bestB;
    });
    const products: Product[] = [];

    for (const group of groupsSorted) {
      const sorted = [...group].sort(
        (a, b) => a.price_per_gram_protein - b.price_per_gram_protein,
      );
      const best = sorted[0]!;
      const offerGroup: ProductOfferVariant[] = sorted.map((r) =>
        dashboardRowToOfferVariant(r, historyByOffer),
      );
      const sharedTitle =
        sorted.length > 1 ? commonDisplayTitle(sorted.map((r) => r.product_name)) : best.product_name;

      products.push({
        id: `${best.product_id}:${best.shop_id}:${best.offer_id}`,
        name: sharedTitle,
        brand: best.brand,
        shop: best.shop_name,
        type: best.category_slug === "creatine" ? "Creatine" : "Whey",
        category: best.category_slug === "creatine" ? "creatine" : "protein",
        thumbnail:
          best.image_url ||
          "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=120&h=120&fit=crop",
        sizeGrams: best.size_grams,
        price: best.product_price,
        affiliateDiscountPct: best.discount_pct ?? undefined,
        proteinPer100g: best.protein_per_100g,
        shippingCost: 0,
        freeShippingFrom: null,
        affiliateUrl: pickShopAffiliateUrl(best.resolved_affiliate_url, best.offer_url),
        history: (historyByOffer.get(best.offer_id) ?? []).map((p) => ({
          date: p.price_date,
          price: p.price,
        })),
        nutrition: {
          kcal: best.kcal_per_100g ?? 0,
          carbs: best.carbs_per_100g ?? 0,
          fat: best.fat_per_100g ?? 0,
        },
        offerGroup: sorted.length > 1 ? offerGroup : undefined,
      });
    }

    return products;
  } catch {
    return [];
  }
}

export async function fetchDealTiers(): Promise<DealTier[]> {
  try {
    if (!hasSupabaseConfig || !supabase) return [];
    const { data, error } = await supabase
      .from("deal_tiers")
      .select("label, min_cents_per_gram, max_cents_per_gram, text_color, bg_color, priority")
      .eq("site_slug", SITE_SLUG)
      .eq("is_active", true)
      .order("priority", { ascending: false });
    if (error) return [];
    return (data ?? []) as DealTier[];
  } catch {
    return [];
  }
}

export async function fetchProductVariants(): Promise<ProductVariantPrice[]> {
  try {
    if (!hasSupabaseConfig || !supabase) return [];
    const { data, error } = await supabase
      .from("v_product_variants_current_prices")
      .select(
        "variant_id, product_id, shop_id, variant_label, flavor, pack_size_grams, product_price, price_per_kg_product, resolved_affiliate_url",
      )
      .eq("site_slug", SITE_SLUG)
      .order("price_per_kg_product", { ascending: true });
    if (error) return [];
    return (data ?? []) as ProductVariantPrice[];
  } catch {
    return [];
  }
}

export function formatEuro(value: number, digits = 2): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
