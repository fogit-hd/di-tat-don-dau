# Company events, wear and streamlined guidance

## Delivered behavior

- **Create room:** the title ribbon and form share one centered 740px stack. Both use the same actual border-box width at desktop/tablet/phone sizes; existing create/logout/close handlers and payloads are unchanged.
- **Vocational class:** `gen-lop-nghe` and its compound variants now grant an integer **1–5 workers** alongside the existing fee/price effect, replacing the ineffective fractional-machine gift. The actual worker delta is stored in the event summary and cash ledger detail.
- **14 bundled events:** gain/lose staff, supply, logistics, clean technology, workforce skill, equipment quality and condition. Events draw concrete values once server-side, clamp to valid limits and display the actual before/after changes. Resource changes are immediate and persistent, not a one-year bonus that later removes the granted resource. Absent resources and capped skill/quality are excluded where the event would have no useful target.
- **Prices:** event damage does not decrement `investmentCounts`. Separate `qualityPurchases` preserve the paid improvement tier when an event reduces skill/quality; repairing the lost level cannot reset the price ladder. Existing fleet-wide training/modernization cost bases still follow the workforce/equipment they cover.
- **Wear:** modern fleets lose a deterministic seeded draw of **5–10 integer percentage points after a year with actual operation**. Snapshots/reloads never reroll it. Idle fleets do not wear. The old 60% minimum is removed; condition cannot go below zero. Weighted fleet condition keeps its precision when new equipment is bought.
- **At zero:** staffed units stop, output/revenue become zero, owned machines/workers remain, and the CEO turn stays open. Maintenance is available even with zero operating units, restores condition to 100% and uses the existing actual purchase action. Non-operating fleets still incur their existing upkeep, now labelled correctly. Low/zero-condition warnings are inline, without a blocking popup. Settled reports record the year's condition loss.
- **Advisor:** after finishing each explanation, waits **2.5 seconds** or accepts an earlier tap. Explanations and tab visits then continue automatically; tab visits activate the real tab button and existing acknowledgement flow. All five guided investments and the first **Sang năm** remain manual. Paused/hidden/in-flight/error states block automatic progression. Match deadline remains unchanged; the year timer starts after the year-one guide completes. Asset-failure fallback retains automatic explanations/tabs and manual economic actions.
- **Operating view:** replaces three tabs, nested receipts and internal scrolling with output, production profit, projected closing cash, operating units, condition and a concise active-effect link. Narrow stage columns use a single metric column via a container query. Detailed receipts remain in yearly history; formulas remain in Wiki.

## Artwork and data

- `frontend/public/assets/ui/company-events-v1/` contains **15 independent transparent SVGs**: fourteen new events and the vocational class. They package complete, approved hand-painted WebP illustrations **inside SVG**, preserving the existing painting style. These are not newly traced editable vector paths. There are no added arrows, badges or animated composites.
- Authoritative definitions: `backend/src/game/company-events.data.json`. Frontend's local copy: `frontend/src/lib/company-events.json`. Both live inside their respective independent Docker build contexts; no import crosses outside the app directory.
- Run `node scripts/sync-company-events.cjs` after editing definitions/art mappings. It synchronizes frontend data and regenerates self-contained SVG files from the approved artwork manifest. Tests check the two data copies match.
- Catalog loading supplements existing database events. The year draw includes eligible new IDs, including in previously saved modern rooms whose old bags would otherwise not contain them. Unknown/unregistered event IDs are filtered before drawing. No SQL schema migration, reseed or live database write was performed.

## Verification actually run

- Frontend production build, backend type build and frontend lint passed. Existing lint/large-chunk warnings remain.
- Backend: **153 tests passed; 1 database integration test skipped**. Added coverage for exact worker gains, vocational fees/benefits, actual clamped losses, unchanged price tiers, persistent changes, event eligibility, reproducible wear, fleet rounding, shutdown at zero and maintenance recovery.
- `session-flow.qa.cjs`: create/title/form alignment and existing Google-session/create/settings/start flows at **390, 768, 1366 and 1440px**. `design-preview/session-flow-v1/verification-centered-create/`.
- `approved-guide.qa.cjs` with `ADVISOR_AUTOMATIC=1`: full guide at **390, 768 and 1440px**, without taps for introductions/tab visits; actual purchases and year-one button; paused guide; unchanged deadline; 60-second year-two timer; compact view; zero-condition warning; actual SVG event images. `design-preview/mascot-guide-v3/verification-automatic-company-events-final/`.
- Interactive/non-reduced-motion guide regression at **390px**, including click/keyboard skip, network failure/retry and reload. `verification-interactive-company-events/` in the same preview directory.
- `public-fields.qa.cjs`: six Wiki sections, native framed controls, Vietnamese search, event-context selections and no horizontal overflow at **390, 768 and 1440px**. `design-preview/public-fields/verification-company-events/`.
- `company-event-art.qa.cjs`: all 15 SVGs decoded on cream/wine backgrounds; matching definitions verified. Gallery/report: `design-preview/company-events-v1/`.

Browser checks use the production bundle served through local Playwright API/socket fixtures, with actual game calculation modules. In-app browser localhost previously timed out, so Chromium was the fallback. Real database/Render deployment, Firefox/Safari and physical devices were not verified. No deployment performed.
