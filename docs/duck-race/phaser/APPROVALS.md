# Phaser migration approvals

| Milestone | State | Evidence |
| --- | --- | --- |
| Setup: install engine and agent skills; prepare plan/canvas | Authorized, completed | User requested Phaser migration and installation on 2026-11-04 |
| V1: native duck, horizontal world, camera and player desktop/mobile layout | **Approved; implemented as isolated interactive preview** | User: “canvas tôi duyệt”, with obstacle grounding/contact-shadow feedback, 2026-11-04. `design-preview/duck-race-phaser-v1/`; `/duck-race/preview/phaser`; see `V1-REPORT.md` |
| V2: obstacles, jump/crouch/roll rules, combat and recovery | **Selected vertical crawl model approved and implemented in isolated preview; other obstacle art NOT approved** | Latest scope: “tôi duyệt mỗi cái này, không duyệt mấy cái kia.” The attached `94992c33…png` is the selected model. See `CRAWL-REPORT.md`. Previous V2 behavior approval does not authorize the other paintings. |
| V3: water, mud, weather, catcher, equipment registration | Not submitted; no coding approval | Must supply terrain transition and captured-duck animation canvases first |
| V4: host, lobby/results integration, input effects, 50-player presentation | Not submitted; no coding approval | Must supply host and responsive state canvases first |
| V5: final integration, old-renderer removal and release checks | Not submitted; no coding approval | Must supply final state/responsive comparison first |

A user response approving one milestone authorizes that milestone only. Record their actual response and any modifications before implementation. Never pre-fill a future approval.

V1 is delivered through an isolated interactive preview before live-room collision parity in V2. The current live renderer remains available. Obstacle feedback recorded for V2: painted silhouettes must share the road perspective, physical base and contact shadow; the duck must touch the visible model at the actual collision surface. Show ground registration, occlusion and contact states in the V2 canvas before implementing those obstacles.

V2 was explicitly approved after the protruding-pillar/missing-Shift revision. Later steering requests a further correction to the crawl canopy's orientation: entrance on the left, exit on the right, matching +X travel, rather than a portal facing the viewer. New V2 Phaser runtime art has not been activated yet.

Further refinement: user requested a much lower, Shift-only opening, plus denser randomly positioned and sized obstacles without overlaps. The authoritative crawl-only and dense-course policies are implemented and tested; see `V2-RULES-UPDATE.md`. The lower painted concept is at `design-preview/duck-race-phaser-v2/crawl-direction.svg`; new Phaser obstacle art integration remains pending visual review. These policy changes do not activate a V2 Phaser renderer.

Latest visual feedback: the cavity still looked filled by wood and black shading. The concept was redrawn with no internal apron/backboard, continuous sand texture and visible daylight through the low left-to-right opening. Dedicated review uses the exact native sprites at fixed scale 3.2. No gameplay rules changed in this art revision.

The latest explicitly requested mouse UX fixes are applied to existing Duck Race and the V1 preview without changing obstacle gameplay: pointer-only focus treatment, game-text/image drag suppression, and game-surface context-menu suppression. Keyboard focus and editable field selection are preserved.

Visual review continuation: user approved the low naturally shaded cavity (“ổn, tôi duyệt canvas model này”), then asked to change the supports from diagonal to vertically aligned on screen. Clarification: “Hai trụ thẳng hàng trên–dưới màn hình, cùng vị trí X; vịt bò từ trái qua phải dưới thanh chắn.” The revised canvas is pending visual confirmation. Overall V2 approval persists; no runtime model activated by this art-only revision.

## Latest controlling approval — one model only

User: “cái này đúng nha, tôi duyệt mỗi cái này, không duyệt mấy cái kia. tiếp tục”. The supplied attachment is retained as `frontend/public/assets/duck-race/phaser-v2/approved-reference.png`. Its rear cap is plain wood (not the subsequent iron-faced review variant). Only this vertically aligned, low Shift crawl barrier is activated in the isolated `/duck-race/preview/phaser` fixture. Other obstacle paintings, water/mud/catcher art, and a switch of live rooms to Phaser remain unapproved. No new approval of the entire six-model board is inferred.

## Latest user steering — restore original and implement wind

User rejected both oblique review canvases and confirmed that the original long tapered silhouette is the intended shape. User then explicitly requested: “đúng, hãy thiết kế, sau đó áp trực tiếp vào game”, followed by the complete WindManager implementation request and two-direction airborne physics. This authorizes the exact original whole painting and the requested wind feature without another approval loop for those items. It does not authorize the previously rejected paintings or a wholesale live-renderer migration.

The original transparent painting now renders as one uniformly scaled image in Phaser and in the existing live obstacle view. No independently stretched middle or redesigned equal-sized cross-caps remain in this implementation. The new wind module and local Phaser controls are described in `WIND-SYSTEM.md`.

## 2026-11-06 — experience canvas V4 approved for implementation

User: “canvas này ổn, bắt đầu thiết kế”, replying to the complete V4 package and explicit statement that it had not yet been applied to live rooms. This approves implementing the submitted landing, code → check → name → lobby flow, 12-minute/seven-group points-only experience, responsive question/chest states, cosmetic-only scarf/goggles and native damage/fall/recovery sequence. References: `design-preview/duck-race-experience-v4/README.md`, seven comps and native motion preview; `V3-SCROLL-REVISION.md` supplies the preceding four-scenes-per-era motion proposal.

New rooms use the V4 rules and a dedicated Phaser view. Existing persisted rooms keep their previous engine until they finish; no reset or reinterpretation of their funds/state. The earlier manual-motor/no-passive-movement contract remains applicable only to those legacy rooms and the older isolated migration previews. In V4 the common cruising animation never changes points/ranks; gains and losses change the relative point coordinate, at 3.2 world px/point. This approval does not authorize deployment or a rewrite of the factory game.
