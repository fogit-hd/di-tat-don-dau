# Landing, Google login and current-rules Wiki

Implemented 2026-10-28. Existing wine, paper, painted logo, title lettering and ornate frame assets are reused. Gameplay and brush divider assets are untouched.

## Changes

- `StartScreen.tsx`: navbar and a single hero on the landing route. Removed the three-step and five-investment sections and the landing footer. The Wiki keeps its own footer and document scrolling. Navbar and create-panel help/event links now target real Wiki sections instead of removed landing anchors.
- `public-home.css`: home-only viewport layout using `100svh`, a flex shell with a shrinking hero, and `object-fit: contain` artwork. Desktop separates copy from artwork; portrait tablet/mobile stacks copy, join form and artwork. Landscape uses two columns. No global scroll suppression is used to fake viewport fit. Placeholder contrast is corrected for the existing wine field SVG.
- `GoogleHostLogin.tsx` / `google-host-login.css`: independent content-height dialog, avoiding the global mobile `.modal .card { height: 100% }` rule responsible for the old empty panel. Existing genuine Google Identity API and `/api/auth/google` credential verification remain in use. Login intent stores a verified session; create intent additionally opens the existing room settings form. No room is created by authenticating alone. Loading, verification, error/retry, Escape, backdrop close, focus containment/restoration and cancellation of late UI updates are handled.
- `WikiUpdates.tsx` and `wiki-company-rules.ts`: a new “Cập nhật & luật hiện hành” section with implemented mechanics and all 21 new company events, illustrations, conditions, effects, bounds and detail links. Covers upgrades/pricing, durability tiers and faults, integer random percentages, year-based effects, asynchronous CEO fees, final asset settlement and patent rights, tutorial timing and final quiz review. Proposal-only events are not listed as live events.
- `WikiPage.tsx`: dedicated recent-company-event filter, per-event rule notes, actual monopoly revenue/cost ranges and explicit worker/durability units. Expanded catalog totals derive from the catalog's stored counts plus bundled company events.

## Verification

- Frontend production build passed; existing large-chunk warnings remain.
- Frontend lint passed with existing warnings; no new login/Wiki component warnings.
- Backend regression: 183 passed, one database integration test skipped without a live test DB.
- `scripts/home-login-wiki.qa.cjs`: production bundle at 360×800, 390×844, 768×1024, 1440×900 and 844×390. No horizontal/vertical landing overflow, artwork/copy don't overlap, artwork uses contain, join Enter validation, working Wiki links, compact login geometry, create/login intent separation, server rejection/retry, GIS script failure/retry, cancel during verification, Escape/focus restoration, all 21 event notes and no missing local assets/page errors.
- `scripts/public-fields.qa.cjs`: seven Wiki sections at 390/768/1440, local Vietnamese lettering/font coverage, framed native fields and no focus-size changes or horizontal overflow.
- `scripts/session-flow.qa.cjs`: create-room/session-token forwarding, settings/start endpoints, QR, lobby and existing legacy quiz-review pagination at 390/768/1366/1440. Its obsolete question-detail selector was updated to the previously implemented quiz component; the application quiz was not changed.
- Visual review used the supplied current-state screenshots plus the latest Chromium home/login/Wiki screenshots. Compared frame family, paper/wine palette, title/logo assets, mobile panel height, typography, form contrast and artwork placement. Intended differences are the requested removed sections, viewport hero, compact login, and new Wiki rules content.

The in-app browser could not open the existing localhost preview (connection timeout), so verification used Playwright Chromium with locally fulfilled production files and mocked HTTP/Google Identity responses. Real Google account selection/consent, live token verification and Render deployment were not exercised. External Google Fonts requests were deliberately blocked in QA; the public pages use local lettering/font assets. No dependency, credential, DB reseed or deployment was added.

Screenshots and machine-readable reports: `design-preview/home-login-wiki-v1/`, `design-preview/public-fields/verification-home-login-wiki/`, `design-preview/session-flow-v1/verification-home-login-wiki/`.
