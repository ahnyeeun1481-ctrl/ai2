# Web performance measurement and optimization

Use this guide to measure performance before changing code and to report comparable results afterward.

## Measurement protocol

- Prefer PageSpeed Insights (PSI) or Lighthouse with a recorded test date, URL, device mode (mobile/desktop), Performance score, LCP, INP/TBT, CLS, FCP, and diagnostics.
- Run more than once when possible and compare medians; lab results vary with network, cache, region, and provider load.
- Separate lab data from field/Core Web Vitals data. Do not treat one as the other.
- If PSI API quota is zero, rate-limited, or DNS/tooling fails, do not fabricate scores. Record the exact limitation and leave numeric comparison pending. Try the web UI or a local Lighthouse installation only when available and report the method.

## Diagnose before optimizing

- Use the report to identify render-blocking CSS/JS, critical request chains, oversized images, unused CSS/JS, font loading, long main-thread work, layout shifts, and cache misses.
- Inspect actual transfer size and waterfall before adding preload, preconnect, async/defer, or cache headers. Preloading unused resources can make performance worse.
- Prefer deleting genuinely unused CSS after checking selectors across all responsive breakpoints and states. Do not remove CSS based only on a single viewport or grep result.
- Use responsive/compressed images and explicit dimensions; lazy-load below-the-fold images, not the hero/LCP image.
- Load only font families/weights actually used; use `font-display` thoughtfully and avoid preloading multiple competing font files.
- Defer noncritical JavaScript, avoid duplicate handlers/requests, and reserve space for asynchronous content (e.g. skeletons) to limit CLS.
- Apply cache policies by asset type: versioned immutable assets may be cached longer; HTML and frequently changing JSON should revalidate. Do not cache private/admin/API responses publicly.

## Verify and report

- Re-run the same URLs, device modes, and method after changes. Compare numbers and diagnostics in a before/after table.
- If no valid before score exists, say so; do not claim quantified score gains. Report verified code/asset improvements separately from measured outcomes.
- Check the deployed response headers and actual asset payloads after deployment. Local file size or a successful deploy command alone is not a performance result.