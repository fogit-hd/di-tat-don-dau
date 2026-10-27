# Durability, quiz review and strategic events

This update supersedes the advisor/tab and wear descriptions in the earlier delivery note. No dependency or database migration was added. No deployment was performed.

## Manufacturing

Wear remains a seeded integer **5–10 percentage points after each operating year**, not a relative 5–10% multiplication. Idle fleets do not wear. Production uses condition at the beginning of the year; the new condition applies to the next cycle.

| Condition | Speed | Annual integer defect draw |
| --- | --- | --- |
| Above 80% | 100% | 0–1% |
| Above 60%, through 80% | 90% | 2–4% |
| Above 40%, through 60% | 75% | 5–8% |
| Above 20%, through 40% | 55% | 9–15% |
| Above 0%, through 20% | 30% | 16–25% |
| 0% | Stopped | No production |

Manufactured units include the speed factor. Rejected units = floor(manufactured × defect percentage / 100). Saleable units = manufactured − rejected. Sold units = floor(saleable × logistics delivery rate). Faulty units have no sales revenue; operating costs are still charged. Physical unit counts stay integers. Raw condition is still used for equipment valuation, rather than pretending the speed tier is its resale condition.

The independent defect draw is keyed by CEO seed and cycle. Forecasts never consume the random stream: low sales use maximum defects, high sales use minimum defects. The immutable settled receipt contains the actual draw, rejected units, saleable units, sold units and wear. Maintenance restores 100% condition through the existing purchase endpoint. Wiki contains the table and calculation; gameplay shows concise consequences.

## Advisor

The rendered tab is derived from the current tutorial step, so the content is already open before the corresponding explanation. The **investment tab requires an actual player click**. Purchases, resource confirmations, insufficient-capital confirmation and the first year settlement remain manual. Other tab explanations and information steps progress after speech plus **2.5 seconds**, or an earlier response. Hidden/paused/offline/in-flight/error states retain the existing progression guards. The match clock continues; year-two timing begins only after the guide finishes.

Dialogue text is 24px, compact 21px; the measured Canvas layout uses the same sizes. Speech chunks are shorter to fit mobile. Character animation remains the approved complete-frame Canvas sprites, with no new CSS body rig.

## Question review

Each presentation saves an immutable copy of prompt, shuffled option IDs/text, answer key, explanation and year inside participant JSON. Resolution adds the selection, correctness and answer record ID. Timeouts and a room ending with an open question are recorded as unanswered. A company restart preserves this history.

- Player results have a Questions tab, own attempts only. Wrong selected options are red; correct options green. No selection is invented for a timeout.
- Host final results group identical contextual question variants across shuffled presentations. They show appearances, accuracy including timeouts, unanswered count and four option-selection distributions. Bars animate on expansion and respect reduced-motion.
- Detailed answer keys are not sent in active player snapshots or live host statistics. Final review is available to the owner after their turn finishes and to the host when the room ends.
- Legacy answer records without a saved option snapshot remain summary-only. They are not silently reconstructed from an edited catalog.

## Six strategic events

- Exclusive technology: +5–12% output and +3–8% sale price, 1–3 active years after the duration draw. It grants a persistent licensing right, shown in Enterprise.
- Royalty: eligible technology owner receives 3–6% of a randomly chosen active counterparty's cash, capped at 100 million.
- Commission: receives 2–5% of an active counterparty's cash, capped at 75 million.
- Scale advantage: at least three owned production units; +6–12% revenue and +2–5% compliance costs, 1–3 active years.
- Final growth award: draw 1–3% of the richest CEO's baseline assets; limited to 20% of the recipient's baseline assets and 500 million.
- Final asset obligation: draw 3–8% of own baseline assets, capped at 500 million and own baseline assets.

Transfers never overdraw available cash, conserve payer-plus-recipient cash and produce receipts for both CEOs. These events cannot be copied through the ordinary class-wide propagation path. Paid upgrade price tiers do not decrease. Final claims can be acquired once per kind and survive company restart; they are visible before settlement.

Final asset adjustments use **one common baseline before any adjustments**. A finalized participant keeps their already frozen score as that baseline. Adjustments change final score, not operating cash or past production. The stored settlement prevents a reload/repeated finish from paying again. CEO and host individual results show the actual adjustment, calculation basis and cap.

The event definitions supplement saved catalogs and bags without reseeding SQL. Backend definitions and frontend Wiki data are synchronized by `scripts/sync-company-events.cjs` inside the independent Docker build directories. Six additional standalone SVG files reuse approved complete hand-painted WebP artwork embedded inside SVG; these are not newly traced vector illustrations.

## Verification

See the task's final report and generated QA reports for completed runs. Relevant commands:

- `npm test`
- `npm run build -w backend`
- `npm run build -w frontend`
- `npm run lint -w frontend`
- `node --import tsx scripts/quiz-review.qa.cjs`
- `ADVISOR_AUTOMATIC=1` with `scripts/approved-guide.qa.cjs`
- `node scripts/company-event-art.qa.cjs`

Browser scripts use the production bundle with local Playwright request/socket fixtures. They do not contact Render or write a live database. The DB integration test needs a separately configured database; physical mobile browsers and Firefox/Safari require separate verification.


### Completed verification (2026-10-28)

- Backend: **166 passed, 1 DB integration test skipped**; type build passed.
- Frontend: production build and lint passed; existing hook/ref warnings and bundle-size warning remain.
- Quiz UI: Chromium at **390, 768, 1440px**, including wrong/correct/timeout colors, exact selection percentages, host pagination, animation/reduced motion, player reload and no horizontal overflow. Screenshots/report: `design-preview/quiz-review-v1/`.
- Full automatic guide: **390, 768, 1440px**, real manual investment-tab click and five purchases, non-investment tab opens before narration, pause, match clock, first year and year-two timer, compact statistics and zero-condition shutdown. Evidence: `design-preview/mascot-guide-v3/verification-durability-quiz-final/`.
- Reload at Enterprise/Risk/Events/Years: all three widths, corrected persisted-step/tab mapping. Evidence: `verification-durability-reload/` in the same parent directory.
- Actual animated guide (not reduced motion): **390px**, screen and keyboard responses, retry/reload, spotlight layout, required buttons, year settlement and cleanup. Evidence: `verification-durability-interactive/`.
- All **21 SVG assets** decoded over cream/wine backgrounds, matching frontend/backend definitions. Evidence: `design-preview/company-events-v1/art-report.json`.

These are local production-bundle checks with request/socket fixtures and actual calculation modules. Render, a real database, Firefox/Safari and physical phones were not tested. Older sessions without saved option snapshots retain summary-only question review.


The later asynchronous-year update supersedes immediate-transfer timing: see `asynchronous-ceo-events.md`. Queued fees arrive on the target's next year or are settled at final summary with receipts in both histories.
