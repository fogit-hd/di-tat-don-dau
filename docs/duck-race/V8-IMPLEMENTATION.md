# Duck Race v8 — native model and frame-fitted equipment

The approved canvas has been applied. The later user corrections take precedence: all ducks use the round native model shown in reference 2; the AI-painted long-bodied character proposals are not loaded.

## Character pipeline

- Source: `C:/Users/PHONG/Downloads/DuckyV2/Ducky/Spritesheets`.
- `scripts/prepare-duck-v8.py` maps native idle palette correspondences to each colour, preserving native geometry and pixel outlines across every pose. Output: `ducks-v8.json/png`, 171 clips / 540 frames.
- Standing attack uses `f_smash`, moving attack `f_tilt`, aerial attack `down_smash`, guard `shield`, double jump `multi_jump`, KO `death`. Some original clips contain only one native frame; their translation/elevation is driven by game physics, not invented limb animation.
- Swim preserves the native head/body and removes the legs below the waterline. It is an adaptation of native frames with Pixi wake effects, not a separately supplied swimming clip. Mud uses the same native model at a slower gait with ground contact/splashes.
- `scripts/prepare-duck-gear.py` draws small pixel accessories and bakes 480 transparent overlays registered to individual native frames. Their orientation and occlusion are encoded in the texture; the renderer selects the exact matching body/gear frame. Glasses/collar are masked behind the original beak, and submerged footwear is hidden. Inventory art matches the equipped pixel art.
- The original unrelated generated character files are not referenced by the active atlas. The new exporter does not import generated character proposals.

## Gameplay and UI

- Straight 60,000px world, free WASD movement, no automatic movement or lanes. Walk 96px/s; roll 390px/s before equipment/weather modifiers.
- Two deliberate airborne jump presses, bounded total flight; roll energy is spent by actual movement. Reconciliation preserves direction while the server owns collisions.
- LMB attack; held RMB guard on the playfield. A guard within its first 260ms reflects the hit. The hit party recoils and is stunned for 1.5s. Mouse context menu is suppressed only over the active playfield.
- Obstacle KO retreats before the obstacle, then white body recovery flashes. The helmet only reduces obstacle stun, not combat stun.
- Full-width long water/mud stretches. Physical obstacles are local objects that can be steered around; environment events spawn every 30s for 10s. Gantry posts remain grounded while only the suspended beam and ropes move; boulders move across the road with their own shadows.
- Entry asks room code/name; colour and two equipment slots are selected in a lobby overlay. Equipment is server-validated and locked on start. Rewards and prices remain integer points.
- Gameplay fits one viewport. Mobile keeps the race visible; questions, roll purchases and cards live in an overlay. Opening the question panel releases held controls. Host shows all names; players see only their own red marker.
- Error banners are replaced by compact expiring accessible toasts. Existing painted nine-slice frames remain inside their elements.

## Validation

- Frontend and backend builds pass; lint has existing factory-game warnings, no new Duck Race warnings.
- 26 authoritative-engine tests cover economy, room isolation, duplicate names across rooms, 50-player capacity, continuous movement, collisions, true double jump, guard/parry, recoil, equipment validation, finish detection, and frozen results.
- `scripts/duck-v8.qa.cjs`: Chromium screenshots at 390×844, 768×1024, 1440×900 and 844×390; real join/customize/save, LMB standing/running/aerial attacks, RMB guard, double jump, overlay questions, camera/label isolation. No page overflow or renderer errors.
- `scripts/duck-multiplayer-v8.qa.cjs`: 50 connected players, all 50 host nameplates, no opponent labels on player view, one local marker, no page overflow or renderer errors.
- Screenshots and machine-readable results: `design-preview/duck-race-v8/`.
- Not certified: sustained 60 FPS on physical low-end phones, iOS multi-touch on hardware, or final accessory balance across repeated ten-minute matches. Current browser checks use desktop Chromium emulation.

Local review: `http://127.0.0.1:4525/duck-race`; isolated API at port 4608. No deployment or commit was performed.
