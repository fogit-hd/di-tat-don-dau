# V4 experience — implementation and verification

Approved by the user on 2026-11-06: “canvas này ổn, bắt đầu thiết kế”. Implemented for newly created Duck Race rooms; the factory game and existing legacy rooms keep their own engines. No deployment performed.

## Runtime ownership

- `frontend/src/games/duck-race/experience/`: landing, checked code → name → join, seven-player lobby/cosmetic drawer, responsive race/question/chest/result UI, dedicated Phaser lifecycle.
- `backend/src/games/duck-race/experience/`: authoritative room/timer/question/reward/chest state. The game server dispatches new `quiz-v4` rooms here; legacy rooms retain the old path.
- `shared/experience-contracts.ts`, `shared/duck-score-motion.ts`, `shared/duck-race.ts`: canonical contracts and rendering-only point motion, copied into isolated deployments by `scripts/sync-duck-contracts.cjs`.
- `frontend/public/assets/duck-race/experience-v4/`: generated transparent lettering, landing painting, textured frames, native/cosmetic atlases and registration/source manifests. `scripts/package-duck-experience-production.py` packages these without changing the native duck body.

## Rules actually implemented

12 minutes; seven groups; six two-minute eras, four cycling panoramas each. One integer score, never consumed by cruising. Point coordinate uses 3.2 world px/point, independent of camera/zoom. The common cruising presentation does not award points. No obstacles/manual motor in new rooms.

Questions are private to the owner and last ten seconds. Correct: random integer 50–150 plus one selected chest. Wrong/timeout: hidden question and ten-second lock. Chest reveal is server-timed, selected exactly once, followed by five seconds before the next question; chosen-target effects wait for selection. One Hope Star doubles the next correct reward or deducts the prospective reward on failure, floored at zero. Every thirty seconds all groups receive the same random integer 10–50; the last boundary is included.

Three equally sized native painted chests open in place using six frames and painted particle frames. The 28 bounded chest events cover safe, single-person and explosive scopes. Private results are withheld until reveal; duplicate submits cannot award again. Selected pending results settle once on finish. Host alone pauses/ends; pause freezes all game deadlines.

Only brass/dark goggles and short red/teal scarves are available, with no buffs. Overlay atlas registration follows every native pose/frame. Each view owns/destroys its own Phaser instance. Google identity remains the existing shared `/api/auth/google` session.

## Verification actually run

- Backend and frontend production builds passed. Vite reports the existing large renderer/vendor chunk warnings.
- All 86 Duck Race tests passed before final UI-only polish. Re-ran the V4 engine, motion and HTTP suites after final engine changes: 21 passed. HTTP tests require loopback access outside the restricted shell sandbox; the sandbox attempt failed with EACCES, then the identical command passed with loopback permission.
- Contract synchronization check passed. Frontend lint exits successfully with warnings; it is not warning-free.
- Real browser checked code/preflight/name/join, seven-group limit, native cosmetics, private questions, correct/wrong/timed transitions, chest opening, pause/resume, end/results and ten-item history pagination. The visual fixture uses synthetic identity only in a test file, never a production auth bypass.
- Actual runtime screenshots at 390×844, 768×1024 and 1440×900 are in `design-preview/duck-race-experience-v4/implementation/`. Question layouts had no document overflow at those widths; tablet portrait stacks the panels. Landing captured at 390 and 1440. Desktop chest state also captured.

Not verified: a real Google-account round trip, physical-device touch/performance or a 7-device/12-minute soak test, and Render deployment. No performance guarantee is inferred from desktop visual QA.

## Follow-up after V4 completion: lying-only recoil

Applied the subsequent screenshot feedback using the original `knockout/0` rounded side-lying frame, matching the supplied screenshot. The duck stays on the road, slides by the actual deducted points × 3.2 world px, briefly uses native `land/1` to stand and returns to running. No airborne arc, rotation or scale changes. Common cruise is held during the slide so a small loss cannot appear to move forward; normal cruise catches up smoothly afterward. An overlapping penalty adds to the unfinished slide target, and reconnects do not replay old penalties.

Additional tests cover exact 150-point/480px recoil, overlapping losses, one-point recoil and reduced-motion behavior. Final full Duck Race regression: **88 tests passed across nine files**.

Local handoff: frontend http://127.0.0.1:4525/duck-race and real Duck Race API :4608. The opt-in QA backend was stopped; no synthetic room or identity is retained by the real process. Final frontend build and lint passed (lint warnings remain). The selected native rounded recoil frame was verified directly in Phaser at constant scale 2.7 before the QA server was stopped; `runtime-recoil-1440.jpg` records that state.

## 2026-11-06 follow-up — field, navbar and expanded chests

- Removed the V4 field's extra focus-within rectangle. Native input remains borderless; a pointer-transparent Phaser feather and eight pooled painted spark sprites indicate focus, with a static SVG fallback and reduced-motion support. The pre-existing painted field frame stays fixed.
- Scoped V4 navigation alignment gives the link and button identical 44px flex boxes and equal SVG lettering metrics. Explicit desktop/tablet grid placement prevents the shared 800px nav rule from moving links into a second row.
- Expanded 28 → 72 events (16 safe / 24 single / 32 explosive), including 20 true point transfers. The complete catalogue and limits are in `CHEST-EVENTS-V4.md`. Transfer debits and credits conserve points; shielding, empty purses, target validation, solo play, duplicate requests and final settlement are covered by tests. All-player budget is split evenly rather than exhausted in join order.
- Changed files for this follow-up: Duck-local `experience.css`, `DuckExperience.tsx`, `PhaserView.tsx`, `createExperienceGame.ts`; new `FieldFeedback.tsx`; backend `experience/events.ts`, `engine.ts`, `engine.test.ts`; documentation. No factory or shared navbar implementation edits.
- Verification: backend/frontend builds passed; frontend lint exits 0 with warnings. Full Duck Race regression passed 95 tests. After the final equal-share change, the 22 engine tests were rerun. Browser checked 390×844, 768×1024 and 1440×900. Input and wrapper computed outline width 0 / box-shadow none; nav label Y/height equal; Phaser focus canvas rendered; no document overflow. `focus-navbar-fixed-1440.jpg` is an actual screenshot, not a mockup. Deployment, real Google auth and real-device keyboard behavior were not tested in this follow-up.
