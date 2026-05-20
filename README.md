# Lekkal

> **Lekkal** (లెక్క) — Telugu for ledger, accounts, bookkeeping.

Free, no-signup finance & bookkeeping tools that run entirely in your browser. Built for founders, freelancers, agencies, and operators who'd rather get something done than sit through another onboarding flow.

## Live tools

- **Invoice generator** (`invoice-generator.html`) — PDF invoices in seconds. Multi-currency, tax, discounts, line items, your logo. No watermark.
- **Marketing ROI calculator** (`roi-calculator.html`) — CAC, LTV, LTV:CAC, ROAS, payback period, with a unit-economics health verdict.

## Roadmap

- GST calculator (India) — CGST/SGST/IGST, inclusive vs. exclusive
- EMI calculator — monthly payment, total interest, amortization schedule
- Burn rate & runway tracker — monthly burn, runway in months, time to next raise
- Expense splitter — group expense settlement with custom shares and currencies

## Tech

- 100% static — no backend, no build step (yet)
- Vanilla HTML / CSS / JS
- Shared `styles.css` design system across pages
- PDF generation via [jsPDF](https://github.com/parallax/jsPDF) (CDN, no npm)
- Light / dark theme with localStorage persistence
- All user data stays in the browser

## SEO

Every page ships with:

- Unique `<title>`, meta description, canonical URL
- Open Graph + Twitter Card metadata
- JSON-LD structured data: `Organization`, `WebSite`, `ItemList`, `WebApplication`, `BreadcrumbList`, and `FAQPage`
- `robots.txt` with explicit allow-list for major search and AI crawlers (Google, ClaudeBot, GPTBot, PerplexityBot)
- `sitemap.xml` ready to submit to Google Search Console

Before launch:

1. Generate the three social images at 1200×630: `/og-cover.png`, `/og-invoice.png`, `/og-roi.png`
2. Verify the canonical URLs match your deploy target
3. Run [Google Rich Results Test](https://search.google.com/test/rich-results) on every page
4. Submit `sitemap.xml` to Google Search Console

## Local development

This is a static site. To preview locally:

```sh
# Any static server works. Examples:
python3 -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000`.

## Deployment

This repo is configured for **Cloudflare Workers Static Assets** out of the box. See `wrangler.toml`.

### First-time setup (one-time, ~5 minutes)

```sh
# 1. Install wrangler if you don't have it (or use npx wrangler for each command)
npm install -g wrangler

# 2. Authenticate against your Cloudflare account
wrangler login

# 3. Create the D1 database (powers the email capture API)
wrangler d1 create lekkal-db
# Copy the printed database_id and paste it into wrangler.toml,
# replacing REPLACE_WITH_DATABASE_ID_FROM_WRANGLER_OUTPUT

# 4. Apply the schema to the remote D1
wrangler d1 execute lekkal-db --remote --file=./schema.sql

# 5. Set the admin password (used to view subscribers via /api/admin/list)
wrangler secret put ADMIN_PASSWORD
# (prompt: type a strong password, press enter — secret is encrypted at rest)

# 6. Deploy
wrangler deploy
```

Wrangler reads `wrangler.toml`, uploads everything in `./` except what's listed in `.assetsignore`, and deploys to `lekkal.<your-subdomain>.workers.dev`. To attach `lekkal.com`, either:

- Open the dashboard → Workers & Pages → `lekkal` → Settings → Domains → Add Custom Domain
- Or uncomment the `[[routes]]` block in `wrangler.toml` and `wrangler deploy` again

### Subsequent deploys

Every time you change a file, ship it with:

```sh
wrangler deploy
```

### Email capture (self-hosted)

Lekkal runs its own newsletter pipeline on Cloudflare Workers + D1 — no third-party form services.

**Endpoints:**

| Path | Method | Auth | What it does |
| --- | --- | --- | --- |
| `/api/subscribe` | POST | none | Accepts `{email, source}` from the lead-capture form, validates, rate-limits per IP, inserts into D1 |
| `/api/unsubscribe?token=…` | GET | token | One-click unsubscribe (returns a branded HTML page) |
| `/api/admin/list` | GET | basic-auth | Returns stats + recent subscribers as JSON |
| `/api/admin/export.csv` | GET | basic-auth | Streams the full subscriber list as CSV |

**View your subscribers:**

```sh
# Quick browser check (Basic auth pops up)
open "https://lekkal.com/api/admin/list"

# Or curl with the admin password
curl -u admin:YOUR_ADMIN_PASSWORD https://lekkal.com/api/admin/export.csv > subs.csv

# Or query D1 directly
wrangler d1 execute lekkal-db --remote --command "SELECT count(*) FROM subscribers WHERE unsubscribed = 0"
```

**Spam defenses:**

- **Honeypot** — hidden `website` field; bots fill it, real users don't. Submissions with it filled return success silently and aren't stored
- **Rate limit** — 5 requests / IP / minute (table `rate_limits`, enforced in Worker)
- **Duplicate handling** — `UNIQUE` constraint on `email`; second attempt returns success but doesn't double-insert (no info leak about who's on the list)
- **Email validation** — basic regex + 254-char length cap before DB insert

**Schema** (see `schema.sql`):

```sql
CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  source TEXT,                     -- which tool page they signed up from
  user_agent TEXT,
  ip_country TEXT,                 -- from CF-Connecting-IP header
  created_at INTEGER NOT NULL,
  unsubscribed INTEGER DEFAULT 0,
  unsubscribed_at INTEGER,
  unsubscribe_token TEXT NOT NULL UNIQUE
);
```

### Auto-deploy on git push (recommended)

A workflow lives at `.github/workflows/deploy.yml`. It runs `wrangler deploy` on every push to `main`. Two secrets are required in your GitHub repo settings:

- `CLOUDFLARE_API_TOKEN` — create at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) with the **Edit Cloudflare Workers** template
- `CLOUDFLARE_ACCOUNT_ID` — find it in the right-hand sidebar of any Cloudflare dashboard page

Once set, every `git push` deploys.

### Other hosts (if you don't want Cloudflare)

The site is pure static. Drop the folder onto:

- **Netlify / Vercel** — drag into the dashboard or connect this repo
- **GitHub Pages** — set `main` as the source
- **S3 + CloudFront** — sync the folder, set `index.html` as the index document

## License

MIT — see [LICENSE](LICENSE).
