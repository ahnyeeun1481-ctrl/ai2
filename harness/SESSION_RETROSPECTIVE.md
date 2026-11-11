# Session retrospective trigger: “마무리하자”

When the user says **“마무리하자”**, treat it as a request to close out the current work session and capture reusable lessons and mistakes in this harness.

## Procedure

1. Review the current conversation and actual tool outcomes, not assumptions or earlier completion claims.
2. Record only reusable lessons: what worked, what failed, why, how it was detected, and a concrete prevention/checklist change.
3. Put each lesson in the relevant topic guide (QA, performance, SEO, analytics, or Cloudflare harness). Keep this file as the trigger/procedure, not a dump of every session detail.
4. Do not include personal data, private URLs/tokens, account IDs, secrets, or transient error logs. Generalize project-specific details.
5. If a mistake affected files, deployment, data, or user-facing behavior, first verify/repair it if safe and in scope; document remaining risk honestly.
6. Verify Markdown links, check the final diff, and run relevant tests. Avoid duplicate or contradictory advice.
7. Summarize what was learned and what changed. Commit/push only when requested or clearly part of the active task; never claim a push without verifying remote `HEAD`.

## Retrospective entry format

Append a short dated entry to the appropriate guide when a concrete lesson is worth retaining:

```md
### YYYY-MM-DD — Short lesson

- **Observation:** What actually happened.
- **Cause:** Why it happened, if known.
- **Improvement:** Specific future check/action.
- **Verification:** How to confirm the improvement works.
```

Prefer updating an existing checklist item over adding a dated entry when the guidance is general and stable. Do not record routine successful actions that add no reusable insight.