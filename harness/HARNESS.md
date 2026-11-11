# Website architecture and Cloudflare deployment harness

This guide contains the detailed implementation and deployment checklist for static websites backed by Cloudflare Workers and D1. Project-wide entry rules are in [`../AGENTS.md`](../AGENTS.md); use the related [QA guide](QA_AND_ISSUES.md), [SEO guide](SEO_AND_METADATA.md), [performance guide](PERFORMANCE.md), [analytics guide](ANALYTICS.md), and [session retrospective trigger](SESSION_RETROSPECTIVE.md) when relevant.

## 1. Understand the project before editing

- Inspect the repository root, Git branch/status/history, framework, existing build/deploy commands, and Cloudflare account identity.
- Preserve existing files and history. Never replace a remote repository, database, or Pages/Worker project without explicit authorization.
- Identify the canonical production URL from the current configuration and a live response. Do not copy another project's domain, account ID, database ID, or Worker name.
- Keep secrets out of source, JSON files, commits, logs, screenshots, and public bundles. Use Wrangler secrets.
- Determine which directories are source, generated output, and deployment assets. Compare hashes where files are duplicated.

## 2. Front-end conventions

- Use semantic, accessible HTML, responsive CSS, progressive enhancement, and existing project conventions. Keep keyboard focus visible and respect reduced-motion preferences.
- Use absolute root paths for root-hosted static assets when nested routes could otherwise resolve relative paths incorrectly.
- Every interactive control needs a clear accessible name, keyboard behavior, and observable loading/success/error state.
- Treat visitor text and API values as untrusted. Validate server-side, use parameterized SQL, and render with `textContent`/text nodes rather than unsafe HTML insertion.
- For new-tab external links, use `rel="noopener noreferrer"` and communicate new-window behavior accessibly.

## 3. Public metadata and assets

- Each indexable HTML document needs a unique title, description, canonical URL, Open Graph metadata, and appropriate Twitter card metadata. See [SEO_AND_METADATA.md](SEO_AND_METADATA.md).
- OG images must use an absolute public URL and a supported, tested raster image where social platforms require it; verify status and MIME type.
- Keep `robots.txt` and sitemap aligned with the canonical origin. Do not sitemap admin or private routes.
- Never publish placeholder profile/contact data, local SQLite databases, backups, credentials, or private admin files unintentionally.

## 4. Workers and D1 structure

- Use an explicit Wrangler configuration with Worker entrypoint, static asset binding, D1 binding, compatibility date, and exact asset not-found behavior.
- Keep public assets in the configured asset directory. The deploy script should synchronize source files deterministically and exclude local-only/private files.
- Route intended `/api/*` paths through the Worker and return real 404s for unknown API/resource paths; avoid returning an HTML SPA fallback for missing files.
- Put schema changes in new sequential immutable migrations. Never edit an already-applied migration. Test the complete chain from an empty local D1 database before remote apply.
- Use prepared statements for user-controlled values. Validate method, content type, body size while streaming, field types/lengths, Origin, and error conditions.
- Restrict CORS to exact intended origins. Apply rate limits to public writes. If client IP is used, store only a secret-salted hash and fail closed when the required secret is missing.
- Add abuse/reporting/moderation policy for public user-generated content. Clearly explain whether submissions are public/shared, local-only, moderated, retained, and deletable.
- Keep local SQLite and remote D1 responsibilities explicit; do not imply automatic synchronization when none exists.

## 5. Local validation before deployment

Run relevant checks from the repository root (adapt to the actual project):

```powershell
node --check .\script.js
node --check .\worker\src\index.js
python -m py_compile .\content_admin.py
wrangler d1 migrations apply <database-name> --local --config .\wrangler.jsonc
wrangler deploy --dry-run --config .\wrangler.jsonc
```

Also verify:

- The complete migration chain succeeds on a fresh local D1 database.
- API tests cover valid/invalid input, malformed JSON, wrong types, body limits, unsupported methods, forbidden Origins, rate limiting, duplicate moderation actions, and threshold behavior.
- Test data is cleaned up; confirm no test rows remain remotely.
- The deployment asset directory contains only intended public files. Explicitly check local DBs, admin panels, credentials, backups, and local config.
- Root source assets and deployment assets match (e.g. SHA-256). A successful deploy with stale staged files is not a correct release.
- Wrangler dry-run shows the intended project/account and expected Assets/D1 bindings.

## 6. Cloudflare deployment procedure

1. Confirm authenticated Wrangler account with `wrangler whoami` and compare Worker name, D1 ID, and domain with the current project config.
2. Review staged/public assets and the Git diff. Do not expose secret values.
3. Apply remote D1 migrations only after fresh local migration tests pass and the user-requested scope includes remote schema changes:

   ```powershell
  wrangler d1 migrations apply <database-name> --remote --config .\wrangler.jsonc
   ```

4. Set secrets via `wrangler secret put <NAME>` or a reviewed secure script. Never echo secrets back or save them in tracked files.
- Use `deploy_workers.bat` when present; otherwise run `wrangler deploy --config .\wrangler.jsonc` after synchronizing assets.
6. Verify the actual production URL and bindings. Check page, CSS, JS, content JSON, OG image, favicon, robots, sitemap, API methods, status, MIME type, cache/security headers, and expected body.
7. Confirm private DB files and local-only admin endpoints are not served publicly. Check body and `Content-Type` as well as status, because fallbacks can return HTML `200` for nonexistent assets.
8. Preserve D1 data on rollback unless a destructive rollback is explicitly approved. Prefer a known-good Worker version and forward-fix schema changes.

## 7. Security/review checklist

- [ ] No wildcard CORS or hard-coded secrets.
- [ ] Admin authorization enforced by server for every admin API operation.
- [ ] No unsafe HTML rendering of visitor text; SQL is parameterized.
- [ ] Body-size enforcement handles requests without `Content-Length`.
- [ ] No local DB/cache/backup/secret/private files in public deployment assets.
- [ ] Canonical/OG/Twitter URLs use the actual production hostname; OG image fetch returns expected image MIME.
- [ ] Migrations are append-only and tested from a fresh database.
- [ ] API validation, error responses, CORS and rate limits are tested.
- [ ] Public comment visibility, moderation and retention are documented.
- [ ] Deployment has been verified from the public URL, not inferred from upload success.
- [ ] Performance and Search Console/analytics status are reported as measured, pending, or blocked—not guessed.

## Current project's deployment values

The current Worker, D1 name/ID, origin, and public analytics identifiers are in the project config/source. Treat them as specific to this repository only. For another website, create its own resources and verify each value with the owner before configuring it. Secret values must never be copied from this project.