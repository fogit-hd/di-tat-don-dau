# Interactions between CEOs with independent year counters

The two implemented money interactions (royalties and commissions) now use a persisted room queue. The proposed additional interaction families are not implemented by this change.

## Timing

1. CEO A draws a fee event in their own year. The server chooses an eligible counterparty B, draws the integer rate once and saves the cap. No money moves yet.
2. A sees “Đang chờ CEO B sang năm” and a pending transaction in Enterprise. B sees neither the event nor a balance change before their next turn. Their year counters do not need to match.
3. When B advances their year, manually or by the existing automatic year timer, pending incoming events settle **before B's production**. The fee uses B's available cash at processing time, the saved rate and cap. Both cash balances change together. B's receipt belongs to the year being settled; A receives a matching receipt in their current year and pending ledger causes.
4. Each queue item changes from pending to settled once. Reloads, other CEOs advancing and later turns do not replay it. Restructuring resetting a year counter cannot postpone the next-turn processing rule.
5. At the end of the match, all remaining pending interactions settle **before final asset snapshots and bonuses**. Both CEOs' event histories contain the full receipt labelled **“Quyết toán khi tổng kết”**, including counterparties, actual amount, saved rate and cap. Expanding a result event now shows the entire receipt, not only its short summary.

## Bounds and persistence

- No overdraw of available cash; no fee is credited before it is debited.
- A slow receiver can have at most three pending fee events. The same origin/target/event combination cannot be queued twice concurrently.
- Already finished positive estates can receive/pay the recorded amount through their frozen score without restarting play. Zero-value or bankrupt estates cancel the transaction with an explicit no-money-moved record for both CEOs; they are never revived by it.
- Queue records live in existing room JSON metadata. No migration/reseed is needed. Room metadata, participant balances, receipts and answer writes commit in a single Prisma transaction for rooms with interaction records. Pending answer writes are cleared only after successful persistence.
- Receiver queues are not exposed through player snapshots. Only the origin's outgoing pending list is shown, preserving delivery on the recipient's next turn.

## Changed files

- `backend/src/game/strategic-events.ts`: immutable transfer terms, bounded backlog and settlement helper.
- `backend/src/runtime.ts`: queue creation/restoration, per-recipient year processing, final flush, receipts, frozen-score handling and atomic persistence.
- `backend/src/game/company-events.data.json`, `frontend/src/lib/company-events.json`, `frontend/src/components/WikiPage.tsx`: timing descriptions synchronized.
- `frontend/src/api/types.ts`, `frontend/src/components/StatCards.tsx`: origin's pending list.
- `frontend/src/components/ResultEvents.tsx`: full settlement receipt on expansion.
- Backend tests and `scripts/quiz-review.qa.cjs`: queue timing, independent years, restoration, final history and receipt display checks.

Backend tests cover delayed delivery with year 31 versus year 4, no early receiver notification or debit, conserved transfer amounts, single settlement, unchanged paid price tiers, room metadata restoration, current-cash calculation, end-game flush in both histories, zero-value estates, positive frozen estates, restructuring and backlog limits. Browser verification uses local production-bundle fixtures; no live database or Render deployment is performed.


Verification completed: **172 backend tests passed, 1 DB integration test skipped**; frontend/backend builds and frontend lint passed with existing warnings. Chromium checks at **390, 768 and 1440px** confirm the complete final-transfer receipt is visible after expanding event history, alongside the existing quiz review checks. Screenshots/report: `design-preview/interaction-receipts-v1/`. Real database transaction execution and Render deployment were not verified.
