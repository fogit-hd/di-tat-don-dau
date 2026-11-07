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

## Follow-up wardrobe and runtime corrections

- Award cels now composite selected scarf/glasses before rendering the whole character. Forty registered accessory sheets include native crouch, head turns, upward gaze and crown/prop occlusion. `scripts/build-duck-award-cosmetics.py` generates them from existing wardrobe artwork without changing the native body sheets.
- Personal result and rank portraits also render saved cosmetics. The dev fixture now equips all seven ducks so missing wardrobe layers are visible immediately.
- Current race rules use 8 minutes and four 2-minute eras. Whole-painting periodic scrolling preserves image aspect ratio and moves the scenery and ground with the same camera. Approved painted lightning (180ms from above the viewport), incoming wind, rain/splashes, drifting dust and shields are loaded by the actual race scene.
- Recipient notices use outlined/shadowed text and SVG cues, no paper panel or dismiss button. Web Animations handle entry, stacking and exit. Each retained notice expires after 3 seconds.
- Current browser checks are unavailable because local browser use is disabled in Work settings. Earlier browser observations above cover the preceding ceremony implementation, not this follow-up. Offline composited wardrobe cels have been visually inspected. Build, assets and rule tests are rerun separately.

### Final follow-up checks

- Frontend and backend builds pass. Frontend lint exits successfully with existing warnings in other components.
- 37 engine/receipt/motion tests, 3 HTTP tests and 11 frontend asset/layout/ceremony tests pass (51 total). Contract generation consistency and `git diff --check` pass.
- All 83 new production art/manifest/icon files are present in `dist` and match their public source hashes. The wardrobe contact sheet was inspected locally. Browser and deployed end-to-end visual verification remain unavailable in this turn.
- Rain and drifting dust accompany the existing lightning/wind events. No new point penalties or chest catalogue entries are introduced.

## Replacement animation package

The second/third-place revision uses `bronze-spring` (72 frames) and
`silver-swing` (96 frames), 24 FPS, source cell 128 and foot anchor (64,118).
The PNGs have eight columns for texture sizes of 1024×1152 / 1024×1536.
`scripts/build-duck-results-v2.py` exports 16 native-colour body sheets and eight
per-item wardrobe sheets. Every scarf/glasses combination is recomposed and
compared byte-for-byte during export. The 168 fully dressed base-colour cels
match the approved review, including the four-frame bronze entrance opacity.

Silver uses the shared source-pixel handhold socket (64,94). Its swing reaches
the cup at 1500ms and the grip releases at frame 38. The rope retracts only after
feet are planted. Medal retrieval, turn and presentation are complete cels with
compact wings and original head/bill/wardrobe occlusion. Bronze's launch, folded
feet, landing and wave are complete cels. Phaser handles the cel schedule and
rope geometry. The existing order is bronze, silver, gold.

The focused results tests cover sparse rooms, all source frames, multi-row
textures, responsive rope registration and contact, source-scale invariance,
and entry opacity. The development fixture `/duck-results-preview.html` renders
the integrated component. Browser automation is still disabled in Work, so the
current visual checks are offline cel composites and math/asset tests.

Replacement verification completed with 13 frontend tests passing and a successful
production build. All 24 new atlases match the dist copies byte-for-byte. All eight
native colour variants share identical source alpha geometry. The integrated
fixture and sampled body/wardrobe URLs return HTTP 200 on the localhost frontend.
Lint completes with existing warnings in other components. Interactive browser
playback remains unverified because browser automation is disabled in Work.

## Approved bronze V5 replacement

The user approved “Duyệt top 3 V5” after reviewing the replacement skateboard
entrance. `bronze-skate` now supplies 96 complete 128-pixel cels at 24 FPS, in
eight columns. `bronze-motion.ts` reproduces the reviewed approach, dismount,
board departure and runway withdrawal at responsive sizes. Phaser loads the
authored twelve-frame board and wooden runway textures. Body rotation uses
the wheel-contact pivot while riding, then returns to the fixed cup foot
anchor before card presentation.

The copper number 3 is engraved into the complete character cels after its
turn so it reads upright. The selected scarf and glasses are registered to
those cels before playback. The asset export checks every wardrobe pair
against its authored composite. Eight native-colour variants have identical
alpha geometry. All 192 dressed bronze/silver review cels and the two props
match V5 exactly.

For seven groups the bronze starts at 700ms, silver at 5100ms and gold at
9200ms. The whole presentation finishes at 20200ms. Sparse rooms omit missing
award turns. Reduced motion displays the held card immediately with the
entry props hidden. Replay and pause retain the same clock for bodies and
props. The integration remains a host results presentation over terminal
server ranks and points.

Fourteen frontend ceremony/render tests pass, including responsive wheel
contact, dismount order, fixed card presentation, all palette/wardrobe assets,
and the existing silver rope and gold sequence. The running-component fixture
is `/duck-results-preview.html`. Interactive browser playback remains
unverified because browser automation is disabled in Work settings.

V5 integration verification completed. Frontend build and lint pass with existing warnings in other files. All 15 bronze files (eight bodies, four wardrobe layers, two props and the manifest) match the production build. The integrated localhost fixture and new assets return HTTP 200. No deployment was performed.

## Fitted crown and eye registration

The user approved the compact, curved-band crown and explicitly allowed wearing
it with glasses. Its forty coronation cels and four idle cels are exported in
all eight palettes by `build-duck-winner-crown.py`. The coronation atlas now uses
eight columns. Complete-cel accessory differences preserve foreground wing,
bill and crown occlusion. Every wardrobe pair is checked against its authored
composite during export. The final coronation cel equals the first crowned
idle cel, including all supported combinations of glasses and scarves.

`duck_wardrobe_art.py` registers the two existing lens artworks to native pupil
centres in every current race/portrait pose. The back-facing knockout shows
the strap. `fit-duck-glasses.py` updates only the existing eyewear cells while
retaining atlas coordinates. Result motion exports and native/parachute
accessory exports consume the same registration. The original native body
pixels and the selected scarf remain the source of truth.

The live wardrobe labels its single glasses choice group “Trang sức trên đầu”.
The review has a single mutually exclusive head choice for glasses and the
proposed hats. Those new cap/pin/bow models await approval. The crown is a
separate, approved awards exception that can be worn with glasses.

Fitted-crown verification completed. Fourteen frontend ceremony/render tests and four production wardrobe regression checks pass. Forty-four bare plus forty-four dressed crown cels match the approved design with corrected eye placement. Seventy-two colour/wardrobe terminal combinations have identical seating-to-idle pixels. All 51 updated wardrobe/result assets match dist. Frontend build and lint pass with existing warnings elsewhere. Localhost fixture/asset URLs return HTTP 200. Interactive browser playback remains unverified because browser automation is disabled in Work. No deployment was performed.
