export type ProductType = "Whey" | "Vegan" | "Isolaat" | "Caseïne" | "Creatine";
export type Category = "protein" | "creatine";

export interface PricePoint {
  date: string;
  price: number;
}

/** Rijen onder dezelfde productpagina (zelfde shop), bv. MyProtein `?variation=`-SKU's. */
export interface ProductOfferVariant {
  offerId: string;
  productId: string;
  shopId: string;
  displayName: string;
  /** Smaak uit DB-view (`flavor_name`); heeft voorrang boven `inferFlavor`. */
  flavorDisplay?: string | null;
  sizeGrams: number;
  price: number;
  affiliateDiscountPct?: number;
  proteinPer100g: number;
  affiliateUrl: string;
  history: PricePoint[];
  nutrition: {
    kcal: number;
    carbs: number;
    fat: number;
  };
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  shop: string;
  type: ProductType;
  category: Category;
  thumbnail: string;
  sizeGrams: number;
  /** Sticker / scraped price BEFORE any discount. */
  price: number;
  /** Affiliate kickback discount that we always apply when the user goes through our link. 0–100. */
  affiliateDiscountPct?: number;
  proteinPer100g: number; // for creatine, treat as 100 (pure)
  shippingCost: number;
  freeShippingFrom: number | null;
  affiliateUrl: string;
  history: PricePoint[];
  nutrition: {
    kcal: number;
    carbs: number;
    fat: number;
  };
  /** Meerdere aanbiedingen op dezelfde PDP; UI toont één hoofdrij + uitklap-varianten. */
  offerGroup?: ProductOfferVariant[];
}

const today = new Date();
const genHistory = (base: number): PricePoint[] => {
  const arr: PricePoint[] = [];
  for (let i = 60; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const variance = (Math.sin(i / 6) + Math.cos(i / 11)) * 0.04 * base;
    arr.push({
      date: d.toISOString().slice(0, 10),
      price: Math.round((base + variance) * 100) / 100,
    });
  }
  return arr;
};

export const SHOPS = [
  "MyProtein",
  "Bulk",
  "Body&Fit",
  "XXL Nutrition",
  "Optimum Nutrition",
  "Prozis",
] as const;

export const products: Product[] = [
  {
    id: "p1",
    name: "Impact Whey Protein",
    brand: "MyProtein",
    shop: "MyProtein",
    type: "Whey",
    category: "protein",
    thumbnail: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=120&h=120&fit=crop",
    sizeGrams: 2500,
    price: 59.99,
    affiliateDiscountPct: 10,
    proteinPer100g: 80,
    shippingCost: 4.99,
    freeShippingFrom: 50,
    affiliateUrl: "#",
    history: genHistory(59.99),
    nutrition: { kcal: 412, carbs: 4.7, fat: 7.5 },
  },
  {
    id: "p2",
    name: "Whey Protein 80",
    brand: "Bulk",
    shop: "Bulk",
    type: "Whey",
    category: "protein",
    thumbnail: "https://images.unsplash.com/photo-1579722821273-0f6c1b5d0b4e?w=120&h=120&fit=crop",
    sizeGrams: 2500,
    price: 64.99,
    affiliateDiscountPct: 5,
    proteinPer100g: 82,
    shippingCost: 3.95,
    freeShippingFrom: 50,
    affiliateUrl: "#",
    history: genHistory(64.99),
    nutrition: { kcal: 408, carbs: 4.2, fat: 6.8 },
  },
  {
    id: "p3",
    name: "Whey Isolate XPS",
    brand: "XXL Nutrition",
    shop: "XXL Nutrition",
    type: "Isolaat",
    category: "protein",
    thumbnail: "https://images.unsplash.com/photo-1622818425825-c7e80edc8e6e?w=120&h=120&fit=crop",
    sizeGrams: 2000,
    price: 69.95,
    proteinPer100g: 90,
    shippingCost: 0,
    freeShippingFrom: 30,
    affiliateUrl: "#",
    history: genHistory(69.95),
    nutrition: { kcal: 384, carbs: 1.8, fat: 1.5 },
  },
  {
    id: "p4",
    name: "Vegan Protein Blend",
    brand: "Body&Fit",
    shop: "Body&Fit",
    type: "Vegan",
    category: "protein",
    thumbnail: "https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=120&h=120&fit=crop",
    sizeGrams: 1000,
    price: 27.99,
    proteinPer100g: 75,
    shippingCost: 4.95,
    freeShippingFrom: 60,
    affiliateUrl: "#",
    history: genHistory(27.99),
    nutrition: { kcal: 389, carbs: 6.2, fat: 5.1 },
  },
  {
    id: "p5",
    name: "Gold Standard 100% Whey",
    brand: "Optimum Nutrition",
    shop: "Optimum Nutrition",
    type: "Whey",
    category: "protein",
    thumbnail: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=120&h=120&fit=crop",
    sizeGrams: 2270,
    price: 84.9,
    proteinPer100g: 78,
    shippingCost: 5.95,
    freeShippingFrom: 75,
    affiliateUrl: "#",
    history: genHistory(84.9),
    nutrition: { kcal: 411, carbs: 5.5, fat: 6.2 },
  },
  {
    id: "p6",
    name: "Micellar Casein",
    brand: "Prozis",
    shop: "Prozis",
    type: "Caseïne",
    category: "protein",
    thumbnail: "https://images.unsplash.com/photo-1579722821273-0f6c1b5d0b4e?w=120&h=120&fit=crop",
    sizeGrams: 2000,
    price: 49.99,
    affiliateDiscountPct: 8,
    proteinPer100g: 84,
    shippingCost: 3.99,
    freeShippingFrom: 40,
    affiliateUrl: "#",
    history: genHistory(49.99),
    nutrition: { kcal: 360, carbs: 3.5, fat: 1.0 },
  },
  {
    id: "p7",
    name: "Pure Whey Isolate 95",
    brand: "Bulk",
    shop: "Bulk",
    type: "Isolaat",
    category: "protein",
    thumbnail: "https://images.unsplash.com/photo-1622818425825-c7e80edc8e6e?w=120&h=120&fit=crop",
    sizeGrams: 1000,
    price: 34.99,
    affiliateDiscountPct: 5,
    proteinPer100g: 92,
    shippingCost: 3.95,
    freeShippingFrom: 50,
    affiliateUrl: "#",
    history: genHistory(34.99),
    nutrition: { kcal: 376, carbs: 0.9, fat: 0.6 },
  },
  {
    id: "p8",
    name: "Pea Protein Isolate",
    brand: "MyProtein",
    shop: "MyProtein",
    type: "Vegan",
    category: "protein",
    thumbnail: "https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=120&h=120&fit=crop",
    sizeGrams: 2500,
    price: 49.99,
    affiliateDiscountPct: 10,
    proteinPer100g: 80,
    shippingCost: 4.99,
    freeShippingFrom: 50,
    affiliateUrl: "#",
    history: genHistory(49.99),
    nutrition: { kcal: 372, carbs: 1.2, fat: 6.5 },
  },
  // Creatine
  {
    id: "c1",
    name: "Creatine Monohydrate",
    brand: "MyProtein",
    shop: "MyProtein",
    type: "Creatine",
    category: "creatine",
    thumbnail: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=120&h=120&fit=crop",
    sizeGrams: 1000,
    price: 24.99,
    affiliateDiscountPct: 10,
    proteinPer100g: 100,
    shippingCost: 4.99,
    freeShippingFrom: 50,
    affiliateUrl: "#",
    history: genHistory(24.99),
    nutrition: { kcal: 0, carbs: 0, fat: 0 },
  },
  {
    id: "c2",
    name: "Creapure Creatine",
    brand: "Bulk",
    shop: "Bulk",
    type: "Creatine",
    category: "creatine",
    thumbnail: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=120&h=120&fit=crop",
    sizeGrams: 500,
    price: 19.99,
    proteinPer100g: 100,
    shippingCost: 3.95,
    freeShippingFrom: 50,
    affiliateUrl: "#",
    history: genHistory(19.99),
    nutrition: { kcal: 0, carbs: 0, fat: 0 },
  },
  {
    id: "c3",
    name: "Creatine Monohydrate Powder",
    brand: "XXL Nutrition",
    shop: "XXL Nutrition",
    type: "Creatine",
    category: "creatine",
    thumbnail: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=120&h=120&fit=crop",
    sizeGrams: 1000,
    price: 22.95,
    proteinPer100g: 100,
    shippingCost: 0,
    freeShippingFrom: 30,
    affiliateUrl: "#",
    history: genHistory(22.95),
    nutrition: { kcal: 0, carbs: 0, fat: 0 },
  },
];

export interface ComputedRow extends Product {
  /** Sticker / pre-discount price (kept for clarity even though Product.price already holds it). */
  originalPrice: number;
  /** Resolved affiliate discount percentage (0 if undefined on product). */
  affiliatePct: number;
  /** Personal user code applied to this row (0 if no matching shop code). */
  userPct: number;
  /** Price after affiliate discount, before user code. */
  priceAfterAffiliate: number;
  /** Price after both affiliate and user code, excl. shipping. */
  priceAfterUser: number;
  /** Total effective price incl. shipping (final amount the customer sees). */
  effectivePrice: number;
  /** EUR per gram of pure protein (incl. shipping). */
  pricePerGramProtein: number;
  /** EUR per gram of pure protein (excl. shipping). */
  pricePerGramProteinExShipping: number;
  totalProteinGrams: number;
  isFreeShipping: boolean;
}

/**
 * Compute a fully discounted row.
 *
 * Two discount layers are stacked multiplicatively:
 *   1. Affiliate kickback (always-on, comes from product data / backend scrape).
 *   2. Personal user code (visual only, opt-in by user, per shop).
 *
 * Free-shipping threshold is checked against the post-discount price so that
 * a discount can push an order below the free-shipping cut-off (realistic).
 */
export function computeRow(p: Product, userPct = 0): ComputedRow {
  const affiliatePct = clampPct(p.affiliateDiscountPct ?? 0);
  const userClamped = clampPct(userPct);

  const priceAfterAffiliate = p.price * (1 - affiliatePct / 100);
  const priceAfterUser = priceAfterAffiliate * (1 - userClamped / 100);

  const freeShip = p.freeShippingFrom !== null && priceAfterUser >= p.freeShippingFrom;
  const shipping = freeShip ? 0 : p.shippingCost;
  const effectivePrice = priceAfterUser + shipping;

  const totalProteinGrams = (p.sizeGrams * p.proteinPer100g) / 100;
  const pricePerGramProtein = effectivePrice / totalProteinGrams;
  const pricePerGramProteinExShipping = priceAfterUser / totalProteinGrams;

  return {
    ...p,
    originalPrice: p.price,
    affiliatePct,
    userPct: userClamped,
    priceAfterAffiliate,
    priceAfterUser,
    effectivePrice,
    pricePerGramProtein,
    pricePerGramProteinExShipping,
    totalProteinGrams,
    isFreeShipping: freeShip,
  };
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 100) return 100;
  return n;
}
