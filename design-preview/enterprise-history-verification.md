# Enterprise and year-history implementation

Accepted concepts: `enterprise-icons-badges-canvas-v1.png` and `year-history-canvas-v1.png` in this folder. Generated reference boards are 1663 × 946, showing desktop and mobile side by side; they are panel concepts rather than full game-page viewports.

## Visual comparison

Both concepts and the latest browser screenshots were inspected with `view_image` in the same QA pass.

| Point | Concept | Implementation and verification |
| --- | --- | --- |
| Layout | Six statistics, desktop 3 × 2, phone 2 × 3 | Matching layout in real game panel at 1440, 768 and 390px; no horizontal page overflow |
| Art | Hand-painted engineer, conveyor, crates, cog/circuit, supplier network, infrastructure | 16-icon enterprise/trait atlas plus 4-icon utility atlas generated; transparent WebP images used, not generic line drawings |
| Palette | Cream parchment, brown serif text, gold outline, burgundy selection | Matched against references; existing generated outer frame retained |
| Type and hierarchy | Icon left, label/value right; secondary idle count | Corresponding hierarchy and compact native-game sizing; actual values/industry units preserved |
| Badges | Pale idle chip, burgundy selected chip, inline explanation | Click/toggle verified; no popup; generated icon also used in the permanent status strip |
| History | Collapsed yearly cash summary, one expanded year, repeated investments grouped | Tested grouping six purchases into five rows, clean technology ×2 totals -2 tỷ, net cash -4.43 tỷ |
| Detail retention | Additional information on demand | Full original transaction details and asset balances remain in manual disclosures; mixed prices are summed without changing the ledger |
| Copy | Short labels and year-history caption from canvas | Approved labels/caption retained; factual factory/industry names, units and amounts come from real data, not painted text |

## Intentional adaptations

- The approved panel design is embedded inside the existing game HUD and five-tab workspace; the mockup's mobile/desktop board is not used as a fullscreen background.
- Phone and tablet retain the single existing panel scroller when contents exceed its available height. Switching tabs resets the scroll position to the top. Headers, tabs and the year action stay outside that scroller.
- The pollution bar correctly has zero fill at pollution 0; the generated concept's decorative minimum fill is not carried into data visualization.
- Industry-specific investment illustrations already present locally are reused for detailed ledger rows rather than showing misleading generic equipment in every industry. Generated icons cover the shared stats, activity summaries, traits and headings.
- Full original transaction details are available beneath a grouped row where needed for mixed prices and bulk-purchase evidence.

## Functional verification

- Production frontend tested through Playwright Chromium with mocked HTTP and Socket.IO data at 390 × 844, 768 × 1024 and 1440 × 900. Earlier IAB localhost checks in this thread were unreliable, so the stable Chromium fixture was used for deterministic room-state QA.
- Verified all six stats, badge selection/details, true zero pollution, one expanded year at a time, grouped purchases/counts/cash, original row details, asset-balance disclosures, existing five tabs and year-button behavior.
- Verified global image protection on both gameplay and landing images: `draggable=false`, canceled `dragstart` for images and generated SVG image wrappers. Image-only context menus are blocked following the user's follow-up request; the text context menu remains available. Normal clicks, controls and panel scrolling remain enabled. No whole-page text-selection blocking was added.
- `node --import tsx scripts/ledger-model.qa.mjs`: package counts, mixed prices, cash totals, legacy records and non-cash effects passed.
- Frontend/backend builds passed. Backend tests: 93 passed, one PostgreSQL integration test skipped. Frontend lint completed with pre-existing warnings; no new warning from the added components.
- No dependency added. No live database changed, and no Render deployment performed. Firefox and physical touch devices were not tested.

Key changed files: `StatCards.tsx`, `EventPanels.tsx`, `YearLedger.tsx`, `PaintedIcon.tsx`, `enterprise-canvas.css`, `TraitNotice.tsx`, `PlayScreen.tsx`, `main.tsx`, `image-drag.ts`, `year-ledger.ts`, and optional ledger package-count metadata in the frontend/backend types and investment engine. No financial calculation or route was changed by this UI task.
