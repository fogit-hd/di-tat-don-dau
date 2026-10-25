# Review of the current game economy

Review only. No application formulas, parameters, runtime state or live database were changed for this analysis.

## What the current code actually does

- Operating machines = min(machines owned, engineers / engineers required per machine). Idle machines still incur `idleCost`.
- Production multiplies technology, supporting-industry and infrastructure factors. Seeded baseline support and infrastructure both add 0.08 to their respective production factor per level; the factors multiply each other.
- Infrastructure additionally removes 0.35 pollution/level/year. Clean technology removes 1.7 pollution/level/year and each nominal upgrade immediately removes 4 pollution (scaled by upgrade efficiency).
- Pollution is a score clamped to 0–100, not a percentage or upgrade level. Each year: retained pollution + emissions from operating machines − green/infrastructure treatment.
- Above 28 pollution, the same pollution factor reduces both production and sale price. At pollution 60 this implies revenue ~73% of the clean case; at 100 ~45%, holding other conditions fixed.
- Pollution also subtracts 8 internal monetary units per point from company value, including below 28. Thus pollution 4 has no operating price/output penalty, but still subtracts 32 million VND from value under the current display scale.
- Infrastructure named as an export harbor does not currently model export unlocking, port throughput or logistics costs separately. Its main mechanical effect is still the generic infrastructure factor.

## Controlled one-package comparison

Illustrative seeded setup: 730 engineers, 0.4 machines, pollution 4, 10 billion VND cash, baseline coefficients from the official seed. Each branch buys one nominal 1-billion package at 100% efficiency. Mean of 500 common production RNG seeds; no ordinary events or mortality; inflation disabled specifically to isolate production effects. These are not guaranteed player earnings or a full game simulation.

| Upgrade | Next-year operating cash contribution, million VND | Interpretation |
| --- | ---: | --- |
| None | 49.08 | Baseline |
| Workforce | 49.34 | Already enough people for current machines; little immediate production gain |
| Machines | 34.17 | More output, but too many added machines are idle and incur costs |
| Supporting industry | 54.58 | Production factor increases |
| Infrastructure | 54.58 | Same direct production increase; a little more pollution treatment |
| Clean technology | 49.08 | Pollution below the operating penalty threshold; benefit is pollution/value protection and future prevention |

## Logic problems to address before balancing

1. The frontend treats cash <= 0 as bankruptcy and disables the manual year button, although the engine can still produce and handle debt. Zero liquidity, negative cash and true insolvency need distinct states. The max-purchase action can expose this problem.
2. Life insurance payout is currently attached to succession, including an alive founder's early retirement. The separate mortality path does not apply it. Payout accounting should also distinguish additional final assets from actual cash credited to the ledger.
3. The bankruptcy succession branch sets cash to zero but retains machines/workforce. The year-closing routine can schedule the next automatic production year again. This warrants an explicit bankruptcy-state regression test before claiming the company cannot restart without approved state aid.
4. Manual year advancement after a 5-second lock versus automatic advancement after 60 seconds means teams can play very different numbers of economic years within the same session. Scoring should explicitly account for this if comparing strategy rather than action speed.

## Recommendations, not implemented changes

- Keep the useful workforce-machine bottleneck, but preview operating capacity, idle machines and ongoing idle costs before buying.
- Separate upgrade roles: workforce runs machines; machines add capacity; supporting industry improves input costs/reliability; infrastructure improves logistics/delivery capacity; clean technology treats emissions and protects revenue/value. Avoid teaching five different names for nearly identical production multipliers.
- Keep the basic version small: do not add detailed inventory, transport routing or order-management subsystems before those five roles are clear.
- Begin testing input-cost benefits around 2–3%/support level and logistics/throughput benefits around 3–5%/infrastructure level, with diminishing returns/caps around 20–30%. These are starting hypotheses requiring further simulation, not validated replacements.
- Make pollution visible as a 0–100 score with current emissions, treatment, next-year estimate and actual penalty. Consider one main operating penalty channel (sale price) rather than simultaneously reducing price and output. Use simple labeled severity bands; do not claim low pollution has no effect while retaining a value penalty below the threshold.
- Preserve the requested annual risk steps (mortality +0.2 percentage points, succession +0.25), but evaluate lower healthy-state caps. Candidate tests: mortality 2%, succession 4%; show special illness exceptions explicitly.
- For perspective, with current default starting risks and current caps, no special traits, ignoring other event systems, the probability of encountering neither mortality nor succession through year 30 is ~36.69%; through year 50 ~2.49%. This is not the probability of every team ending, since bankruptcy, state aid and protective traits change the actual path.
- Keep integer-percentage random outcomes, but test routine investment efficiency variation at ±5–10% rather than ±20%. Reserve very large asset-loss/gain outcomes for rare events if rankings should primarily reflect decisions.

Primary code references: `backend/src/game/engine.ts` (`invest`, `runCycle`, `computeValue`); `backend/prisma/seed/balance.ts`; `backend/prisma/seed/official.ts` (`priceFor`, shared coefficients); `backend/src/runtime.ts` (`rollMortality`, `rollSuccession`, `advanceYear`, `tick`); `frontend/src/components/BudgetPanel.tsx` and `PlayScreen.tsx` (cash-based disabled state).
