# Gameplay transparency and painted event loops — implementation

Implemented the approved `../gameplay-transparency-v1/` design. That folder remains the original approval record; screenshots here show the local production build with test fixtures, not a live match.

## Gameplay

- Factory photo has a keyboard-accessible **Thông số** control. Its report replaces the photo in the same frame, with **Sản lượng / Thu–chi / Tác động**, conditional ranges, input factors, operating/idle machines, output, sales, costs and company valuation. Forecasting does not draw future random numbers.
- Settled years store the actual production inputs, random results and applied effects. The ledger explains production margin, separate inflation, direct cash events, annual effects, interest, purchases and quiz/choice rewards. Shared events are recorded on the receiving team. Existing economy formulas and purchasing power are unchanged.
- Opening cash + recorded movements is checked against closing cash. Missing historical detail stays missing and any unexplained balance is explicitly flagged. Historical production rows that already include inflation retain that distinction. Noncash effects are not deducted twice.
- Desktop opened production receipts have two columns; smaller screens stack the ledger and calculation. All five main tabs remain visible. Photo/report, tabs, purchases, confirmed values and event arrival/exit have bounded, nonblocking transitions with reduced-motion support. New-event badges remain available in history until explicitly read; no automatic notification dialog was added.

Main files: `FactoryScene.tsx`, `ProductionDetails.tsx`, `YearLedger.tsx`, `EventOverview.tsx`, `EventPanels.tsx`, `BudgetPanel.tsx`, `PlayScreen.tsx`, `TopBar.tsx`, `AnimatedValue.tsx`, `EventAttention.tsx`, `transparency-canvas.css`, production API types and helpers; backend `production.ts`, `engine.ts`, `types.ts`, `runtime.ts` and regression tests.

## Generated local artwork

- `frontend/public/assets/ui/operation-icons.svg`: six code-native vector icons used for report/navigation/reconciliation controls.
- Three newly generated painted sheets are archived in `../event-animation-sources-v1/`. They provide consistent hand-drawn artwork for 33 event icon families. `event-icons-contact.png` shows the complete set plus three utility illustrations.
- `frontend/public/assets/ui/event-loops-v1/`: 33 real transparent GIFs, each 96 × 96, 72 frames, 25 fps, 2.88 seconds, infinite repeat. WebP posters supply static/reduced-motion states. SVG masters combine the generated bitmap art with animation geometry; they are not claimed to be entirely vector drawings.
- Movements are baked into periodic GIF frames, including curved/fading rain, smoke, bubbles, waves, wheel/ray rotation and subtle articulated motion. No legacy CSS looping event animation remains. Global palettes avoid per-frame palette flicker. Seam verification checks the decoded last→first frame against ordinary frame differences for every GIF.
- `EventIcon.tsx` preserves the image node and URL across clock updates. Shared visibility/preference observers switch to posters offscreen, when the tab is hidden, on pause or with reduced motion. Active and historical event rows and the manually opened event detail use the new assets. All 302 seed icon aliases across 64 industries resolve to supported families.
- Runtime GIFs total 7,649,251 bytes across all 33 files; only visible animated icons request GIFs. No application dependency was added. Rebuild tool: `scripts/build-event-loops.mjs` (existing Sharp and FFmpeg). Decode/seam audit: `scripts/verify-event-loops.py` (existing Pillow and NumPy).

## Verification actually run

- Backend TypeScript build: passed. Frontend TypeScript/Vite production build: passed.
- Backend Vitest: **119 passed, 1 skipped** (PostgreSQL integration test).
- Frontend lint: exit 0, existing warnings remain in unrelated components/realtime code and the preexisting PlayScreen effect.
- Ledger model and transparency model scripts: passed; stable repeated-event identity, unread identity, all icon aliases and effect durations in years checked.
- Decoded animation audit: **33/33 passed**; 72 frames each, 40 ms/frame, infinite loop. Maximum last→first mean pixel difference 1.4095/255. Detailed evidence: `event-loop-seam-report.json`.
- Playwright Chromium fallback (the in-app localhost browser was unreliable): production-build HTTP/Socket.IO fixture tests at **390 × 844, 768 × 1024, 1440 × 900**, plus 360 × 800 intro flow. Checked report navigation, current-year calculations, exact ledger reconciliation, legacy missing-data warning, event arrival/unread/manual details, all five tabs, bulk/discount purchases, keyboard intro submission/retry, timer, no horizontal overflow, and no browser errors. GIF frames visibly change, image nodes/URLs survive clock updates, and offscreen/pause/reduced-motion states use static posters.
- Approved canvas and latest desktop/tablet/mobile screenshots were opened and visually inspected. The actual UI retains the existing gameplay HUD and frame system, with real text and responsive density; generated concept illustrations are not used as flattened interactive screens.

## Practical limits

No deploy, migration, commit or push was performed. Tests use mocked network snapshots and a local production frontend, not real Render multiplayer traffic. The live PostgreSQL integration and Firefox/Safari/physical-device performance were not verified. Old saved years cannot recover production factors that were never stored. Deploy backend and frontend together to receive the new optional report data; older snapshots show the explicit fallback.
