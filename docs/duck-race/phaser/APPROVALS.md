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

## 2026-11-06 — recipient receipts, painted chest/weather FX and event expansion

User explicitly requested fixing duplicate joins from repeated Chrome submissions, central recipient-specific chest notices (including percentages and multi-target events), applying the already-created lightning/wind canvas, and adding more interactions. This authorizes that subset of the V5 review package and the requested notices; it does **not** authorize replacing the host layout with the separate 50/25/25 canvas. This change keeps the existing host composition and original native duck model.

## 2026-11-07 — approved host results ceremony applied

User: “áp dụng vào dự án này”, referring to `design-preview/duck-race-results-v1/?rev=8` after the grounded silver-box and compact-wing gold corrections. This authorizes the current results ceremony in Quiz Duck Race: host-only top 3, distinct bronze climb / silver gift unfolding / gold parachute entrances in 3 → 2 → 1 order, native crown retrieval / two-wing lift / fitted wearing cels, and lower ranks 4–7. Player results remain personal. This is approval of this results surface, not the separate host realtime layout or other migration milestones.

Implemented in `frontend/src/games/duck-race/experience/results/` with an independently owned Phaser instance. Eight native palette variants preserve the approved model geometry. Server-supplied final ranks and points are read-only; no client animation changes outcomes. See `RESULTS-CEREMONY.md` for verification and local fixture.

## 2026-11-07 — eight-minute correction and approved art integration

User explicitly requested eight minutes, four distinct eras 1.0–4.0, correcting deployed era rendering, applying the previously approved lightning/wind/weather and three-second background-free event notices, and retaining wardrobe items at results. This authorizes those corrections to current quiz-v4 rooms. New rules are 480 seconds with era boundaries at 120, 240 and 360 seconds. Historical durations above describe earlier versions.

The four approved industrial paintings and six-cel effects from the notices-v8 canvas are packaged in `public/assets/duck-race/experience-v6/`. The renderer scrolls a whole aspect-preserved painting instead of stretching separate scenery/road strips. No deployment was performed.

## 2026-11-07 — replacement bronze and silver ceremony

User requested replacing all second- and third-place animation. In the V2 review
response they selected “Cần sửa top 2”, followed by “Thay toàn bộ ý tưởng của top 2”.
The revised silver motion in V3 was explicitly approved with “Duyệt top 2 mới”.
The applied pair is the V2 bronze spring/landing/wave and V3 silver rope swing,
two-foot contact, grip release, medal retrieval and two-wing presentation.

The final PNG cels, their body scale, selected wardrobe and prop occlusion are
exported into production assets. A rope socket above the handhold drives Phaser
geometry during the silver entry. The first-place sequence uses its previously
approved parachute/crown cels. This approval authorizes integration into the
current result surface. Deployment remains a separate action.

## 2026-11-07 — bronze skateboard and number card V5

User rejected the V4 entrance and requested replacing the entire arrival. They
then explicitly approved V5 with “Duyệt top 3 V5” at
`design-preview/duck-race-results-v5/?view=bronze`. This approves its wooden
runway, skateboard arrival, native-foot dismount, kick-away, card retrieval,
upright copper number 3 and two-wing chest-height presentation in the current
host results ceremony. The production export retains eight original duckee
palettes and the selected registered scarf/glasses. The reviewed bronze turn
is 4.4 seconds, followed by silver then gold. This approval covers integration.

## 2026-11-07 — fitted crown and eye-aligned glasses

User approved the crown in the wardrobe review with “duyệt vương miệng”, and
explicitly requested placing glasses over the eyes and treating glasses as
the on-head selection, mutually exclusive with normal hats. They separately
confirmed “Vương miện được đeo cùng kính”. This authorizes the fitted winner
crown and the requested correction to existing glasses throughout the game.

The knit cap, safety helmet, leaf pin and bow models remain review proposals.
The live wardrobe's existing glasses choices are grouped as “Trang sức trên
đầu”. The review combines glasses and hats into one selection rather than
allowing a glasses/hats stack. The award crown is the explicitly approved
exception and remains compatible with both glasses styles and scarves.

## 2026-11-08 — score and position swap

User approved with “ok, tôi duyệt” after reviewing the swap canvas and the
example exchanging 1,200 and 800 points. This covers swapping the two server
scores and moving their original dressed ducks with gold/cyan portals over
900ms. Reference `design-preview/duck-race-swap-v1/storyboard.png`. The event
belongs to the explosive chest and lets the opener choose one other group.
Both recipients receive a receipt and the host log records the exchange.

## 2026-11-09 — wardrobe V2 integration

User explicitly selected “Duyệt để áp dụng” for the interactive V2 review at
`design-preview/duck-race-wardrobe-v2/`. Approved additions: knit cap, safety
helmet, leaf pin, bow tie, necktie, satchel, business suit/trousers and worker
overalls. The head slot replaces hats with glasses; body accessories share one
slot with scarves. Full outfits are exclusive: selecting a set clears separate
items; selecting a separate item removes the set. This approval covers lobby,
race, portraits and all three already-approved awards choreographies. No body
redesign or motion timing changes. Crown remains compatible with glasses;
it replaces a hat for the coronation rather than stacking on the hat.

## 2026-11-09 — winner party V1

User approved “Duyệt để áp dụng” for hat stowing and three native-frame winner dances. Integrate after coronation, retain glasses and outfits, keep bronze/silver choreography and remove visible motion-description captions as requested.
