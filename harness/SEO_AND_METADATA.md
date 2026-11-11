# SEO, page metadata, and social previews

Use this guide when preparing a public website for search indexing and link sharing.

## Page titles and descriptions

- Give every indexable HTML page a unique, accurate `<title>` and concise meta description that matches its visible content.
- For a single-page site, hash sections are not separate crawlable HTML pages. Use one canonical page title/description unless real route-specific HTML is implemented.
- Admin, login, preview, and private routes should use `noindex,nofollow`; do not include them in the sitemap.
- Do not publish placeholders, bracketed prompts, example email addresses, or fabricated biography/contact details. Hide unavailable fields or ask the owner for truthful values.
- Set one canonical URL to the actual HTTPS production origin. Keep canonical, sitemap, robots, OG URL, JSON-LD URLs, and deployment hostname consistent.

## Open Graph and social cards

- Set `og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `og:image:alt`, and `twitter:card`/title/description/image as appropriate.
- Use absolute public image URLs, preferably a 1200×630 PNG/JPEG. Verify it returns the image MIME type and a successful response; ensure it is not behind auth or HTML fallback.
- Test the actual production page HTML and social crawler preview. Social platforms cache cards; use their supported debugger/cache refresh or a versioned image URL if the preview is stale.
- An SVG favicon is fine as a favicon, but do not assume every social platform supports SVG as an OG image.

## robots.txt and sitemap.xml

- `robots.txt` should reference the absolute sitemap URL for the canonical site and allow/disallow only intentionally crawlable paths.
- Include only canonical, public, indexable URLs in `sitemap.xml`; XML-escape content and keep `lastmod` truthful if present.
- Validate XML syntax and fetch both resources from production. Check `Content-Type` and body, not status alone.
- A sitemap submission is not proof of indexing. In Google Search Console, verify property ownership, submit the sitemap, then inspect the reported fetch/processing/index status later.

## Google Search Console ownership

- Use the site owner's authenticated Google account. Prefer URL-prefix property for a specific hosted origin when DNS ownership is unavailable.
- Complete verification using the exact Search Console-provided HTML file or meta token. Do not guess or reuse a stale token. Confirm the verification URL is served as the expected file/body after deployment.
- Submit the canonical sitemap URL and report the exact status shown. “Submitted” or “Processing” is not “Success”; Google may take time and does not guarantee ranking.

## Structured data

- Add JSON-LD only when it truthfully describes visible content and a valid schema type. Keep names, URLs, and sameAs links accurate.
- Validate JSON syntax and use a schema tester where possible; structured data does not guarantee rich results.