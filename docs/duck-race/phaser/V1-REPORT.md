# V1 implementation and verification

Approved 2026-11-04: “canvas tôi duyệt”, with obstacle physical-contact feedback recorded for V2.

## Run and scope

Run `npm run dev:phaser`, then open `http://127.0.0.1:4538/duck-race/preview/phaser`.

This is an isolated interactive local preview. It needs no login or database, uses four native ducks, a dry course and a small local question fixture, and never writes live-room points. Production rooms retain the existing renderer until V2 collision parity and later integration approvals. Combat buttons currently preview the correct native poses; they do not claim multiplayer combat is migrated. Lucky slots show their empty presentation, with no preview card distribution.

Implemented under `frontend/src/games/duck-race/phaser/`:

- Lazy-loaded Phaser 4.2.1, one game instance per React mount, Boot/Race scenes, progress/error/retry and teardown.
- Exact existing v12 atlas metadata adapted without repacking pixels; nearest filtering for native ducks, smooth filtering for painted scenery.
- Ground X/Y separate from jump Z; constant body scale 3.2 and source baseline 48. Fixed ground shadow, depth ordering, ground-based follow camera, bounded 60,000px horizontal course.
- Manual continuous movement, fixed-step local fixture, no lane snapping or passive drift; basic jump/double-air, native roll, crouch/crawl, guard-facing and attack pose selection.
- React controls, pointer capture/cancel/release, blur release, keyboard operation after buying, modal question sheet, focus containment/Escape and input release while answering on mobile. Question and match clocks continue while the sheet is open.
- Approved desktop and phone composition, compact HUD, existing painted role frames and a generated wooden foreground control tile. See `V1-ASSETS.md` for asset/prompt provenance.
- A narrow snapshot/intent adapter is ready for later live integration; no extra socket is created by a scene.
- Duck-only pointer UX: mouse clicks suppress the rectangular button outline, keyboard Tab retains visible focus, dragging cannot select game text/images, and the context menu is suppressed across the game surface. Editable fields retain text selection. Context-menu suppression does not cancel pointer-down/up used by guard.

## Verification run

- `npm run build -w frontend`: passed, including dedicated lazy Phaser chunk. Build retains large-chunk notices.
- `npm run lint -w frontend`: zero errors, no new Phaser warnings. Existing factory-game warnings remain.
- `node --import tsx scripts/duck-phaser-v1.qa.ts`: **11 checks passed**: no passive drift, key release, frame-rate independence, continuous depth/bounds, rooted guard/facing, independent jump Z/constant scale, native roll/payment, crouch/crawl, idempotent answers/timer, native frame registration, snapshot forwarding and ten-minute stop.
- `node scripts/check-game-boundaries.cjs`: **624 local imports passed**; no cross-game source imports or shared renderer instance.
- Setup verifier and `git diff --check`: passed.
- Browser viewports measured: **1440×900, 1366×768, 768×1024, 390×844 and 360×800**. Document width/height matched viewport; one Phaser canvas; no broken images; gameplay tap targets at least 44px.
- Browser controls exercised: WASD then release, double jump, paid boost then keyboard movement, mobile question open/close. Actual double-jump sample: pose `double_jump`, body scale `3.2`, shadow Y `502`, camera Y unchanged. Opening the question sheet blocked held/game movement while its clock continued.
- Browser screenshot evidence is in `design-preview/duck-race-phaser-v1/implemented/`; browser viewport emulation was used, not physical mobile hardware.
- Latest mouse checks at 1440×900 and 768×1024: clicking Attack leaves computed outline `none`; Tab changes to the keyboard focus outline; drag selection is empty; right-clicking both the race and sidebar shows no browser context menu. Screenshot: `mouse-fixed-1440.png`. Native mouse-hold automation did not provide a reliable mid-hold sample; guard logic itself passed the rooted/facing unit check.

## Not yet verified / next approval

No claim of live-room migration, 50-player performance, physical-device FPS, full collision/combat parity, terrain/catcher or equipment presentation. Those belong to V2–V5. Heap/GPU long-run profiling is also deferred.

V2 review package: `design-preview/duck-race-phaser-v2/`. It adds grounded obstacle art with correct blocking direction, base/cast-shadow consistency, physical-height distinctions, and exact-native motion/contact storyboards. The rear pillar has been moved fully onto sand, and the overhead obstacle replaced by a clearly marked Shift crawl-under canopy in response to the latest review. No V2 runtime code is authorized or activated yet.
