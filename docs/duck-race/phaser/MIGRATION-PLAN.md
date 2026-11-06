# Quiz Duck Race → Phaser 4

Prepared 2026-11-04. This is the migration plan and first canvas submission, not an activated Phaser gameplay build.

Update: V1 canvas explicitly approved and its isolated interactive preview implemented at `/duck-race/preview/phaser`. Run `npm run dev:phaser` and see `V1-REPORT.md`. Production rooms still use the existing renderer until V2 collision parity and later integration approvals.

## Installed foundation

- Frontend dependency `phaser` pinned exactly to **4.2.1**, with npm lockfile.
- 28 official Phaser skills installed in `.agents/skills`, pinned to `phaserjs/phaser` commit `02d8931b626d9764c133cbb3fbf99966c03c757c`.
- Existing React/Vite, Socket.io, shared Google identity and the combined backend remain the integration foundation.
- No Phaser game instance, scene, route switch or movement replacement is activated before V1 canvas approval.

## Product contract

- Ten-minute horizontal world, current length **60,000 world px**, start left and finish right. Camera shows a portion, never the entire map.
- WASD moves continuously in ground X/Y; release stops; no auto-walk, lane snapping or Y buckets.
- Space: jump; second press in the air: double jump. E: existing paid boost/roll action. Shift: held crouch, with a separate crawl clip while moving.
- Left mouse attacks; right mouse guards. Guard is rooted; A/D turns the guard. Preserve equivalent touch buttons.
- Original native round duck and its colours. Player sees only their own overhead marker; host sees all names. Long names remain readable in the HUD/list without stretching rows.
- Distinct authored silhouettes for jumpable, double-jump, overhead and impassable objects. Fixed world X with random continuous Y/span; a walkable opening or valid physical action must always exist.
- Server decides points, funds, collision results, capture and final rank. A captured racer's own turn freezes; other players continue.
- Player controls sit in the foreground soil. Mobile prioritizes the race and opens questions in an overlay. No repeated instruction text on obstacles.
- Art remains hand-painted scenery/frames with original pixel sprites. Image generation does not replace native movement frames.

## Architecture

Planned Duck-local ownership:

```text
games/duck-race/phaser/
  PhaserRaceView.tsx          React lifecycle: mount/destroy one Phaser.Game
  createGameConfig.ts        renderer / scale / fixed-step configuration
  scenes/BootScene.ts        loading progress and explicit retry
  scenes/RaceScene.ts        world, native actors, obstacles and camera
  scenes/FxScene.ts          effects and input feedback, not economic state
  actors/DuckActor.ts        state → registered native animation
  actors/CatcherActor.ts     authored net/capture frames
  world/WorldLayers.ts       scenery / walkable ground / foreground
  world/ObstacleView.ts      physical footprint + rendered model registration
  bridge/SimulationBridge.ts authoritative snapshots and local prediction
  bridge/InputController.ts keyboard / mouse / multi-touch intent
  assets/atlasAdapter.ts     existing atlas frames and animation manifests
```

This is a proposed file map, not scaffolded gameplay code. The React question/lobby/account screens continue using the same handlers. `RaceSnapshot`, input intents and existing backend engine are adapted through a narrow bridge rather than making Phaser the authority for points.

## Critical coordinate decision

Use three independent values: ground **x**, ground depth **y**, and physical jump height **z**. Render the body at `(x, y-z)` and its shadow at `(x, y)`. The camera follows the ground anchor, not the jumping sprite. A 64px source frame keeps its registered ground baseline at y=48 and a constant display scale across states.

Arcade Physics has zero global Y gravity for this shallow-depth track. Ground footprints and collision groups use X/Y; the jump controller supplies Z. Obstacle vertical clearance is checked separately. Do not turn W/S into jump physics, adopt a top-down look, or use sprite scale to simulate jumping.

Keep the existing deterministic server motor authoritative. Phaser broadphase/overlap and presentation prediction must agree with that motor; never advance both an Arcade velocity solver and a second prediction solver on the same actor. Validate collision parity during V2 before enabling the new view for live rooms.

## Approval and delivery sequence

| Version | Canvas submitted before code | Implementation after approval | Acceptance |
| --- | --- | --- | --- |
| V1 | Desktop player; mobile question closed/open; real native pose board | One Phaser instance, Boot/Race scenes, native atlas adapter, basic movement/air states, fixed-scale camera, responsive shell | Feet/shadow registered, no body resizing, no passive drift, no scene/ticker leak, UI fits target sizes |
| V2 | Every obstacle silhouette/footprint; jump/double/crouch/roll paths; attack/parry/recovery storyboard | Fixed world obstacles, swept collision parity, full state priority and combat presentation | No tunnelling during boost; guard rooted; correct 1.5s stun/reflection; no duplicate hit rewards |
| V3 | Finite natural-edged water/mud with dry route; entry/exit frames; catcher net/gear detail | Native swim/mud movement, authored animated surfaces/contact FX, catcher and frame-registered gear | No rectangular terrain cut, no floating equipment, native duck physically inside net, captured turn frozen |
| V4 | Host realtime and camera states; 50-player names; touch/lobby/results states and input-feedback frames | Full React/socket integration, host camera modes, UI feedback and device-specific controls | Shared login survives game switches, names do not overlap, touch releases correctly, questions do not steal gameplay keys |
| V5 | Final desktop/tablet/mobile comparison and terminal/loading/error states | Complete audit/removal of Duck Pixi/GSAP code, dependency cleanup where unused, release candidate | No remaining Duck Pixi runtime; build/tests pass; reconnect, cleanup and long-run checks pass |

Each version requires an explicit review response before its code starts. A new required asset gets an asset sheet/state storyboard in that version's approval package. Static canvases do not prove animation quality: each coded version also needs real browser footage/frame inspection before completion.

## Native asset plan

- Reuse `ducks-v12` source frames for idle, walk/run, takeoff/fall, native `roll_2`, crouch/crawl, double-jump air, directional attacks, guard, damage and knockout.
- Convert atlas metadata to Phaser-compatible frame/animation data. Preserve padding, source sizes, pivots and frame order; do not stretch transparent crops to different body sizes.
- Re-register equipment using native pose/frame sockets. Catcher art needs the native duck behind the front mesh at its authored angle, not a CSS sticker.
- Painted terrain/UI textures keep smooth filtering; duck/gear atlases use nearest-neighbour. VFX use authored frame sequences/particle textures; character poses are not CSS animations.
- Preserve differentiated frame roles. Export fixed lettering as existing SVG path art and keep dynamic values/accessibility text separate from the frame artwork.

## Network, lifecycle and responsive gates

- One combined backend service and one frontend service; no new Render service. Both games use `/api/auth` and the same browser account session.
- Phaser loads lazily only for the race. Scene shutdown removes its listeners/timers; React cleanup destroys the game and canvas. Restart/unmount must not multiply sockets or loops.
- Prediction uses held input history, reconciliation and server time; interpolation is not proof of authoritative movement. Blur, drawer opening and touch cancel release held controls.
- Target screens: 1440×900, 1366×768, 768×1024, 390×844 and 360×800. Test real responsive layout, not only scaling a desktop screenshot.
- Desktop: race + readable question column; controls on soil. Under 1024px: question toggle/sheet, race stays horizontal, minimum 44px touch targets. Keep world geometry invariant during resize; change viewport/HUD layout instead.
- Performance targets to measure, not claimed results: smooth 60Hz rendering on the test desktop; at least 30 FPS on representative mobile hardware; bounded visible objects/textures with 50 racers. Test actual devices before asserting results.

## First submission V1

`design-preview/duck-race-phaser-v1/` contains generated desktop/mobile visual concepts and an exact-source native pose board. The concepts use sample values/questions for visual review. They are not a running Phaser conversion.

Review: composition, prominence of the road, control placement, phone question overlay, native model, coordinate/animation contract. Approval unlocks V1 only.
