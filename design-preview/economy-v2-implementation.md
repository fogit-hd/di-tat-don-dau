# Economy v2 — implemented and verified

## Changes in this round

- `backend/src/game/production.ts` (new): shared, pure production calculation; bankruptcy classification.
- `backend/src/game/investment-preview.ts` (new): server-authoritative receipts for all 5 upgrade lines and ×1/×5/×10/maximum quantities, using the same purchase function and production calculation as settlement.
- `backend/src/game/engine.ts`, `types.ts`: production, explicitly tagged supply-shock mitigation, and bankruptcy guards. Discounts still change the invoice, not package size.
- `backend/src/game/random-economy.ts`, `succession.ts`: upgrade efficiency ±10%; healthy mortality/succession ceilings; rare extreme inheritance outcomes.
- `backend/src/runtime.ts`: expose forecasts; distinguish liquidity from bankruptcy; stop bankrupt businesses; one-use approved restructuring; insurance paid into cash on death only; accurate illness/longevity explanations.
- `frontend/src/api/types.ts`, `components/BudgetPanel.tsx`, `StatCards.tsx`, `PlayScreen.tsx`, `GovernanceRiskCard.tsx`, `enterprise-canvas.css`: receipts, upgrade conditions, expandable economic impact and pollution explanations, liquidity warning, suspended bankruptcy dock and risk explanation.
- Regression tests: `production.test.ts`, `runtime-purchases.test.ts`, `random-economy.test.ts`, `succession.test.ts`.
- QA: `scripts/intro-flow.qa.cjs`, `scripts/economy-balance.qa.mjs`.

## Production and investment rules

Internal money remains million VND; a default 1,000-unit package is 1 billion VND. No balance/price database reset or migration was required for these formula changes.

- Operating machines = min(owned machines, engineers / engineers required per machine). Idle machines retain their existing ongoing cost. Engineers also retain their technology-learning and dependency-reduction benefits.
- Physical production depends on operating machines, technology and applicable output effects/noise. Supporting industry, infrastructure and pollution no longer multiply physical output.
- Supporting industry reduces the material component of operating costs, with diminishing returns: `30% × (1 − exp(−0.10 × support))`. It also mitigates specifically identified new input shocks, capped at 50%. Existing effects are not retroactively changed. In composite input-shortage variants, only the added investment surcharge is mitigated; unrelated damage from the original event remains intact.
- Infrastructure reduces logistics costs by `30% × (1 − exp(−0.15 × infrastructure))`; the delivered/sold proportion rises from 90% toward 100% via `90% + 10% × (1 − exp(−0.12 × infrastructure))`. There is no inventory subsystem or export-unlock mechanic. Infrastructure does not treat pollution.
- Operating cost shares: material 65%, logistics 20%, other 15%. Each benefit affects its own component, not total cost. Idle costs are separate.
- Green upgrades retain immediate pollution relief and add recurring treatment. Pollution is clamped to 0–100 after retention + emissions − green treatment.
- Pollution has one operating penalty: price falls above score 30, reaching a 35% reduction at 100. No second output penalty. The existing pollution deduction from company value remains and is explained even below the price-penalty threshold.
- Previews show known effects and expected production noise of 1. They exclude future events, inflation, debt interest and ongoing cash grants from the displayed production margin. They are estimates, not guaranteed next-year cash receipts. Random efficiency is drawn once per team/year and cannot be rerolled by refreshing.

## Risk, endings and cash accounting

- Ordinary upgrade efficiency is an integer draw from 90–110%, previously 80–120%. Other event draws remain random; applied random percentage impacts remain whole percentage points.
- Requested annual steps are unchanged: mortality +0.2 percentage points/year, succession +0.25, after the existing escalation start. Healthy-state ceilings are 2% and 4%. Explicit illness adds risk beyond those ceilings; longevity locks its own lower risks. Fractional annual steps are intentionally retained.
- Inheritance outcome base weighting is now ruin 2, loss 13, unchanged 60, growth 23, 2–3× windfall 2, multiplied by configured row weights before perk changes and annual random jitter. These are conditional weights, not unconditional annual odds. The family-fund protection still sets bankruptcy weight to zero; other perks retain their modifiers.
- Zero/negative cash alone is not bankruptcy: production continues and debt interest applies. Explicit succession bankruptcy stops production, clears operating assets/effects and scores zero. Available state aid permits exactly one restart in the same industry; otherwise bankruptcy is final. A spent or unapproved grant cannot restart a team. Death remains final.
- Life insurance is credited to cash and the cash ledger once on actual death. Retirement/succession while alive pays no life insurance.

## Verification actually run

- Backend TypeScript build: pass.
- Backend tests: **113 passed, 1 PostgreSQL integration test skipped** (no live database supplied for that integration test).
- Frontend TypeScript/Vite production build: pass.
- Frontend lint: exit 0; existing warnings remain in the previously modified UI/realtime files.
- Ledger aggregation QA: pass.
- Production-build Chromium QA at **390×844, 768×1024 and 1440×900**: pass. Uses mocked HTTP/Socket.IO snapshots populated with the real backend investment-preview/production functions; this is not a live database or Render test.
- Browser checks cover all five receipts, expandable purchase effects and pollution explanation, discounted bulk/maximum transport payloads, zero-cash year button, bankruptcy timer suspension, name validation/retry, existing enterprise/history views, image drag/context-menu prevention, no horizontal overflow and no JavaScript errors.
- Screenshot inspection found a legacy mobile `#dirs { order: 4 }` rule placing explanatory text above purchases. The investment-specific override now keeps receipts before the footnotes. The narrow screen retains one existing content scroller; not all five fully detailed cards can fit simultaneously on a phone.
- Controlled model run: **2,000 runs × 50 years** across four illustrative purchase strategies, retaining random investment efficiency, production, inflation and interest; ordinary events, mortality and succession are deliberately absent to isolate economics. All values remained finite and pollution stayed within bounds. This is a regression/sanity check, not proof of optimal game balance.
- First-year example, 730 engineers / 0.4 machines / pollution 4, one 1-billion package at 100% efficiency, production noise 1, before inflation and interest: no purchase 42.226 million production margin; workforce 42.456; machines 25.223 (idle-machine costs); support 42.591; infrastructure 43.168; green 42.226 (pollution prevented, no immediate low-pollution price benefit). UI forecasts follow the same calculation.
- `git diff --check`: pass.

Screenshots: `investment-economy-v2-390.png`, `investment-economy-v2-768.png`, `investment-economy-v2-1440.png`, `bankrupt-restructuring-v2.png` in this directory.

Not performed: deployment, live PostgreSQL integration, or multiplayer testing against the production Render service. Existing completed-year ledgers are not rewritten; new settlements use the new formulas. Deploy both backend and frontend to use the receipts and rules together.
