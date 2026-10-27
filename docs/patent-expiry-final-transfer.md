# Hết hạn bảo hộ — implemented final asset transfer

Implemented only the agreed F04 event in this change. The other proposed events remain design proposals.

## Rules

- `company-patent-expiry`, visible title **Hết hạn bảo hộ**, is drawn randomly through the existing annual event deck. It is not an automatic age/expiration timer.
- It becomes eligible when another CEO owns **Công nghệ độc quyền** and has positive asset value. The collector does not need to own exclusive technology. A CEO receives this collection right at most once.
- The percentage is drawn once as an integer **1–3%**, persisted with acquisition year and shown immediately in the event history and Enterprise tab.
- Nothing is paid when the right is acquired. At match end, the collector receives the percentage of each other eligible patent owner's **total final baseline assets**.
- No self-charging, no charges to CEOs without exclusive technology, no revival of zero-value estates, no additional cash debit and no removal of technology/quality levels.
- Already valid pending cash interactions settle first. Then one baseline asset table is frozen for patent transfers and the older final bonuses/obligations. No newly received prize becomes the basis of another fee.

## Bounded, conserved settlement

Defaults are centralized in `PATENT_LEVY_POLICY`, in `backend/src/game/strategic-events.ts`:

| Setting | Default |
| --- | --- |
| Drawn percentage | 1–3% integer |
| Total deduction per patent owner | At most 10% of their baseline assets and 1,000 million VND |
| Total receipt per collector | At most 20% of their baseline assets and 1,000 million VND |

First calculate every owner/collector request from the same baseline. Scale each owner's requests proportionally to their deduction cap; then scale each collector's resulting receipts proportionally to their receipt cap. Round the final transfers down to 0.01 million VND. Do not redistribute unused residual capacity or cascade funds through another round of calculations.

Each transfer has a stable receipt ID and equal debit/credit entries, including counterparties, requested percentage, baseline, actual amount and a cap explanation if reduced. The patent transfers alone conserve combined CEO assets. The stored `finalSettlement` prevents replay; existing snapshots use its original baseline even if read after adjustment.

Example without caps binding: A owns exclusive technology and has 10 billion; B has 6 billion and a 3% right. A pays 300 million, finishing at 9.7 billion; B finishes at 6.3 billion. Cash remains unchanged.

## Visibility and persistence

- On acquisition: current-year event and a pending-right label in Enterprise, showing the actual saved rate.
- At finalization: asset values and ranking update, matching receipts appear in both CEOs' event histories, labelled **Quyết toán khi tổng kết**.
- CEO and host individual results show the full adjustment breakdown. Names wrap inside the details at small widths; receipt keys remain unique for multiple counterparties.
- No eligible patent assets left at finalization: explicitly record zero receipt and why, rather than omitting the result.
- The collector's right survives company restructuring alongside existing final claims. The source company's exclusive-technology ownership follows existing company-restart rules.
- Participant JSON stores the right and final receipts. Rooms with a collection right persist participant states, room metadata and answer writes through a single Prisma transaction. No SQL migration/reseed is required.

## Files

- `backend/src/game/strategic-events.ts`, `backend/src/game/types.ts`: policy, eligibility, integer draw, simultaneous capped transfers and receipt types.
- `backend/src/runtime.ts`: random acquisition, restart persistence, snapshots, atomic save, final history and score/ranking integration.
- `backend/src/game/company-events.data.json`, `frontend/src/lib/company-events.json`: bundled event, synchronized for independent Docker builds.
- `frontend/public/assets/ui/company-events-v1/company-patent-expiry.svg`, `manifest.json`: own self-contained SVG asset using an approved existing hand-painted illustration. This is an embedded WebP in SVG, not newly traced vector artwork.
- `frontend/src/api/types.ts`, `StatCards.tsx`, `PlayerResults.tsx`, `HostSessions.tsx`, `quiz-review.css`: pending right and paired asset receipts, with long-name wrapping.
- `frontend/src/components/WikiPage.tsx`: exact final-asset rule and caps.
- Tests: `backend/src/game/patent-levy.test.ts`, `backend/src/runtime-purchases.test.ts`, company-event asset checks, `scripts/patent-levy.qa.cjs`.

## Verification

Backend unit/integration-fixture tests cover the exact example, integer draws, eligibility with zero cash but positive assets, self-exclusion, no eligible owners, zero estates, reciprocal ownership, multiple collectors/payers, both caps, conservation, order independence, prior cash settlement, older final bonuses, saved/reloaded rights, single finalization and reversed leaderboard positions.

Browser checks use the production bundle with local request/socket fixtures and the real final-settlement calculator. They cover collector/owner histories, multiple receipts, long CEO names, host ranking and individual details, pending rights, Wiki and reload at 390, 768 and 1440px. Real DB transactions, Render deployment and physical devices require separate verification.


Completed verification (2026-10-28): **183 tests passed, 1 DB integration test skipped**; backend/frontend builds and frontend lint passed with existing warnings. All 22 event SVGs decoded. Chromium UI checks passed at **390/768/1440px** using local production-bundle fixtures and the real asset-settlement calculator; no local asset failures or application errors. Google Fonts requests were deliberately blocked by the offline fixture. Final evidence: `design-preview/patent-levy-v1/verification-final/report.json` and sibling screenshots. No live DB writes or deployment performed.
