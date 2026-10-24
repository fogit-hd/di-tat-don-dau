# Gameplay implementation review

> Asset approval update: the user approved `hand-drawn-v1`. All 256 industry-specific hand-drawn investment illustrations and the shared clean-technology illustration are now complete and applied. The old photographic-looking assets were removed. Current verification is recorded in `handdrawn-completion.md`; earlier screenshots are historical UI evidence only.

## Surface and files

Accepted references: `04-desktop-upgrades.png` (1600×1000), `05-mobile-upgrades.png`, with the enterprise/risk states from `02-desktop-alt.png`.

The redesign is scoped to `.gameplay.game-shell` in `frontend/src/components/gameplay.css`. Composition lives in `PlayScreen.tsx`; HUD in `TopBar.tsx`; upgrade explanations/art in `BudgetPanel.tsx`; tabs and event rail in `EventPanels.tsx`; risk precision in `GovernanceRiskCard.tsx`. Landing, host, server rules, routes and request handlers were not changed.

## Visual fidelity ledger

| Comparison | Implementation and review |
| --- | --- |
| Two-column desktop composition | Factory, current events and ongoing rail on the left; five tabs and an independent year dock on the right. Dock overflow found at 1280×720 and fixed. |
| Wine / gilt / parchment palette | Scoped wine lacquer background, layered gilt frame borders, corner rivets, warm parchment panels. Controls remain native HTML, not a screenshot. Frame ornament is CSS/SVG rather than baked raster chrome; not claimed pixel-identical. |
| Typography | Cambria with Georgia fallback for display text and existing body font. Georgia's Vietnamese fallback caused separated diacritics in the first render; switching to Cambria fixed it. Checked headings, tabs, upgrade labels, values and mobile wrapping. |
| Investment card anatomy | Industry label, meaningful image, effect explanation, actual current indicators and actual server price. Larger desktop thumbnails and flexible row heights fill the panel; all five rows fit at 1280×720 and larger tested desktop sizes. |
| Event visibility | Current-year list plus persistent ongoing rail; cash, investment-price and other timed effects are included. Native dialog opens details without covering text inside short rail cards. No fabricated effect values. Existing vector event icons are retained rather than generating a separate image for every event. |
| Responsive behavior | Scene hidden below 768px and in short landscape; internal panel/rail scrolling only. Compact 360×640 rows fit at least one complete investment choice; dock stays in viewport at every checked size. |
| Copy and data | Original tab labels and gameplay copy preserved where retained; two new tabs and ongoing-event labels added as approved. Duplicate cash/year/rank removed. Upgrade explanations added. No game rule or economic coefficient changed. |

Direct `view_image` comparison was performed on the accepted desktop/mobile references and latest Chromium captures, including native 1600×1000 desktop, 390×844 mobile and the constrained 360×640 state. Structure, palette, text hierarchy and interaction are implemented and visually verified against the accepted design. Remaining differences are documented, not represented as 100% canvas fidelity.

## Verification actually run

- `npm run build -w frontend`: passed.
- `npm run lint -w frontend`: exit 0, existing warnings in hooks/leaderboard/start screen remain; no new warning in the new event rail or upgrade code.
- `npm test`: 57 passed, 1 skipped (database integration).
- `scripts/gameplay-ui.qa.cjs`: actual production bundle in Playwright Chromium, with HTTP assets fulfilled from `frontend/dist` and a mocked Socket.IO transport. No test fixtures are included in the product bundle. Browser/IAB localhost access was unavailable in this environment, so headless Chromium was used.
- Sizes: 1600×1000, 1440×900, 1280×720, 1920×1080, 1024×768, 768×1024, 390×844, 360×640, 844×390.
- Assertions: no page overflow; dock outside panel and entirely visible; all desktop choices visible; five tabs and keyboard navigation; enterprise and risk content; event detail / Escape; 0/1/4/8 ongoing cards; long names / full-name disclosure / huge values; invest/year/restart request payloads; lock, pause, bankruptcy, support eligibility and finished-summary states; industry labels and image decoding for all 64 seed entries.
- Not verified: live multiplayer/database behavior, mobile Safari, Firefox, or production deployment. UI transport fixtures verify request wiring, not the server's response to an investment.

## Asset coverage and numeric preview limitation

Built-in image generation produced **256 industry-specific hand-drawn illustrations**, four for each of the 64 seeded industries, plus one shared clean-production illustration. Each runtime asset is a 480×320 WebP. All eight labeled review sheets were visually inspected for the intended industry/perk. Approved prompts, source files and paths are in `investment-art-handdrawn-provenance.json`.

The asset audit found **256 present, 0 missing, 0 invalid and 0 duplicate image files**. Neutral SVG icons remain only as a network-error fallback, not as a substitute for missing industry art.

The public scene does not expose the active `engPerTy`, `assetPerTy`, `epl` and other configurable balance coefficients. Therefore upgrade cards show qualitative effects and actual current values, not speculative +650 / +1 / projected production numbers. Adding authoritative before→after quantities requires an additive read-only server payload; this implementation deliberately does not change the backend or hard-code mutable seed coefficients.

## Re-run UI verification

Build the frontend first. Use an already installed Playwright runtime (no app dependency was added):

```powershell
$env:PLAYWRIGHT_MODULE = 'absolute/path/to/playwright'
$env:PLAYWRIGHT_EXECUTABLE_PATH = 'absolute/path/to/chromium.exe'
node scripts/gameplay-ui.qa.cjs
```

The script creates ignored `.tmp/gameplay-*.png` captures and `.tmp/gameplay-qa-results.json`. Approved review captures are retained here as `implemented-desktop.png` and `implemented-mobile.png`.
