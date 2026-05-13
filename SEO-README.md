# SEO-README — Eiwit.Index

Dit document bundelt **SEO-richtlijnen** en een **backlog** om later in de codebase te verwerken. Vul het onderste gedeelte aan met bevindingen van testtools (Lighthouse, PageSpeed Insights, Ahrefs, Screaming Frog, enz.); werk items af door ze te verplaatsen naar “Verwerkt” of door ze te verwijderen.

---

## 1. Basis (al ingebouwd of snel te controleren)

| Onderwerp             | Status / tip                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Statische HTML**    | Astro levert echte HTML; intro + tabel staan in de eerste response — goed voor crawlers.                          |
| `**site` in Astro\*\* | Zet in `astro.config.mjs` het echte productiedomein (`site`); canonical, OG-url en sitemap volgen daarna.         |
| `**lang="nl"`\*\*     | Staat op `<html>` in `Layout.astro`.                                                                              |
| **Canonical**         | Per pagina via `Layout.astro` (`canonicalPath`).                                                                  |
| **Meta description**  | Uniek per pagina; geen duplicate titles/descriptions op nieuwe routes.                                            |
| **Sitemap**           | `@astrojs/sitemap`; na deploy controleren of `sitemap-index.xml` bereikbaar is en in Search Console is ingediend. |
| **Structured data**   | JSON-LD `WebSite` + `WebPage`; uitbreiden met `Product` / `ItemList` als je product-URL’s echt worden.            |
| **404**               | `404.astro` met `noindex` — voorkomt indexering van fout-URL’s.                                                   |

---

## 2. Tips om later te verwerken (suggesties)

Gebruik deze lijst als interne backlog. Vink af of verplaats naar sectie **7** (Verwerkt) wanneer gedaan.

### Content & structuur

- **Eigen `og:image`** (1200×630, liefst WebP of geoptimaliseerd) in `Layout.astro` — nu ontbreekt een vaste social preview; concurrent zet `og:image:width`, `og:image:height`, `og:image:alt`, `og:image:type`.
- **Meta description-lengte**: tools verschillen (tekens vs. pixels in SERP); houd copy leesbaar en onderscheidend — zie ook §4.1 (Seobility: pixelbreedte title/description).
- **Keywords consistent in title + description + H1/H2**: primaire termen (bijv. _eiwit vergelijken_, _whey_, _creatine_, _Nederland_) logisch verdelen — titelwoorden ook in **H1** waar natuurlijk (Seobility flagde “sommige titelwoorden niet in H1” bij benchmark).
- **H1 per pagina**: precies **één H1**; geen dubbele H1-teksten of visueel verborgen dubbeling (zie §4.3).
- **Unieke heading-teksten**: geen dubbele H2/H3-strings op dezelfde pagina; heading-hiërarchie in verhouding tot tekstlengte (zie §4.3).
- **Long-tail**: overweeg statische pagina’s per categorie of merk (`/vergelijk/whey`, `/merk/myprotein`) met unieke tekst — alleen als inhoud echt toegevoegde waarde heeft.
- **Interne links**: unieke, beschrijvende ankerteksten; geen lege links (Seobility: links zonder ankertekst) — zie §4.4.
- **FAQ-sectie + FAQ-schema** (`FAQPage` JSON-LD) — eventueel **één vraag per supplementcategorie** met link naar een korte gids (zie benchmark §3).
- **Methodologie / “Hoe berekenen we €/g eiwit?”** — kort blok op homepage of categoriepagina’s (zie §3).

### Technisch

- `**robots.txt`**: in `public/robots.txt` met link naar sitemap; **controleren\*\* dat `Disallow`-regels geen belangrijke assets of pagina’s blokkeren.
- **Render-blocking resources**: CSS/JS die eerste paint vertragen minimaliseren (volgorde, `defer`, kritieke CSS, Astro splitsing).
- **Server response time / TTFB**: Seobility hanteert strikte richtlijn (zie §4.5); hosting, caching, edge, database/API achter de pagina optimaliseren.
- **Laadtijd & Core Web Vitals**: streef naar **LCP onder 2,5 s**, **FCP ruim onder richtlijn**, **TTFB zo laag mogelijk**; andere tool waarschuwde voor **meer dan 5 s** totale laadtijd als conversierisico.
- `**llms.txt` / GEO\*\*: overweeg root `llms.txt` (en duidelijke entiteit/organisatie in schema) voor AI/LLM-crawlers — zie §5.3.
- **LocalBusiness-schema**: alleen zinvol bij fysiek lokale business / Google Bedrijfsprofiel-koppeling; anders overslaan — zie §5.9.
- **Social proof in footer**: consistente links naar actieve profielen (Facebook, X, YouTube, LinkedIn) als je die echt onderhoudt — zie §5.8.
- **PageSpeed / lab vs. field**: zware lab-cijfers (VS-servers) naast CrUX/CWV blijven monitoren; redirects, unused CSS/JS aanpakken — zie §5.6–5.7.
- **Modern image format**: WebP/AVIF voor hero en thumbnails waar mogelijk; externe Unsplash-URL’s eventueel via build/CDN transformeren of eigen gehoste assets.
- **Afbeeldingen**: `srcset` / `sizes`; **alt** op alle betekenisvolle images; decoratief: lege `alt=""` of CSS (Seobility: ontbrekende `alt` bij benchmark).
- **DOM-grootte**: grote pagina’s vertragen TTI; lazy/hydrate zware UI’s (`client:visible` i.p.v. `client:load` waar UX het toelaat).
- **HTML-payload**: gzip/brotli; slankere markup (Seobility: HTML-bestand ~390 kB bij benchmark nog “fine”, maar elke KB telt).
- **Aantal HTTP-requests**: bundelen, minder third-parties — zie §3.1 stress-test concurrent.
- **CDN**: statische assets via hosting met edge caching.
- `**target="_blank"`**: altijd `**rel="noopener noreferrer"`\*\* op externe links.
- **JavaScript / console errors**: 0 errors in productie.
- **Preconnect / DNS-prefetch** voor kritieke externe domeinen (alleen als nodig).
- **HSTS**: `Strict-Transport-Security` op server/edge.
- **Verberg `X-Powered-By`**: stack-fingerprint verminderen (Seobility: waarschuwing als header aanwezig) — hosting/framework config.
- **Hreflang**: alleen bij meerdere talen/regio’s; anders geen fake alternate links nodig (Seobility: “geen alternate” = ok voor single-language).

### Trust & juridisch (NL)

- **Affiliate / advertentie**: duidelijke vermelding — E-E-A-T en AVG.
- **Contact, (team)bio’s, methodologie**: credibility — zie §3.2.
- **Privacy / cookiebanner** als je analytics of marketingpixels toevoegt.

### Search Console & analytics

- Property aanmaken; sitemap indienen.
- (Optioneel) **GA4** of privacy-vriendelijk alternatief — met consent.

### Off-page (niet in repo, wél backlog)

- **Backlinks / referring domains**: lage autoriteit = zichtbaarheid in tools; outreach, content, partnerships (Seobility §4.6).

### Optioneel (alleen als van toepassing)

- `**ads.txt`\*\*: alleen bij programmatic ads.
- **Twitter/OG-uitbreiding**: auteur, leestijd, enz.
- **Apple Touch Icon**: meerdere formaten voor iOS bookmarks (Seobility noemde dit bij benchmark).

---

## 3. Benchmark — audit concurrent ([SEO Site Checkup](https://seositecheckup.com))

**Geteste URL (niet Eiwit.Index):** `https://gieriggroeien.nl`  
**Rapport-samenvatting:** SEO-score **68/100** (gem. in tool **~75%**); **12 failed**, **7 warnings**, **44 passed**.

Gebruik dit als **thema-checklist** — zij draaien o.a. WordPress/Elementor + veel requests.

### 3.1 Technische issues uit rapport (vertaald naar acties)

| Prioriteit in tool | Thema                                | Wat later voor Eiwit.Index                            |
| ------------------ | ------------------------------------ | ----------------------------------------------------- |
| HIGH               | Render-blocking resources            | Kritieke CSS/JS-straat optimaliseren.                 |
| HIGH               | Lange laadtijd (meer dan 5 s risico) | Hosting, caching, beeldoptimalisatie, minder JS; CWV. |
| HIGH               | Keywords in title / meta / headings  | Consistente terminologie.                             |
| HIGH               | Moderne beeldformaten                | WebP/AVIF.                                            |
| HIGH               | JavaScript errors                    | Geen runtime errors.                                  |
| MEDIUM             | Juiste beeldformaten                 | `width`/`height`, `srcset`.                           |
| MEDIUM             | `target="_blank"` zonder `rel`       | `noopener` / `noreferrer`.                            |
| LOW                | Grote DOM                            | Minder nodes.                                         |
| LOW                | Grote HTML                           | Compressie + slankere markup.                         |
| LOW                | Console errors                       | DevTools schoon.                                      |
| LOW                | HSTS header                          | Server/edge.                                          |
| LOW                | Veel HTTP-requests                   | Bundling, minder third-parties.                       |

**Snelheid (referentie):** o.a. **DOM groter dan ca. 1500 nodes**, **157 requests** / **3,61 MB**, **TTFB ~1,5 s**, **FCP ~3 s**, **LCP ~3,5 s**, render-blocking, CDN-dekking, image formats.

**Server/security:** HTTPS OK; **HSTS ontbrak**; canonical + HTTP/2 OK.

### 3.2 Content & AI-insights (zelfde rapport)

| Inzicht                    | Relevant voor Eiwit.Index     |
| -------------------------- | ----------------------------- |
| Topical relevance hoog     | Kern: “prijs per gram eiwit”. |
| Expertise / credibility    | Diepgang, bronnen, updates.   |
| Methodologie per categorie | Uitleg berekening €/g.        |
| FAQ + auteur               | Zie §2.                       |

### 3.3 Positieve punten (als richting)

OG/Twitter, robots, sitemap, canonical, structured data, 404, favicon, viewport, responsive.

### 3.4 Ruwe notitie

```
Tool: SEO Site Checkup | URL: https://gieriggroeien.nl | Score: 68/100
Samenvatting: zie §3.1–3.3.
```

---

## 4. Benchmark — [Seobility SEO Checker](https://www.seobility.net/en/seocheck/) (zelfde URL)

**Geteste URL (niet Eiwit.Index):** `https://gieriggroeien.nl/`  
**Crawl:** 200 OK, **Follow / Index**, taal **NL**, **response time ~1,39 s**, HTML **~390,10 kB**, **~639 woorden**.

### 4.1 Score-overzicht per categorie (zoals in tool)

| Categorie            | Score in tool            | Interpretatie voor ons                                               |
| -------------------- | ------------------------ | -------------------------------------------------------------------- |
| **On-page (totaal)** | **76%** — **2 Critical** | Globaal: verbeterpunten op structuur + performance.                  |
| **Meta data**        | **100%**                 | Titel, description, crawl, canonical, taal-HTML: in orde op die URL. |
| **Page quality**     | **95%**                  | Tekst/structuur sterk; vooral **image alt** onderbroken.             |
| **Page structure**   | **29%**                  | **H1** en **headings** problematisch (zie 4.3).                      |
| **Links**            | **25%**                  | Vooral **interne** ankerteksten / lege links (zie 4.4).              |
| **Server**           | **78%**                  | o.a. **TTFB** + **X-Powered-By** (zie 4.5).                          |
| **External factors** | **6%**                   | **Backlink-profiel** zeer dun (zie 4.6) — niet in code op te lossen. |

### 4.2 To-do uit tool (prioriteit)

| Prioriteit  | Taak (letterlijk uit checker)                   | Les voor Eiwit.Index                                                                            |
| ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Error**   | Gebruik **slechts één H1** op de pagina.        | Één H1 per URL; geen dubbele H1-blokken (bij benchmark: twee varianten van dezelfde boodschap). |
| **Error**   | Verbeter **pagina-/server response time**.      | Hosting, cache, edge, minder zware eerste byte (API/SSR).                                       |
| **Warning** | Goede **alt**-beschrijvingen voor afbeeldingen. | Alle `<img>` met betekenis: beschrijvende `alt`; decoratief: `alt=""`.                          |
| **Warning** | Verwijder **dubbele heading-teksten**.          | Unieke H2/H3-strings; geen copy-paste koppen.                                                   |

### 4.3 Meta data — alle checks uit rapport

| Check                    | Uitkomst benchmark                                                                    | Notitie / actie Eiwit.Index                                         |
| ------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Title**                | Langte “perfect” i.s.m. **pixelbreedte** (~553/580 px); geen dubbele woorden in titel | Titel beknopt + uniek; SERP-preview testen.                         |
| **Meta description**     | “Perfect” i.s.m. **pixelbreedte** (~834/1000 px)                                      | Langere/shorter copy afstemmen op preview, niet alleen tekenteller. |
| **Crawlability**         | Geen toegangsproblemen                                                                | 200, geen onbedoelde blocks.                                        |
| **Canonical**            | Geldige canonical naar voorkeurs-URL                                                  | Zie `Layout.astro` + echte `site`.                                  |
| **Language**             | NL in tekst; `nl-nl` in HTML; serverlocatie (DE) genoemd                              | `lang` op `<html>` consistent houden.                               |
| **Alternate / hreflang** | Geen alternate links                                                                  | Normaal bij **één** taalversie.                                     |
| **rel next/prev**        | Geen pagination-meta                                                                  | Alleen relevant bij gepagineerde series.                            |
| **Domain**               | Geen subdomain; lengte ok; geen non-Latin                                             | —                                                                   |
| **Page URL**             | Geen query-parameters/sessie; niet te diepe paden                                     | Schone URL-structuur aanhouden.                                     |
| **Charset**              | UTF-8                                                                                 | Standaard behouden.                                                 |
| **Doctype**              | HTML5, doctype eerst                                                                  | Astro output ok.                                                    |
| **Favicon**              | Correct gelinkt                                                                       | `public/favicon` toevoegen als nog missing.                         |

### 4.4 Page quality — alle checks

| Check                        | Uitkomst benchmark                                               | Notitie / actie Eiwit.Index                           |
| ---------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| **Content / woorden**        | ~639 woorden “fine”; ~19% stop words                             | Genoeg bodytekst op belangrijke landingspagina’s.     |
| **Title vs. content**        | Keywords uit titel ook in content                                | Goed.                                                 |
| **Title vs. H1**             | _Sommige titelwoorden niet in H1_                                | Titel en H1 op elkaar afstemmen (natuurlijk).         |
| **Lijsten / paragrafen**     | Lijst aanwezig; meerdere paragrafen                              | Lijsten/opsomming helpen scanbaarheid.                |
| **Placeholder / duplicates** | Geen placeholder-tekst; geen duplicaat-content op site (checker) | Echte copy overal.                                    |
| **Zinlengte**                | Gemiddelde zinlengte ~14,88 woorden “good”                       | Leesbaarheid.                                         |
| **Frames**                   | Geen frameset                                                    | —                                                     |
| **Mobile**                   | Viewport; **Apple Touch Icon(s)**                                | Viewport hebben wij; touch icons optioneel toevoegen. |
| **Strong / bold**            | Gebruik “perfect”; advies tot ~13 tags op die pagina             | Niet overmatig `<strong>` voor SEO-spam.              |
| **Image SEO**                | **15 images zonder `alt`**                                       | **Warning** — structureel `alt`-beleid.               |
| **Social**                   | Pagina geoptimaliseerd voor social sharing                       | OG/Twitter aanvullen (§2).                            |
| **Additional markup**        | Geen extra markup gevonden                                       | Later: FAQ/Product schema waar relevant.              |
| **HTTPS**                    | HTTPS; geen mixed subresources                                   | Alles via HTTPS.                                      |

### 4.5 Page structure — alle checks

| Check        | Uitkomst benchmark                                                               | Notitie / actie Eiwit.Index                                                   |
| ------------ | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **H1**       | **Te veel H1** (o.a. twee variantenzelfde boodschap: caps + lowercase)           | Strikt **één H1** per pagina.                                                 |
| **Headings** | **Dubbele heading-teksten**                                                      | Unieke koppen.                                                                |
| **Headings** | **29 headings** vs. hoeveelheid tekst: verhouding “should be more in proportion” | Niet te veel koppen t.o.v. weinig copy; of meer uitlegtekst bij veel secties. |

### 4.6 Links — alle checks

| Check      | Uitkomst benchmark                                                                    | Notitie / actie Eiwit.Index                                               |
| ---------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Intern** | **Zelfde ankertekst** meerdere keren gebruikt                                         | Variatie waar het zinvol is; geen spam.                                   |
| **Intern** | **9 links zonder ankertekst**                                                         | Geen lege `<a>` of alleen icon zonder `aria-label`/tekst.                 |
| **Intern** | Aantal interne links “ok”; geen te lange ankerteksten; geen dynamische params in URLs | Houden zo.                                                                |
| **Extern** | **12 externe links** — “nice to have”                                                 | Extern: `rel` + eventueel `nofollow` voor niet-geendorsde links (beleid). |

### 4.7 Server — alle checks

| Check              | Uitkomst benchmark                                                            | Notitie / actie Eiwit.Index                                          |
| ------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **HTTP redirects** | Geen onnodige redirect op entry; **www/non-www** correct                      | Canonical-host kiezen (DNS/hosting).                                 |
| **HTTP headers**   | **X-Powered-By** aanwezig (warning)                                           | Uitzetten in server-config waar mogelijk.                            |
| **Compressie**     | Compressie aan voor transfer                                                  | Brotli/gzip op server.                                               |
| **Performance**    | **Response time traag** (~1,39 s); tool noemt richtlijn **onder circa 0,4 s** | Zie TTFB/server tuning — richtlijn is streng; elke verbetering telt. |

### 4.8 External factors — alle checks

| Check                 | Uitkomst benchmark                              | Notitie / actie Eiwit.Index            |
| --------------------- | ----------------------------------------------- | -------------------------------------- |
| **Backlinks**         | Weinig links van andere sites                   | Off-page: content, PR, samenwerkingen. |
| **Referring domains** | O.a. **2 referring domains** (cijfers uit tool) | Zelfde.                                |
| **Backlink count**    | O.a. **2 backlinks**                            | Zelfde.                                |
| **IP-diversiteit**    | Backlinks van **2 IP’s**                        | Zelfde.                                |

### 4.9 Ruwe notitie Seobility

```
Tool: Seobility SEO Checker | URL: https://gieriggroeien.nl/
On-page: 76% | Critical: 2 | Meta 100% | Quality 95% | Structure 29% | Links 25% | Server 78% | External 6%
Zie §4.1–4.8 voor volledige categorieën.
```

---

## 5. Benchmark — SEO-audit (Nederlandstalige rapport-tool)

**Geteste URL (niet Eiwit.Index):** `https://gieriggroeien.nl/`  
**Rapport aangemaakt (UTC):** 3 mei, ~14:08 UTC (zoals in export).  
**Tool:** niet expliciet benoemd in export; interface met o.a. On-page SEO, GEO, Links, Bruikbaarheid, Prestaties.

Samenvatting in het rapport: **“Je pagina zou beter kunnen”** — ondanks deels positieve on-page en CWV-tekst zijn er duidelijke verbeterpunten (H1, keywords, contentvolume, PSI, backlinks, GEO, sociaal).

### 5.1 Aanbevelingen uit het rapport (met prioriteit uit tool)

| Prioriteit    | Thema         | Aanbeveling (vertaald)                                                                                      |
| ------------- | ------------- | ----------------------------------------------------------------------------------------------------------- |
| **Hoog**      | Links         | **Linkbuildingstrategie** — off-page autoriteit versterken.                                                 |
| **Gemiddeld** | On-page       | **Verwijder dubbele H1-tags** — één H1 per pagina.                                                          |
| **Gemiddeld** | On-page       | **Hoofdsleutelwoorden in belangrijke HTML-tags** — titel, meta, headings en body beter op elkaar afstemmen. |
| **Laag**      | On-page       | **Alt-attributen** op alle afbeeldingen.                                                                    |
| **Laag**      | On-page       | **Meer tekstinhoud** — waarschuwing voor “thin content”.                                                    |
| **Laag**      | Bruikbaarheid | **PageSpeed Insights mobiel** optimaliseren.                                                                |
| **Laag**      | Bruikbaarheid | **PageSpeed Insights desktop** optimaliseren.                                                               |
| **Laag**      | Social        | **Facebook-pagina** maken en koppelen.                                                                      |
| **Laag**      | Social        | **X-profiel** maken en koppelen.                                                                            |
| **Laag**      | Social        | **YouTube-kanaal** koppelen.                                                                                |
| **Laag**      | Social        | **LinkedIn-profiel/pagina** koppelen.                                                                       |
| **Laag**      | Local SEO     | **LocalBusiness (of vergelijkbaar lokaal) schema** — alleen als lokaal relevant.                            |
| **Laag**      | Social        | **Facebook Pixel** installeren (alleen bij advertentie-/retargetingbeleid + consent).                       |
| **Laag**      | Prestaties    | **JavaScript-fouten** oplossen.                                                                             |
| **Laag**      | GEO           | `**llms.txt`\*\* implementeren (zie §5.3).                                                                  |

### 5.2 On-page SEO — detailchecks uit rapport

| Onderdeel                 | Uitkomst benchmark                                              | Les voor Eiwit.Index                                                                                                                                                        |
| ------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Titel**                 | ~**59 tekens** — binnen advies **50–60**                        | Titel blijven tunen op lengte + duidelijkheid.                                                                                                                              |
| **Meta description**      | ~**128 tekens** — binnen advies **120–160**                     | Andere tools gebruiken soms pixel- of andere limieten; dit rapport: tekenrange.                                                                                             |
| **SERP-preview**          | Alleen richtlijn; Google kan dynamisch herschrijven             | Zelf preview checken in Search Console / live SERP.                                                                                                                         |
| **Hreflang**              | Niet gebruikt                                                   | Normaal bij één taalversie; bij `.nl` + `.be` etc. wél plannen.                                                                                                             |
| `**lang`\*\*              | **nl-NL** ingesteld                                             | Consistent met `Layout.astro`.                                                                                                                                              |
| **H1**                    | **Meer dan één H1** — afkeurend                                 | Strikt één H1 (sluit aan bij §3/§4).                                                                                                                                        |
| **H2–H6**                 | **H2: 6**, **H3: 35**, H4–H6: 0                                 | Diepe H3-structuur: controleer of hiërarchie logisch is en niet “koppen voor layout”.                                                                                       |
| **Zoekwoordconsistentie** | Hoofdtermen **niet goed** verdeeld over titel / meta / headings | Matrix: belangrijkste termen ook in H1/H2 waar natuurlijk (tool noemde o.a. termen als _eiwitrijke_, _goedkoopste_, _weight gainer_, _creatine_, _pre-workout_ in content). |
| **Hoeveelheid content**   | **~216 woorden** — rapport waarschuwt voor **thin content**     | Meer unieke, nuttige copy op kernpagina’s; **let op:** andere audits noemden hogere woordentelling — verschil kan door URL, gecrawlde staat of meetmethode.                 |
| **Afbeeldingen**          | **120** afbeeldingen; **15 zonder `alt`**                       | Zelfde thema als §4: alt-beleid.                                                                                                                                            |
| **Canonical**             | Aanwezig (`https://gieriggroeien.nl/`)                          | Wij: `site` + canonical per pagina.                                                                                                                                         |
| **Noindex**               | Geen meta/header noindex op deze URL                            | Bewust inzetten alleen waar nodig (bv. 404, drafts).                                                                                                                        |
| **SSL / HTTPS-redirect**  | OK                                                              | Houden.                                                                                                                                                                     |
| **robots.txt**            | Aanwezig; pagina niet geblokkeerd                               | Controleren na deploy.                                                                                                                                                      |
| **XML-sitemap**           | `sitemap_index.xml` gevonden                                    | Meerdere sitemaps indexeren is ok.                                                                                                                                          |
| **Analytics**             | o.a. **Google Analytics** gedetecteerd                          | Bij ons: alleen met privacy/consent-beleid.                                                                                                                                 |
| **Structured data**       | **JSON-LD** aanwezig                                            | Uitbreiden waar zinvol (`Product`, `FAQPage`, `Organization`).                                                                                                              |

### 5.3 GEO (Generative / LLM-zichtbaarheid)

| Onderdeel                              | Uitkomst benchmark                                          | Les voor Eiwit.Index                                                                                        |
| -------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Algemeen**                           | GEO “kan beter”; positionering voor LLM/AI-zoek **matig**   | Toekomstige trafficbron: duidelijke feiten, entiteiten, gestructureerde data.                               |
| **Identiteitsschema**                  | **Person**-schema herkend                                   | Overweeg **Organization** + `sameAs` naar officiële profielen.                                              |
| **Weergave / leesbaarheid voor LLM’s** | **Laag** “weergegeven inhoud”; **renderingpercentage ~13%** | Minder kritieke content alleen achter zware client-JS; belangrijke uitleg in statische HTML.                |
| `**llms.txt`\*\*                       | **Niet** gevonden of niet ophaalbaar                        | Optioneel: root of `.well-known`; inhoud en formaat afstemmen op actuele richtlijnen (standaard evolueert). |

### 5.4 Links & autoriteit (off-page + on-page)

**Off-page (uit rapport):**

| Metric (rapport)     | Waarde (indicatief)            |
| -------------------- | ------------------------------ |
| Paginasterkte        | **11**                         |
| Total backlinks      | **11**                         |
| Verwijzende domeinen | **6**                          |
| Nofollow / Dofollow  | o.a. **6 / 5** (zoals getoond) |
| Edu / Gov            | **0** / **0**                  |

- **Top backlinks** genoemd o.a. Snap Fitness NL, bodybuilding.nl-forum, MensHealth.nl, regionale pers, blogs — nuttig als **voorbeelden van niches** waar content/PR kan landen.
- **Sterkste interne URL’s naar backlinks** o.a. `/creapure-crowdfund-actie/`, homepage, `/eiwitpoeder/`, blog — idee: **linkwaarde** via unieke campagnes/content.

**On-page linkstructuur:**

| Metric          | Waarde  |
| --------------- | ------- |
| Totaal links    | **197** |
| Intern          | **185** |
| Extern follow   | **12**  |
| Extern nofollow | **0**   |
| Aandeel extern  | **~6%** |

- URL’s worden als **leesbaar/vriendelijk** beoordeeld.

### 5.5 Bruikbaarheid & Core Web Vitals (field vs. lab)

**Core Web Vitals (rapport):** “geslaagd” met o.a. **LCP ~2,2 s**, **INP ~127 ms**, **CLS ~0,10**.

**PageSpeed Insights — mobiel (lab, VS-servers):** rapport zegt **slecht**; o.a.:

| Metric      | Waarde (lab) |
| ----------- | ------------ |
| FCP         | **~4,4 s**   |
| Speed Index | **~7,1 s**   |
| LCP         | **~7,4 s**   |
| TTI         | **~12,4 s**  |
| TBT         | **~0,13 s**  |
| CLS         | **~0,002**   |

**Kansen (mobiel):** meerdere redirects vermijden (~~**0,63 s**), unused CSS (~~**0,3 s**), unused JS (~**0,15 s**).

**PageSpeed Insights — desktop (lab):** eveneens **slecht**; o.a. FCP **~1 s**, SI **~2,7 s**, LCP **~2,1 s**, TTI **~3,1 s**; kans: redirects (~**0,19 s**).

**Overig bruikbaarheid:** geen Flash/geen iframes; **favicon**; geen e-mail in plain text; leesbare fontgroottes; tap targets voldoende; viewport OK.

**Les:** field (CWV) vs. lab (PSI) kan uiteenlopen — **beide** monitoren; voor Eiwit.Index: lichte eerste payload, weinig redirects, code splitting.

### 5.6 Prestaties (eigen “laadsnelheid”-blok in rapport)

| Meting                     | Waarde                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| Serverantwoord             | **~0,3 s**                                                                               |
| Alle pagina-inhoud geladen | **~7,9 s**                                                                               |
| Alle scripts compleet      | **~14,4 s**                                                                              |
| Downloadpagina (totaal)    | **~4,32 MB** (o.a. HTML ~0,07, CSS ~0,2, JS ~0,64, afbeeldingen ~**2,85**, overig ~0,56) |
| Totaal objecten            | **211** (o.a. 44 JS, 58 CSS, 94 afbeeldingen)                                            |
| Compressie                 | **~51%** (detail per type in rapport)                                                    |

- **HTTP/2+** aanbevolen protocol: **ja**.
- **JS-fouten tijdens laden:** **gemeld** — functionaliteit/scripts controleren.
- Tool meldt **geen verouderde HTML**, **geen inline styles**, **JS/CSS geminified**, **afbeeldingen geoptimaliseerd** (toch zware totaalgrootte door volume).
- **AMP:** niet ingeschakeld (optioneel; niet verplicht).

### 5.7 Social & lokale SEO (uit rapport)

| Item                      | Status benchmark                                   |
| ------------------------- | -------------------------------------------------- |
| Open Graph                | Aanwezig                                           |
| X Cards                   | Aanwezig                                           |
| Link naar Facebook-pagina | **Niet** op pagina                                 |
| Facebook Pixel            | **Niet**                                           |
| X-account link            | **Niet**                                           |
| Instagram                 | **Wel** gelinkt (`instagram.com/gieriggroeien.nl`) |
| LinkedIn / YouTube        | **Niet** gelinkt                                   |
| **LocalBusiness-schema**  | **Niet** gevonden                                  |

### 5.8 Technologie & e-mailauthenticatie (informatief)

Stack o.a. **WordPress**, **Elementor**, **jQuery**, **MonsterInsights**, **Site Kit**, **Hostinger CDN**, **HTTP/3**, **PHP 8.1** — ter vergelijking: **Eiwit.Index** is Astro + islands; minder typische WP-plugin overhead, maar zelfde SEO-thema’s (H1, alt, snelheid) blijven gelden.

**DMARC** en **SPF** in rapport als **aanwezig/geldig** genoemd — voor eigen domein later vergelijkbaar inrichten bij mail.

### 5.9 Ruwe notitie (archief)

```
Tool: NL SEO-audit (On-page / GEO / Links / Bruikbaarheid / Prestaties)
URL: https://gieriggroeien.nl/ | Datum rapport UTC: 3 mei ~14:08
Kern: dubbele H1, keyword-spreiding, thin content (~216 woorden in deze meting), 15/120 alt, zwak backlinkprofiel,
      GEO/llms.txt, PSI lab slecht vs CWV “geslaagd”, JS errors, 211 requests / ~4,3 MB.
Zie §5.1–5.9.
```

---

## 6. Jouw notities van SEO-testwebsites

Plak hier ruwe bevindingen. Later zet je concrete acties in §2 of §7.

### Sjabloon per run

```
Datum:
Tool:
URL getest:
Score of samenvatting:

Bevindingen:
-

Prioriteit (hoog/midden/laag):
```

### Mijn testruns (vul zelf aan)

#### Run — _datum invullen_

- **Tool:**
- **URL:**
- ## **Notities:**

#### Run — _datum invullen_

- **Tool:**
- **URL:**
- ## **Notities:**

---

## 7. Verwerkt (archief)

| Datum | Item | Wat gedaan |
| ----- | ---- | ---------- |
|       |      |            |

---

## 8. Handige links (referentie)

- [Google Search Central — SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Astro — SEO](https://docs.astro.build/en/guides/seo/)
- [Schema.org](https://schema.org/) (Product, ItemList, FAQPage, WebSite)
