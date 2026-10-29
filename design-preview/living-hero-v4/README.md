# Grounded walking and departure-facing crew

Addresses the user's two motion corrections: floating/jerky porter steps, and a
deckhand who kept looking back at the berth after the boat departed.

## Root causes and changes

- The old walk restarted its frame clock at each route segment. It also
  re-centred the sprite camera using each frame's clothing/hip pixels, which
  caused lateral body jumps as the legs and arms changed shape. Two new
  sixteen-pose, complete-body cycles keep one camera origin and a calibrated
  boot floor. `grounded-walk.ts` measures distance in body heights and advances
  one gait phase through the doorway and all other route points. Speed eases
  into and out of the walk; torso travel is continuous.
- The old hands-clear interval translated a standing pose backwards/downwards.
  That was skating, not a step. The porter now pivots in place through eight
  drawn poses, then walks back with a separately painted empty-handed cycle.
  The return walk reflects a complete walking sheet only after the real pivot
  has finished. A reflected still image never substitutes for a turn. No
  body-part assembly, CSS character motion or whole-body bobbing.
- A new complete placing/rigging sequence keeps the worker on the concrete
  apron and the box on the low pallet beside him. The pallet top is an explicit
  world contact anchor. Hand release precedes crane movement.
- The deckhand completes unhooking, turns head/shoulders/torso/boots through
  eight drawn poses from 14.8 to 15.84 seconds, then faces right throughout the
  boat's rightward departure, which starts at 16 seconds. The worker's position
  remains attached to the boat's deck throughout the turn.
- New atlas cells are 384px with a 240px standing-body reference. This keeps
  the two walking textures at 1536×1536 and the action/turn textures at
  1536×768, rather than loading approximately 200MB of oversized pose textures
  into mobile memory. Per-clip origins/scales preserve their world proportions.

## Art route and prompt set

Built-in ImageGen with native transparency, not the external Sprite Forge video
pipeline. Local production files are in
`frontend/public/assets/living-hero-v4/`: `carry.webp`, `return.webp`,
`setdown.webp`, `pivot.webp`, `turn.webp`, `parcel.webp`, `porter.json`.
`porter-sprites-v4.json` contains the source IDs and camera/stride metadata.

Prompt set, all matching the accepted navy-cap/cream-shirt/blue-overall painted
porter and the straw-hat receiving worker:

1. Sixteen right-facing whole-body carrying poses, conditioned on the local
   sixteen-position joint/sole guide, one alternating heel-strike,
   stance, passing, toe-off and swing cycle; fixed camera, stable crate held in
   both hands; 4×4 native-alpha sheet. Source `7024744b-b82b-48be-ab1e-a957592da4fb`.
2. Sixteen empty-handed return poses, conditioned on the matching pose guide,
   alternating legs and natural arm counter-swing; same fixed camera and ground
   baseline. ImageGen retained right-facing identity despite the left-facing
   guide; the complete sheet is reflected for the leftward return after the
   separately drawn pivot. Source `67038f45-331f-46ff-ade5-c5208ce78486`.
3. Eight complete straw-hat worker poses pivoting from left through front to
   right, watching the actual direction of departure. Source
   `aecd192d-91b0-44da-9313-0d79518981d6`.
4. Eight placing/rigging poses with the box resting on a low surface above the
   boots, while the worker stays on level ground; hands release before lifting.
   Source `769904a9-2adb-4c1b-9fd7-68a2a808825e`.
5. Eight flat-cap porter poses pivoting right-to-left in place, hands empty,
   knees and boots turning with the torso. Source
   `d54cdffc-915b-4a06-9776-52ff0a0938d6`.

`pack-footlocked-porters.py` and `sprite_pack_utils.py` pack/register the complete
poses and annotate soles/stride; they do not draw new body parts. An experimental
FFmpeg motion-interpolation pass produced ghosted boots and was rejected. None
of its assets are loaded by the production page; rejected results are retained
only under `rejected-motion-interpolation/` for the visual audit. Production is
painted cel animation, not generated live-action video or optical-flow morphing.

## Fidelity ledger / verification

| Comparison point | Reference and result |
| --- | --- |
| Container/layout | Keeps the accepted v3 full-bleed navbar + hero; no new frame or section. |
| Copy and forms | Same heading, subtitle, room-code input, navigation and handlers; no visible copy added/removed. |
| Palette and identity | Native source atlases keep the established watercolor/ink, navy, cream, wood and straw-hat art. |
| Ground and scale | Boots registered to their floor baseline; one fixed camera per walking sheet; box contacts the measured pallet. No runtime body zoom. |
| Motion and direction | Distance-based gait does not restart at waypoints; no sliding standing pose; crew finishes turning before departure. |
| Responsive/accessibility | Existing contain geometry, full-bleed boundaries, pause, reduced motion and offscreen/modal suspension retained. |

`scripts/porter-delivery.qa.cjs` captures 25 actual-renderer timestamps in both
layouts and checks continuous shipment handovers, hands-clear timing, the
moored-boat interval, cable/contact points, no mid-walk phase reset, continuous
walk roots, stationary pivot and right-facing departure. `scripts/living-hero.qa.cjs`
checks 360×800, 390×844, 768×1024, 844×390, 1440×900 and 1920×1080, including no
document overflow, actual production pose URLs, join validation and pause states.
Build/lint outcomes and screenshots are in `verification/`;
`replay-desktop.webm` records an actual complete cycle of the production
component, waiting for the scene clock to wrap rather than assuming a fixed
wall duration under recording load. Native key poses and
actual rendered samples were visually inspected, including the turn and handoff.
No physical-device performance profiling or production deployment.
