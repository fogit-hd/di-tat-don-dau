# Guard and native movement correction

- Hold right mouse / the guard control: both world coordinates remain fixed, speed is zero and paid-distance reserve is preserved. A/D changes facing only; W/S cannot translate. Releasing guard restores ordinary movement from the currently held directions.
- Starting a jump or attack while guarding does nothing. An existing airborne trajectory still lands normally; holding guard does not teleport the duck to the ground.
- A successful parry requires facing the attacker and the original 260ms timing window. Turning an already-held guard does not renew that window. Knockback/stun remain 1.5 seconds.
- Native `roll_1` and the native jump sequence shared nearly identical tumble poses. Version 12 restores the compact native `roll_2` clip. Takeoff uses only the native preparation pose, followed by airborne and falling poses on the first jump as well as the second.
- Source floating clips were 34 pixels wide against the standing body's 23 pixels. All floating clips are prepared at 23 pixels wide using the same offline transform and the same 64px canvas / y=48 anchor. Runtime body scale stays 3.2. Gear overlays are regenerated against every exported frame.

## Obstacle canvas (pending approval)

**Superseded design:** the user subsequently replaced three placement bands with continuous random Y positions and lengths. See `design-preview/duck-race-v13/README.md` and the version-13 canvases. Do not implement the three-band proposal below as the final design.

The first draft is superseded. `design-preview/duck-race-v12/obstacle-canvas-corrected.png` distinguishes a ground footprint along **Y**, a narrow thickness along **X**, and physical obstacle height **Z**. A fallen log lies on the road, not upright. Crates form a depth row, not a tower. At each fixed world X, at least one of three Y regions remains clear.

The replacement art has not been applied or the previous assets deleted: the user requested a corrected design after rejecting the first draft. The current authoritative course still uses the version-11 fixed-world layout until the replacement design is approved.

The generated board is an art direction reference; its decorative arrows and dimensions are not collision data. Actual collision geometry must be defined in world units and tested against the full free Y band.

## Validation

- `npm run test -w backend -- src/duck-race/guard.test.ts src/duck-race/course.test.ts src/duck-race/engine.test.ts`: 47 tests pass.
- Frontend and backend builds pass; frontend lint has no errors (12 existing factory-game warnings).
- `node scripts/check-game-boundaries.cjs`: no cross-game imports/shared renderer.
- `node scripts/sync-duck-contracts.cjs --check`: deployment copies match.
- `python scripts/verify-duck-motion-v12.py`: checks packed pixels, 23px airborne width, transparent gutters, native roll source and corresponding equipment frames.
- Full backend suite: 237 pass, 1 PostgreSQL integration test skipped. The 64-course property test needed an explicit 20s timeout under full-suite CPU contention; all its assertions remain intact.
- Native frame contact sheets were visually inspected. Holding a synthetic browser right-click did not provide a reliable held-pointer observation, so browser guard/roll interaction is not claimed as verified; authority and prediction are covered by the tests above.
