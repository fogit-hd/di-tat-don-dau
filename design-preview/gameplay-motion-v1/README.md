# Gameplay motion — approval canvas

2026-10-28. **Design preview only. No gameplay implementation, economy changes, dependencies or deployment in this round.** These are static motion storyboards, not working animations, GIFs or production sprite sheets.

## Review order

1. `01-desktop-purchase.png`: complete desktop composition during a confirmed worker purchase. Keeps the current HUD, factory/stat area, inline events, five workspace tabs and bottom year action. Localized row highlight and an adjacent cash debit replace an oversized cross-screen trail.
2. `02-core-storyboard.png`: before/during/after for investment, numeric HUD changes, the year transition and workspace-tab content transitions.
3. `03-events-operations-storyboard.png`: event arrival, effect expiry, crossing a machine-durability tier and hiring enough workers to activate a cluster. The worker portrait is a symbolic category icon, not a pictured headcount; numeric 4/5 → 5/5 is authoritative.
4. `04-interaction-milestones-storyboard.png`: resolved question feedback, a queued CEO fee being settled and the first operating-cluster milestone. Correct/selected-wrong answer styling is shown only at a time when the existing game rules allow revealing answers.
5. `05-mobile-states.png`: mobile investment feedback, inline new-event feedback and resolved-answer feedback. All five workspace tabs use a 3+2 layout and the bottom year action remains visible. No wide-screen trails are carried onto mobile.

## Motion specification proposed for approval

| Family | Duration | Intended behavior |
| --- | --- | --- |
| Confirmed investment | 360ms | Brief engraved-button press/release, fine amber tracing edge, three to five small flecks and one signed resource delta. Remains local to the card. |
| Cash/assets | 280ms | Roll from the currently displayed value to the latest confirmed target in fixed-size numeral slots. Signed delta fades beside the affected number. |
| Year close | 420ms | Small calendar flip and concise production feedback. Existing lock/quiz/year logic remains authoritative; the animation adds no lock time. |
| Workspace tabs | 180ms | Only body content crossfades/moves about 8px. All tab controls stay visible and stationary. |
| Event arrival | 280ms | New row enters within its list with about 12px movement and a short edge highlight. No toast, modal, acknowledgement or focus theft. |
| Effect expiry | 220ms | A small expiry stamp, fade and collapse inside the existing list after the annual logic actually expires it. History persists. |
| Durability tier | 320ms | Gauge moves to confirmed durability; a short amber warning at a crossed threshold, with useful maintenance affordance. |
| Crew activation | 300ms | Numeric worker count changes and a brief connection/tick to the operating-cluster tile. No cut-up character rig. |
| Resolved answer | 240ms | Selected-wrong red edge/short shake; correct green edge/tick. Correct choice alone gets green if the answer was right. |
| CEO settlement | 340ms | Small receipt feedback within the event row, confirmed signed cash delta and normal history record. Pending fees are not displayed as already paid. |
| Milestone | 450ms | Small factory crest and concise inline label, then a stable small badge. Cosmetic only, no invented cash reward. |

## Rules that override illustrative raster details

- Amounts, costs, counters, rank, clock, yield and percentages shown in these mockups are examples, not new constants. Implementation must take the current industry, crew requirement, prices, confirmed event draws and actual results from the existing model. Do not copy the example values into code.
- A 40-million purchase shown as 2.50 → 2.46 billion is one transaction, not an extra fee. The 2.46 → 2.54 billion example is a separate confirmed +80-million income. The queued 20-million royalty settles 2.50 → 2.48 billion once. Assets are not a second cash balance.
- Person, operating-cluster and product counts stay integers. Confirmed resource/stat values change atomically; presentation interpolation must not fabricate temporary economic state.
- Durability 82 → 74% illustrates an 8-point wear step. At 74%, the approved tier is 90% speed and a 2–4% integer defect draw; 3% in the image is one illustrative outcome, not a fixed defect rate.
- Event lifetime remains measured in years. The millisecond labels are animation timing only. An event is removed from the active list only when the actual rules expire it, and remains in history. Mới does not open a popup.
- The calendar/time shown in the storyboard is illustrative. Existing readiness, lock, question and 60-second timing rules must be preserved; a visual transition never restarts a timer by itself. No extra wait is added to watch an animation.
- Question illustration/copy is a sample for design, not a new seeded question. The resolved-question mobile crop is a presentation state, not a proposal to move questions into the Risk tab or change routes.
- Milestone slot/crest is only proposed feedback. It does not introduce an achievement economy, reward balance or mandatory acknowledgement. Any durable badge location would be finalized alongside the existing status layout, not as another permanent large panel.
- Short trails and arrows in storyboard gutters communicate motion direction; they are not permanent UI and never intercept input. Mobile omits long trajectories. Reduce edge luminosity if it competes with legibility.
- Prices, support/infrastructure/green benefits and the full set of six enterprise stats remain model-driven. The mobile art is a motion/location review, not authority to replace enterprise stats with money/asset duplicates. Existing factory/stat-view switch and responsive hiding rules remain intact.
- Rapid repeated actions must retarget/merge visual feedback; no growing queue of floating numbers. At most one local arrival highlight and one active delta per target. Existing icons remain static illustrations; animate the feedback surrounding them rather than attaching arbitrary arrows to pretend the depicted object moves.
- Respect reduced motion: instant final state and brief color feedback, no travel/rotation/shake. Background tabs do not keep replaying effects. No whole-screen flash/shake, no obscured bottom action, no additional scrolling induced by motion.

## Generation record

Built-in ImageGen, with existing local screenshots as style/layout references. Prompts required hand-painted icons, wine/gold/parchment styling, unchanged screen hierarchy, integer resource counts, exact Vietnamese labels and localized nonblocking feedback. Full design briefs and focused correction history are summarized in `prompts.md`.

Selected outputs: desktop initial + one edit; core storyboard one generation; operations initial + three edits; interaction/milestones one generation; mobile initial + one edit. Earlier alternatives remain in the default generation folder and are not project assets.

## Design inspection

Compared the selected images to actual gameplay screenshots, not the new lobby: palette/frame vocabulary, top-HUD hierarchy, left illustration/events versus right workspace, all five exact tab labels, hand-painted image treatment, bottom action visibility, localized delta placement, integer headcount, annual effect lifetime and mobile 3+2 navigation. Fixed a cross-tab gold trail, invented infrastructure/clean-tech numbers, ambiguous worker headcounts, duplicated mobile heading, repeated debit feedback and mobile event totals.

These raster concepts are not pixel measurements or browser verification. No build/lint run is needed for design-only PNG/Markdown additions; implementation, timing feel and device tests follow after approval.
