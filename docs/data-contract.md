# Data Contract (Read Side)

De frontend leest alleen uit:

- `public.v_dashboard_rows_compact`
- `public.v_offer_history_60d`
- `public.v_offer_history_events`

Verplicht aanwezige velden:

- `site_slug`
- `category_slug`
- `product_slug`
- `brand`
- `product_name`
- `image_url`
- `size_grams`
- `protein_per_100g`
- `shop_slug`
- `shop_name`
- `shop_base_url`
- `resolved_affiliate_url`
- `product_price`
- `list_price`
- `discount_pct`
- `price_per_gram_protein`
- `price_per_serving_30g_protein`
- `scraped_at`

MVP rankingregel:

- sortering op `price_per_gram_protein` (alleen productprijs, zonder verzending).
