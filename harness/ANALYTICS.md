# Analytics, consent, GTM, and conversion tracking

Use this guide before adding Google Analytics 4 (GA4), Google Tag Manager (GTM), or another analytics platform.

## Ask for goals and required IDs

- If the requested conversion is unclear, ask the site owner before configuring events. Do not invent business goals.
- Obtain the correct GA4 Measurement ID (`G-...`) and GTM Web Container ID (`GTM-...`) from the owner’s account. Verify the stream/property belongs to this site; do not reuse an unrelated property or guess IDs.
- Confirm the production URL/protocol and update GA4 web stream URL to the actual canonical HTTPS URL.
- Do not expose provider secrets or credentials. Public measurement/container IDs are identifiers, not secret keys, but still verify they are the intended site's IDs.

## Implementation and consent

- Decide whether GA4 is installed directly or through GTM; avoid loading both paths and double-counting page views.
- Ensure CSP allows only required tag, analytics, image, and connection origins; validate policy in a browser so the tag is not silently blocked.
- Respect applicable privacy requirements. If consent is needed, do not load nonessential analytics before the user choice; store the choice appropriately and provide a way to change it. Consent Mode does not itself create a consent notice or collect consent.
- Make consent actions keyboard-accessible and understandable; do not preselect “accept” where prohibited.
- For SPAs, account for client-side navigation/page views carefully so each view is counted once.

## Event and conversion setup

- Define a small event schema with stable names and useful, non-sensitive parameters. Never send personal data, email, comment text, or secrets to analytics.
- For outbound work links, a suitable event can be `portfolio_work_click`, with a controlled `platform` value (e.g. `webnovel` / `ebook`) and optional destination URL only if privacy-safe and needed.
- Use GTM Preview/Tag Assistant to verify consent behavior, trigger matching, event parameters, duplicate firing, and GA4 DebugView/realtime receipt.
- Only after preview succeeds, publish the GTM container. Confirm with the owner when asked before any production publish if their instruction requires approval.
- Mark the event as a GA4 key event/conversion in the correct GA4 property, then verify the setting and report exact status. Event appearance may be delayed.

## Honest completion status

Report separately whether code is installed, GTM workspace tags are configured, Preview passed, the container was published, GA4 received events, and the event is marked as a key event. A container ID in source does not prove collection is working.