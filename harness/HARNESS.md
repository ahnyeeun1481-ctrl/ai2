# Website build and deployment harness

Use this harness when creating or changing a website in this repository. It records the project conventions and safety gates established for this site. It is a checklist, not permission to deploy without reviewing the destination account and public files.

## 1. Confirm the project before editing

- Inspect the repository root, current Git status, framework, existing build/deploy commands, and Cloudflare account identity.
- Preserve existing files and history. Never replace a remote repository, database, or Pages project without explicit authorization.
- Identify the canonical production URL from the current Cloudflare configuration/deployment. Do not copy another project's domain, account ID, database ID, or worker name.
- Keep secrets out of source, JSON files, commits, logs, and screenshots. Use Wrangler secrets.

## 2. Static website conventions

- Keep semantic, accessible HTML and the existing CSS/JavaScript conventions; use progressive enhancement where practical.
- Provide a unique `<title>`, a concise description, canonical URL, Open Graph title/description/URL/image, and Twitter large-image metadata.
- OG images must be absolute public URLs, publicly fetchable, preferably PNG/JPEG, and use a tested 1200×630 image. Verify response status and `Content-Type`.
- Keep `robots.txt` and sitemap URLs aligned to the canonical production origin.
- If static JSON is used for public content, it must contain public data only. Do not publish SQLite files, local admin panels, backups, credentials, or personal data unintentionally.
- Treat all user-generated content as untrusted. Render with `textContent`, validate input on the server, and use parameterized SQL.

## 3. Cloudflare Workers + D1 layout

- Use a root `wrangler.jsonc` with a Worker entrypoint, static asset binding, and explicit D1 binding.
- Keep public assets in the configured asset directory; route only intended `/api/*` paths through the Worker.
- Put D1 schema changes in new, sequential, immutable migration files. Never edit an already-applied migration to change remote schema. Test the complete migration chain against a fresh local D1 database before applying remotely.
- Use prepared statements for all user-controlled SQL values.
- Keep API CORS same-origin/allowlist-only. Validate method, content type, body size while reading the stream, data types, trimmed lengths, and error paths.
- Rate-limit public writes. If an IP identifier is stored, store only a secret-salted hash; do not persist the raw IP. Require the salt to be a Wrangler secret and fail closed if it is missing.
- Add abuse/reporting/moderation behavior for public UGC and clearly document whether comments are shared, local-only, moderated, or deleted.
- Keep the local SQLite editor and remote D1 backend clearly separated. Document that they are not automatically synchronized.

## 4. Required validation before deploy

Run from the repository root in PowerShell:

```powershell
node --check .\script.js
node --check .\worker\src\index.js
python -m py_compile .\content_admin.py
wrangler d1 migrations apply <database-name> --local
wrangler deploy --dry-run --config .\wrangler.jsonc
```

Also verify:

- Migration chain succeeds from an empty local D1 database.
- API tests cover valid writes, malformed JSON, wrong field types, oversized bodies, unsupported methods, forbidden Origin, rate limiting, duplicate reports, and moderation threshold.
- Test rows are removed afterward; confirm test data is absent from remote D1.
- The deployment asset folder contains only intended public files. Check explicitly that `portfolio.db`, `admin.html`, credentials, local config and backups are excluded unless intentionally public.
- Root source assets and staged deployment assets match (for example, SHA-256 comparison).
- A dry-run shows the expected Assets and D1 bindings and the intended project/account.

## 5. Deployment and post-deploy checks

- Before deployment, confirm Wrangler is logged into the intended account and the Worker/project name and D1 ID match the current config.
- Apply remote D1 migrations only after local migration tests pass:

  ```powershell
  wrangler d1 migrations apply <database-name> --remote --config .\wrangler.jsonc
  ```

- Store required secrets with `wrangler secret put <NAME>`. Never echo the secret back or write it into files.
- Use the repository deploy script when present; otherwise run `wrangler deploy --config .\wrangler.jsonc` after syncing assets.
- Check the returned production URL. Verify homepage, OG image, CSS, JS, public content JSON, sitemap, robots, GET/POST API behavior, and expected HTTP/content types.
- Confirm database files and local admin routes are not publicly served. A static hosting SPA fallback may return HTML with status 200 for unknown paths, so inspect response body and `Content-Type`, not status alone.
- If a rollback is needed, use a known-good Worker version/deployment and preserve D1 data unless destructive rollback is explicitly approved.

## 6. Review checklist for AI-generated changes

- [ ] No duplicate client-side logic or dead helpers.
- [ ] No wildcard CORS or hard-coded secrets.
- [ ] No unsafe HTML insertion for user text.
- [ ] No unintended local files in public assets.
- [ ] Correct canonical/OG/Twitter URLs point to the actual production hostname.
- [ ] OG image is a supported raster format, absolute URL, and fetched successfully.
- [ ] Migrations are append-only and tested from an empty database.
- [ ] API limits and error responses are tested.
- [ ] D1/local SQLite responsibilities and moderation behavior are documented.
- [ ] Deployment has been verified from the public URL, not inferred only from a successful upload.

## Current project-specific settings

The current production Worker, D1 name/ID, and site origin are in `../wrangler.jsonc`. Treat those as this project's values only; for a new site, create its own Worker and D1 and replace settings only after confirming the target Cloudflare account.