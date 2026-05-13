# Supabase Setup (Stap voor Stap)

Gebruik dit precies in deze volgorde.

## 1) Supabase project maken

1. Ga naar [Supabase](https://supabase.com) en klik op **New project**.
2. Kies projectnaam: `protein-nl`.
3. Wacht tot database online is.

## 2) SQL migratie uitvoeren

1. Open **SQL Editor**.
2. Open bestand `scraper-control-hub-main/supabase/migrations/20260504150000_init_schema.sql`.
3. Voer deze SQL uit.
4. Open bestand `scraper-control-hub-main/supabase/migrations/20260504162000_history_nutrition_affiliate.sql`.
5. Voer deze SQL uit.

Controle:

- tabellen `categories`, `shops`, `products`, `offers`, `offer_price_history`, `product_nutrition`, `affiliate_links`, `price_events`, `scrape_runs`, `scrape_logs` bestaan.
- views `v_dashboard_rows_compact`, `v_offer_history_60d`, `v_offer_history_events` bestaan.

## 3) Seeddata uitvoeren

1. In SQL Editor: nieuwe query.
2. Open `scraper-control-hub-main/supabase/seed.sql`.
3. Kopieer alles, plak en klik **Run**.

Controle:

- `offers` bevat rijen.
- `v_dashboard_rows_compact` geeft data terug:

```sql
select * from public.v_dashboard_rows_compact order by price_per_gram_protein asc limit 20;
```

## 4) Environment vars zetten

### Voor `protein-price-pilot-main`

Maak `.env`:

```env
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### Voor `scraper-control-hub-main`

Maak `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 5) Lokale check

1. Start beide apps met `npm run dev`.
2. Open dashboard en controleer of runs/shops zichtbaar zijn.
3. Open hoofdsite en controleer of producttabel gevuld is.
