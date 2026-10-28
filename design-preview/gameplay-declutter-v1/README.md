# Player gameplay — de-cluttered approval canvases

2026-10-28. User requested a simpler player-facing interface and canvas review **before code**. This round adds only four selected PNG concepts and these design notes. No frontend/backend behavior, game rules, route, asset mapping, dependency or deployment was changed. These are raster previews, not working responsive screens or verified animation.

## Selected concepts

1. `01-desktop-investment.png` — complete desktop player screen: one compact HUD, modest factory art, contextual staffing status, compact events, five always-visible workspace tabs, five concise investment rows, collapsed quality/maintenance group and bottom year dock.
2. `02-mobile-investment.png` — a single tall 390:844-proportioned phone view, both monetary values kept, one-line empty-event state, all five tabs in 3+2 arrangement, all five compact purchase categories and perimeter year action. No large factory illustration.
3. `03-mobile-enterprise.png` — phone with real event activity, six distinct enterprise stats, conditional staffing need, health gauges and an optional forecast disclosure. Cash/assets are not repeated inside the six stats.
4. `04-detail-states.png` — independent workspace examples, not four panels shown simultaneously: enterprise, governance risk, event history and annual cash-flow ledger.

## Proposed information hierarchy

| Always available | Contextual only | Open deliberately | Remove from default presentation |
| --- | --- | --- | --- |
| Company/CEO identity access, cash or debt, total assets, year, match clock, rank, sound | Staff missing, stopped/low-condition machines, pollution actually affecting sale price, insufficient funds/debt, important new traits/events | Full name, forecast, detailed stats, event evidence, annual causes, risk details, quality/maintenance upgrades | Repeated workspace/active-tab titles, generic benefit subtitles, before/after duplicates, empty trait/perk panels, technical acknowledgements, formulas |
| Five tabs and Sang năm | Up to two event previews and new-event attention | Full event list/history, saved year evidence, model explanations in Wiki | Separate duplicate income in HUD, duplicated money tiles in enterprise tab, permanently expanded projection under every purchase |

## Changes proposed for approval

- Remove the redundant `Điều hành nhà máy` heading and the second active-tab heading. Tabs identify the current workspace; quantities occupy a single small row in investment.
- Each investment card has one industry-specific painted thumbnail, one title, one concise model-driven reward and the existing purchase action with the full total price. Remove generic subtitle repetitions, duplicated result icons and the always-visible before/after/copy beneath every row.
- Keep an explicit forecast warning when a cluster purchase will need more staff. Wording must distinguish **current staffing** from **staffing after the proposed purchase**. Example current 4 workers / 1 cluster / 5 workers per cluster is missing 1; adding another cluster would require 6 more workers in total. The image says `Sau mua: thiếu 6 công nhân` for this reason.
- Keep quantity ×1/×5/×10/Tối đa and the current server preview/pricing logic. Labels and total costs change with quantity; no fixed illustrative prices may enter implementation.
- Collapse the existing quality/maintenance group by default, including after it unlocks. A low-condition/stopped-machine warning may expose the relevant maintenance choice; it must not force open three unrelated cards. Preserve locked/max-level reasons on deliberate access.
- On desktop, `Thông số` is proposed as a shortcut to the canonical enterprise/forecast location rather than a second parallel copy of the same metrics. The exact toggle/navigation change is part of the approval, not already implemented. Detailed equations remain in Wiki.
- On phone, omit the large factory photo. Keep both cash and assets in the compact HUD and all exact five tab labels visible; 3+2 layout, no horizontal tab scroller. Labels remain on one line even when the two tab rows are needed.
- If **both current and ongoing lists are empty**, events use one short line. Do not hide an ongoing effect merely because there is no new event this year. With activity, show up to two meaningful previews plus access to the full list; show yearly remaining duration only once where relevant.
- Current/ongoing/history filters remain in the event workspace, with one concise row per occurrence and deliberate detail access. Preserve complete labels, realized random impacts, counterpart, pending/settled status and year evidence on access. Avoid repeated title/body/effect text in the collapsed list.
- Six enterprise stats remain worker count, owned/operating clusters, cumulative products, technology, support and infrastructure. Durability, pollution, training/equipment quality and actual perks remain accessible without duplicating cash/assets or adding permanently empty sections. Empty perks are omitted; nonempty perks are compact and expandable.
- Risk keeps death/succession probability for the next close and the following close, and aid availability/usage. The detailed annual increments, less-used probabilities and rule explanations are collapsed or in Wiki. Pending aid eligibility conditions must remain available on access; do not imply approved aid can always be spent.
- Annual changes default to one row per year: year, signed cash change, disclosure. On expansion, show grouped signed causes and one before/after cash line. Preserve all receipts and asset changes on deeper access; the mockup is not authority to drop investment expenses or settlement evidence.
- Match year action, question resolution/pausing and all current timers remain unchanged. The thin countdown follows the button perimeter; the investment phone's rejected separate lower bar was removed.

## Costs, alerts and scope safeguards

- `Tuyển đủ` and `Bảo dưỡng` in the contextual strips are proposed **shortcuts** to the relevant priced investment choice. They do not silently spend from a price-less shortcut. The complete current cost must be shown before an actual purchase. If approved as direct-buy controls instead, their full prices must be visible on those buttons too.
- Keep useful debt/negative cash and blocked-purchase reasons. Less text is not permission to conceal a fee, loss, ongoing effect or risk. Native accessible names/status feedback and a compact loading/disabled state remain; remove only verbose technical copy like server-confirmation text.
- Severe states such as Bạo bệnh, death, transfer, aid granted and stopped machines retain visible contextual attention and persistent history. A new severe effect should not disappear behind a collapsed Risk tab without a visible indication. These normal-state mockups intentionally do not invent a simultaneous severe event.
- Effects from the preceding motion canvas still apply to the simplified anchors: a local card, signed HUD delta or event row, not a new permanent layer. No extra lock time, focus theft or notification popup. Rapid actions retarget/merge feedback; respect reduced motion.
- All example values, prices, statistical levels, crew requirements and probabilities are illustrative. Always use the current industry/CEO snapshot, purchase preview and confirmed actual outcome. People, clusters and product counts remain integers; permitted fractional annual risk increments stay intact.
- The risk panel and year ledger show independent example states; they are not a new formula or a guaranteed probability at year 3. Cash flow example +100 million production −20 million event = +80 million, 2.46 → 2.54 billion.
- The 40-million worker / 220-million cluster example is not a proposal to rebalance prices. Upgrade names/art and prices remain industry-specific. No new globally fixed effect percentages.
- One-screen fit in the image is a design target at the illustrated portrait/desktop proportions. It is not a promise of zero scroll for every phone, accessibility font size, translated/long title or arbitrary number of visible upgrades. Keep the year action visible; use one necessary content scroller rather than clipping controls or creating nested scroll regions.
- No tabs, tutorial guidance flow, purchasing quantities, company upgrades, pending-CEO settlement, question review or history data are deleted by this presentation change. Host/lobby/login/final-podium surfaces are outside this design round.

## Design inspection

Inspected actual BudgetPanel, EventOverview, TopBar, FactoryScene, GovernanceRiskCard and EventPanels, plus current gameplay captures. Compared palette and ornate frame family, HUD identity/finance hierarchy, meaningful purchase outcomes, all exact five tabs, current versus forecast staffing, annual event duration, six unique enterprise stats and year-cash arithmetic. Corrected redundant subtitles/icons, an ambiguous staffing forecast, an initially invalid landscape mobile treatment that omitted money, and an external countdown bar. The final phone concepts have both money values, tall proportions and two tab rows.

Generated and reviewed with built-in ImageGen. See `prompts.md` for briefs/provenance. No build/lint/browser interaction test was run because there is no application implementation in this round; timing, accessibility, final icon extraction, responsive text measurement and exact real-data fit must be checked after approval.
