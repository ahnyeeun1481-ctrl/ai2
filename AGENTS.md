# Web development project guide

This file is the project-wide index and source of working rules for AI agents and contributors. Read it before changing the website. Detailed procedures live in the linked guides; keep this index concise and update links when guides move.

## First steps

1. Read this file and the relevant guide below.
2. Inspect the project tree, current branch, `git status`, recent commits, framework/runtime, deploy configuration, and production URL before editing.
3. Preserve existing user data and repository history. Do not overwrite remote repositories, production databases, or hosting projects without explicit authorization.
4. Treat deployed configuration as project-specific. Never copy another project's domain, Cloudflare account/database IDs, analytics IDs, or secrets.
5. State a short plan before making changes, implement only the requested scope, then validate changed files and behavior.

## Detailed guides

- [Repository overview, development experience, and setup](harness/README.md)
- [Website architecture, accessibility, security, Cloudflare Workers and D1 deployment](harness/HARNESS.md)
- [QA, E2E, edge cases, security checks, and issue triage](harness/QA_AND_ISSUES.md)
- [SEO, metadata, Google Search Console, Open Graph, and favicons](harness/SEO_AND_METADATA.md)
- [Performance measurement and optimization](harness/PERFORMANCE.md)
- [Analytics, consent, GTM, and conversion events](harness/ANALYTICS.md)
- [Local SQLite content administration and public D1 comments](harness/CONTENT_ADMIN.md)

## Shared quality gates

- Follow the existing stack and patterns. Avoid adding dependencies unless needed and justified.
- Never invent real-person profile details, contact information, account IDs, consent choices, or analytics goals. Ask when required values or goals are unknown.
- Treat visitor input and external API data as untrusted. Validate on the server, use parameterized SQL, render text safely, enforce size/rate limits, and keep secrets outside tracked files.
- Keep source and deployment copies synchronized. Validate content type and response body as well as HTTP status; static-hosting fallbacks can return HTML with `200` for missing assets.
- Test what can be tested locally. Clearly distinguish code/config checks from live browser, provider-console, production, or device verification that could not be performed.
- Do not claim a deploy, push, issue closure, analytics collection, Search Console processing, or score improvement without checking its actual result.
- For issue work, map each report to a reproducible test and code change; close only after verifying the acceptance criteria, and note remaining limitations.

## Finish a task

- Run relevant syntax checks, tests, build/dry-run, and security checks.
- Inspect the final diff and ensure no secrets, local databases, caches, generated QA artifacts, or unintended personal data are staged.
- Verify edited/created files and report the exact changes, validation performed, unresolved limitations, and commit/push status.
- When the user says **“마무리하자”**, follow [the session retrospective procedure](harness/SESSION_RETROSPECTIVE.md): record concrete lessons and mistakes from this session in the appropriate guide, then verify and commit/push if requested or clearly within the task.