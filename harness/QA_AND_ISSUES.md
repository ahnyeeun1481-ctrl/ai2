# Website QA and GitHub issue workflow

Use this guide for end-to-end testing, edge-case review, security checks, accessibility/responsive checks, and tracking defects in GitHub Issues.

## 1. Turn a report into acceptance criteria

- Identify the exact page, route, element, data flow, environment, viewport, and expected behavior from the report.
- Inspect both the source files and the actual deployed site. Check whether the production bundle differs from source or a staged deployment directory.
- Convert each reported symptom into an observable acceptance criterion. Do not assume a prior “fixed” claim means the live behavior is correct.
- Record setup requirements and safe cleanup for any test data.

## 2. E2E and functional test matrix

Test relevant flows end to end, including:

- Direct navigation to root, hash sections, and nested/unknown paths; browser back/forward and reload where applicable.
- Desktop and mobile widths (include narrow 320–375px, common tablet widths around 768–1024px, and wide desktop); short viewport heights; keyboard-only navigation and visible focus.
- Forms with valid, empty, whitespace-only, malformed, boundary-length, oversized, Unicode, HTML-like, and repeated-newline input.
- Loading, empty, success, error, slow/offline, and retry states. Verify disabled controls and status announcements.
- Pagination boundary: empty result, fewer than one page, exactly one page, next page, final partial page, and repeated load attempts.
- External links, `target="_blank"` safety (`rel="noopener noreferrer"`) and accessible new-tab description.
- Real data persistence and visibility semantics (local-only versus shared server storage); never use production personal data in test fixtures.

For API-backed features, test success and failure through the browser and API: invalid JSON/content type, wrong field types, missing/oversized body, unsupported methods, disallowed Origin/preflight, unauthenticated admin access, rate limits, duplicate actions, provider timeout/failure, and database errors.

## 3. Security and privacy review

- Check authentication/authorization on the server for every admin operation; hiding a UI or URL is not access control.
- Check CORS allowlists, CSRF implications, CSP and other response headers, HTTPS, MIME types, cache policy for private responses, and noindex behavior for admin routes.
- Verify untrusted text is rendered as text, HTML is not injected, SQL is parameterized, and request bodies are bounded while streaming (not only via `Content-Length`).
- Verify secrets are Wrangler/provider secrets or environment variables, never source, public JSON, README, screenshots, logs, or Git history.
- Check abuse protections for public submissions (rate limiting, CAPTCHA where appropriate, report/moderation/retention policy) and document what is collected.
- Confirm test records are removed and verify remote DB state after testing; avoid destructive production tests.

For Cloudflare-specific deployment and D1 checks, follow [HARNESS.md](HARNESS.md). Do not run remote migrations or production mutations without explicit scope and a tested migration chain.

## 4. Reproduce and resolve issues

For each issue:

1. Reproduce it on the reported environment if possible. If not, state exactly what blocked reproduction.
2. Capture concise evidence: URL/route, viewport/browser, steps, actual result, expected result, relevant response status/content type or console error. Avoid collecting unnecessary personal data.
3. Implement the smallest maintainable fix. Check nearby flows and duplicates, not just the specific screenshot/state.
4. Add or run a regression test for the root cause and related boundary cases.
5. Validate source, deployed artifact, and production behavior separately where applicable.
6. Comment on the GitHub issue with three distinct paragraphs and headings:
   - **현재 문제 상황** — lead with the current user-visible problem.
   - **재현 방법** — exact, repeatable steps and conditions.
   - **해결 후 기대하는 모습** — observable expected result after the fix.
7. Before posting, proofread naturally (use `im-not-ai` only if the tool is installed and its usage is verified; never claim a transformation that did not run). Preserve technical facts and avoid unsupported claims.
8. Close only when the acceptance criteria are verified. Otherwise keep open and state the blocker/remaining test.

When filing a newly discovered issue, search existing open and closed issues first to avoid duplicates. Include severity/impact, reproducible steps, expected behavior, environment, and evidence. Do not put secrets or private user data in issue text.

## 5. Evidence and honest reporting

Separate results into:

- **Verified:** commands, tests, HTTP responses, browser interactions, or provider status actually observed.
- **Not verified:** unavailable browser/device/account/quota/provider access, DNS/network failures, inaccessible preview tools, or pending asynchronous processing.
- **Follow-up:** the smallest action needed to complete verification.

Never invent E2E coverage, device testing, accessibility conformance, issue closure, deploy success, or performance scores. A successful build/dry-run is not proof of a successful production deploy.