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

Drop the contents of this folder onto any static host:

- Cloudflare Pages, Netlify, Vercel — drag the folder into the dashboard or connect this repo
- GitHub Pages — set `main` as the source
- S3 + CloudFront — sync the folder, set `index.html` as the index document

No build step is required.

## License

MIT — see [LICENSE](LICENSE).
