# Selected Shift crawl model — implementation

Only the user-attached vertically aligned timber barrier is approved. The other V2 concept paintings are not activated. The running room renderer has not been switched to Phaser.

## Asset

- `frontend/public/assets/duck-race/phaser-v2/approved-reference.png` retains the exact supplied canvas crop, with plain far cap.
- Built-in ImageGen isolated this model on transparency: `exec-a1aa6257-92cd-45d3-ac42-1d5c2fb778cd.png`. Prompt: preserve the selected wood/iron design and vertical support alignment; isolate obstacle, feet and attached small grass/stones only; remove landscape/soil, no extra rear metal face, no redesign, no duck or UI, no detached shadow.
- `scripts/package-crawl-gate.py` crops only transparent padding and exports lossless WebP plus PNG. No native-duck pixels are altered. Source/crop/registration metadata is beside the exports.
- `CrawlGateView` uses a single fixed world scale for both end faces and feet, a measured fixed X axis, and ground-registered contact-shadow textures. Only the timber section between the fixed ends changes length. No CSS obstacle/character animation and no skew/diagonal rotation.
- The native body remains at scale 3.2. The painting's near side occludes a body under/behind it; the own-player marker stays visible. No fake full-body overlay on top of the beam.

## Rules and scope

- Fixed world-X fixture repeats only this approved mandatory-crawl silhouette, covering both road banks. This type has no short/walk-around variant. Width, end faces, foot size and clearance remain fixed; no lanes, passive movement, or unapproved obstacle textures.
- Shift on the ground clears the hollow lintel; running, roll, jump one/two, guard and attack do not.
- The two planted feet have separate solid ground footprints. Shift cannot crawl through a foot, including entry along Y.
- `blockingObstacleContact` is shared by the backend authority and the isolated Phaser fixture. It uses swept contacts to prevent fast tunnelling. Existing non-crawl obstacle rules are retained.
- Preview contact stops then retreats to the entry side, with 1.5s stun and a brief white body flash on recovery. Recovery does not permit passage through solid wood.
- Live economics, routes, Google login, factory game, other obstacle art and live renderer selection are untouched.

## Verification actually run

- 56 backend Duck engine/course/guard tests passed, including solid-support checks.
- 11 V1 fixture/native/camera checks and 7 selected-crawl fixture/registration/clearance checks passed (74 total).
- Frontend production build and backend TypeScript build passed. Frontend lint: no errors; existing factory warnings remain. Existing large-chunk build warning remains.
- Shared-copy parity passed; game-boundary audit passed (635 local imports).
- Browser: running into the first lintel produced knockout and retreat to X≈545; Shift+D then crossed it to X≈805 without stun, body scale remained 3.2.
- Browser widths 1440×900, 768×1024 and 390×844: no root horizontal or vertical scroll. Mobile question sheet opened/closed; input released when opening.
- Screenshots: `design-preview/duck-race-phaser-v2/implemented/`: desktop/tablet/mobile, mobile sheet, collision and successful passage.

Not verified: multiplayer live-room Phaser collision/render parity, real-device performance, or the remaining V2 models/combat presentation. This delivers only the selected crawl obstacle in the local interactive preview.

Open `http://127.0.0.1:4538/duck-race/preview/phaser`. Reload starts the local ten-minute fixture; D moves toward the first gate, Shift+D crawls through it. No login or backend required for this preview.

## Projection/scale correction after user feedback

The initial implementation incorrectly used each gate's span to uniformly scale the entire sprite. That also shrank the feet, face width, timber thickness and clearance on short variants, giving an inconsistent apparent camera/distance. That implementation is superseded.

All selected-model instances now use one fixed end/foot scale, independent of span or world Y. The same approved texture is registered as three vertical source frames: far end, middle timber, near end. Only the middle length changes; caps/feet retain identical scale, painted face angles, width and height. Ground-Y placement translates objects without distance scaling. Collision thickness is now constant too. The native duck remains unchanged.

Regression verification: 7 crawl checks now enforce cap/foot/width invariance across lengths and Y positions; 11 V1 checks passed. In browser, the original long/short variants were inspected side by side and Shift passage still succeeded (X≈813, no stun). Screenshot: `implemented/crawl-fixed-projection.png`. No other obstacle designs or live-room renderer were activated.

## Mandatory-crawl coverage correction (supersedes short fixture variants)

User clarified that a mandatory Shift obstacle must visibly close the whole road, not invite a walk-around. All preview crawl gates now use centered full-depth coverage with a 6-world-pixel overlap into each bank. Foot centers remain on the playable soil; the painted ends meet the verge. The fixed cap/foot scale remains unchanged; only the middle timber extends to meet both banks. No invisible fence was added to disguise a visible opening.

The authoritative generator likewise creates underpasses only as full-depth action rows with proper approach/exit spacing; partial/random-span rows no longer choose that type. Course version is 5, upgraded only before racing; active race layouts stay frozen. Other obstacle types keep their existing bypass/action rules and their art is not activated here.

Verification: 57 backend tests, 11 V1 and 7 crawl checks passed (75 total). The new mandatory-gate checks sweep every integer ground Y from 416 through 584, including both banks, across 64 server seeds and the preview course. Non-crawling always collides; center Shift traversal passes. Browser: tested W+D at Y=416 and S+D at Y=584; both hit and retreated to X≈1043, while Shift+D through the center passed. Screenshot: `implemented/crawl-full-road.png`. Frontend/backend builds passed; frontend lint has no errors (existing factory warnings remain).
# Current correction — original tapered silhouette restored

2026-11-04: user rejected the two later generated camera-standard canvases and explicitly requested applying the original shape directly. The near end must remain wider than the far end, as in the approved source. `CrawlGateView` now draws the entire approved texture once, with one uniform scale; no end/middle slicing or independent stretching. The existing live `ObstacleArt` uses the same original texture and registration. All mandatory gates still meet both banks and accept Shift-only traversal. Earlier report sections are superseded wherever they mention sliced timber or a new oblique painting.

