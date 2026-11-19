# Al Rasikhoon — Eid Al Etihad landing page

Laravel 12 + React (Inertia, TypeScript, Tailwind) landing page with an admin dashboard to control it.

- **`/`** — the public Arabic (RTL) landing page, styled to the Eid Al Etihad 55 brand guidelines.
- **`/en`** — the same page in English (LTR). A header link switches language and keeps UTM parameters.
- **`/dashboard`** — admin: overview, leads, and a page-content editor.

## Run locally

```bash
composer install && npm install
cp .env.example .env && php artisan key:generate   # first time only
php artisan migrate --seed                          # creates the local dev admin + sample leads
php artisan storage:link
composer run dev                                    # serves on http://127.0.0.1:8000 with Vite hot reload
# optional, to test server-side rendering locally:
npm run build:ssr && php artisan inertia:start-ssr
```

The local dev admin's credentials come from `DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD` in `.env`. The seeder only runs in `local`/`testing`.

Tests: `php artisan test`

## Production (cPanel server, same flow as al-qasimia)

Live at **https://eid-al-etihad-offer.alrasikhoon.ae** (English at `/en`). Code: `github.com/ahmmedhashem/eid-al-etihad-offer`, branch `main`.

**First install.** Run once on the server as root. First create the subdomain in cPanel with its own document root.

```bash
sudo -u alrasikhoon git clone https://github.com/ahmmedhashem/eid-al-etihad-offer.git /home/alrasikhoon/eid-al-etihad-offer
bash /home/alrasikhoon/eid-al-etihad-offer/server-setup.sh eid-al-etihad-offer.alrasikhoon.ae <admin-email>
```

`server-setup.sh` does the following:
- Creates the MySQL database and user (visible in cPanel) and writes a production `.env`.
- Installs packages and builds the browser and server-render bundles.
- Runs the migrations.
- Adds a cron watchdog that keeps the server-render process running.
- Sets PHP 8.3, points the subdomain at `public/`, and requests SSL.
- Asks for the admin password.

**Every update.** Push to `main` locally, then run on the server as root:

```bash
bash /home/alrasikhoon/eid-al-etihad-offer/deploy.sh
```

`deploy.sh` puts the site in maintenance mode, pulls, installs, rebuilds, migrates, caches, and restarts the server-render process. It keeps cPanel's PHP settings in `public/.htaccess`. PHP upload limits for dashboard images live in `public/.user.ini`.

### Go-live checklist

- [ ] `.env`: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://your-domain`. `robots.txt` only allows indexing when `APP_ENV=production`.
- [ ] HTTPS enabled. Optionally add `SESSION_SECURE_COOKIE=true`.
- [ ] Database: SQLite works. For MySQL set `DB_CONNECTION=mysql` and the `DB_*` values.
- [ ] PHP limits for dashboard image uploads: `upload_max_filesize=16M`, `post_max_size=20M`. Nginx also needs `client_max_body_size 20m`.
- [ ] Compression and caching: `public/.htaccess` handles Apache. For Nginx use `deploy/nginx.conf`.
- [ ] SSR process running: view the page source and check the headline text is in the HTML.
- [ ] Mail settings (`MAIL_*`) if new leads should be emailed.
- [ ] Dashboard: upload both hero photos (2560 × 1440), the logos and the share image; replace every `[placeholder]`; add the pixel IDs.
- [ ] Submit `https://your-domain/sitemap.xml` in Google Search Console.
- [ ] Test the live page with PageSpeed Insights and Google's Rich Results Test.

> **Lighthouse on localhost shows SEO about 69. That's expected.** Outside production, `/robots.txt` blocks all crawlers so a test copy never gets indexed, and Lighthouse reports "page is blocked from indexing". In production mode, with the compression and caching rules above, the page scored Performance 97–100 · Accessibility 100 · Best Practices 100 · SEO 100 in both languages, on mobile and desktop.

## SEO and speed (built in)

- **Server-rendered landing page.** Headline, sections and form are in the first HTML response (Inertia SSR). If the render process is down, the page falls back to rendering in the browser.
- **Images are optimized on upload.** They're converted to WebP, capped at 2560px wide, and saved in 640/1280/1920px versions; each screen downloads only the size it needs, and the hero photo is preloaded.
- **Fonts.** Only the weights in use are loaded, without blocking the first paint.
- **Search metadata.** Per-language title and description, canonical and `hreflang` links, Open Graph and Twitter tags, a favicon, and a theme colour.
- **Structured data.** JSON-LD for RealEstateAgent, WebPage and FAQPage. Text with `[placeholders]` is left out automatically.
- **`/robots.txt` and `/sitemap.xml`.** Both are generated from `APP_URL`. The dashboard and login are excluded from search engines (`noindex`).

## What the dashboard controls

| Area | What you can do |
| --- | --- |
| **Overview** | Leads today / 7 days / total, leads per day, sources, status breakdown, offer countdown |
| **Leads** | Search and filter (status, source, dates), change status, add notes, delete, export CSV (opens correctly in Excel with Arabic) |
| **Page content** | Every text, list and image on the page; section order and show/hide; offer end date and countdown; co-branding logo; SEO and share image; GTM / Meta / TikTok / Snap pixels |

The editor warns about any `[placeholder]` text still visible to visitors.

## Two languages

- Each language has its own text, edited with the **العربية / English** toggle in **Page content**.
- The **hero photo is per language** (upload an Arabic and an English version).
- Fields marked **Shared** are set once for both pages: other photos, logos, phone, email, licence, offer date, countdown, map, pixels, lead-alert email, amenity icons, plan highlight and section order. Arabic stores the shared values; editing them from the English editor updates Arabic too.
- Each lead records its page language (`ar` / `en`), shown as a badge in **Leads**, filterable, and included in the CSV.
- The page tells Google the two versions are translations (`hreflang`), and English uses the guideline English fonts (Oswald headings, Noto Sans text).

## Zapier

**Dashboard → Integrations** connects the lead form to Zapier, the same way as the al-qasimia project.

1. In Zapier, create a Zap with the trigger **Webhooks by Zapier → Catch Hook** and copy its URL.
2. Paste the URL in Integrations and click **Send test lead**, so Zapier receives a sample to map fields from.
3. Tick **Send leads to Zapier** and click **Save**.

- Each new lead (Arabic or English) is posted as JSON right after the visitor gets their confirmation, so they never wait on Zapier. Failed deliveries are retried twice.
- **Fields:** `id, name, mobile, plot_type, payment_method, language, status, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid, ttclid, landing_url, referrer, page_title, page_url, ip_address, submitted_at`.
- The **Leads** page shows the Zapier status per lead (hover "Failed" to see the error). A **Send to Zapier / Resend** button appears while sending is on. The status is also in the CSV export.

## Ad tracking

- UTM parameters and click IDs (`gclid`, `fbclid`, `ttclid`) are saved with each lead. A visit that carries ad parameters always overrides earlier ones in the same session.
- On a successful submission the page fires `fbq('track','Lead')`, `ttq.track('SubmitForm')`, `snaptr('track','SIGN_UP')` and `dataLayer.push({event:'lead_submitted'})`, but only for the pixels you configured.

## Brand rules followed (Eid Al Etihad 55 guidelines)

- Noto Sans Arabic (approved secondary Arabic font) and Oswald for English, with the guideline palette.
- The official Eid Al Etihad logo is **uploaded**, never redrawn (Page content → Campaign & hero). It sits in the co-branding lock-up on a clean cream header.
- Confetti only appears around the hero frame. The frame shape follows the "home-plan" containers.

## Where things live

- `app/Support/LandingContent.php`: per-language load/save, shared fields, Arabic default copy.
- `app/Support/EnglishContent.php`: English default copy.
- `resources/js/landing/i18n.tsx`: fixed interface text (form labels, units, footer) in both languages.
- `app/Http/Controllers/LeadController.php`: public form endpoint (validation, honeypot, rate limit).
- `app/Http/Controllers/Admin/*`: dashboard. `app/Jobs/SendLeadToZapier.php`: Zapier delivery and payload.
- `resources/js/landing/*` and `resources/js/pages/landing.tsx`: the landing page.
- `resources/js/pages/admin/*` and `resources/js/admin/*`: the dashboard.
- `resources/views/app.blade.php`: RTL, fonts, SEO/Open Graph tags and pixels, rendered on the server.
