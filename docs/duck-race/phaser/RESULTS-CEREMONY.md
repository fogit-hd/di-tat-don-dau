# Approved results ceremony — implementation

User approved applying results canvas rev 8 on 2026-11-07. The finished host branch in `DuckExperience.tsx` now renders `HostResults`; the player branch still shows only their personal result. Existing legacy rooms retain their older renderer/results; this surface applies to current quiz-v4 rooms.

## Implementation

- The host sees the approved cups, artwork, three distinct entrances, and ranks 4–7. Bronze climbs and bows; silver's gift unfolds around grounded feet and its wings celebrate without a hop; gold parachutes down, stows the canopy, retrieves a crown from behind, raises it with compact bent wings, and wears it.
- `createAwardsGame.ts` is a lazy-loaded Phaser scene owned by the results component. It consumes PNG sprite cells at the original registered source anchors. It never overlays a standalone SVG crown or stretches the body. One owned game/ResizeObserver is destroyed when leaving/retrying. The previous race game is unmounted at the phase boundary.
- `motion.ts` owns pure timing, pad layout and pose selection. Seven-group timing matches the approved 19.5-second sequence. One/two-group rooms omit missing award turns. The scene starts once per terminal result mount, not on websocket heartbeats. Replay and pause are presentation controls only.
- `results-v1/` contains 56 PNG atlases for eight original duckee colours plus the approved cups/background. `scripts/build-duck-result-colors.py` builds exact native palette variants from the approved preview exports without geometry changes. App build does not run Python or depend on design-preview assets.
- Final names, colours, ranks and points come from the terminal server snapshot. Names use single-line truncation with full title/accessibility text. Screen readers have the complete final standings. Reduced motion shows the final state immediately. History remains available in a focus-trapped dialog with ten records per page.

## Verification

- `node --import tsx --test frontend/tests/duck-awards.test.ts`: 6 tests covering server rank ordering, sparse rooms, the distinct sequence, valid frame indices, fixed silver foot anchors, responsive pad positions and all eight colour variants / crown registration.
- Duck experience engine and receipts regression: 28 tests passed. Points, final settlement and server APIs were not changed.
- Frontend production build and lint are run for this change; existing repository-wide lint warnings remain outside these files. No new dependency.
- Browser fixture: `/duck-results-preview.html` on the Vite dev server renders the actual React + Phaser component with labelled test data. It is DEV-only and is not a production route/build entry. Verified one canvas, loading success, replay, pause, history paging and named final standings. Capture artifacts are under the ignored `design-preview/duck-race-results-v1/` directory.
- Full seven-device online gameplay/Google sign-in/Render deployment are not part of this local results-component verification. No deployment was performed.
