# Duck Race implementation design

The supplied duckee and DuckyV2 pixel-art frames are the character authority. Preserve complete frames and registration; do not synthesize articulated limbs or substitute emoji. One padded atlas supplies 64 original animation clips. Dirt-track geometry and grass verges share one surveyed centreline with server collision projection.

Interface tokens are locally scoped to `.dq-shell`: background `#102e30`, panel `#173b3b`, cream text `#fff5d6`, muted text `#b2cbc1`, yellow action `#ffdc65`. Questions and join form use warm cream surfaces and dark green text. The local Public UI face supports Vietnamese diacritics; scores/timers use lining tabular figures. Headings explicitly reset the factory game's inherited text shadow.

Desktop host: large chase-camera viewport with compact ten-row leaderboard at the right; full-height race fits a 1440×900 screen. Player: own-camera view and a right-side question/control console. Below 768px, stack camera, wallet, D-pad/actions, question and optional roll/card inventory. Long names ellipsize in rosters/rankings while the full value remains in the title attribute. Normal page scrolling remains available for long question/answer content.

GSAP `quickTo` controls each canvas-local FollowCamera. Follow the interpolated duck position, not raw packet jumps; use a shorter settling time during paid rolls. The avatar's original jump/crouch/roll/hit/attack clips communicate game state. Ground shadow stays on the dirt during jumps. Reduced-motion preference stops sprite cycling and camera easing without changing server rules.

Evidence: `design-preview/duck-race-v1/qa.json`, screenshots at 390/768/1440, and `redis-qa.json`. Mechanical design detector returned no findings for the new React page and scoped stylesheet. This is local verification, not a hardware 60FPS certification.


Horizontal-map revision: the road is now a straight 40,000px world, with continuous 520px playable breadth. Permanent seeded obstacles exist from the start along the whole course and never expire; sprites are instantiated 250px outside the viewport before reaching it, and culled behind the camera without removing server collisions. Only environment dust events use the 30-second spawn / 10-second lifetime. Fourteen authored SVG assets supply tiled ground, obstacles, labels and UI frames; original duck sprite animations remain unchanged. UI CSS arranges artwork and accessible focus/answer states. Browser evidence for this revision is design-preview/duck-race-horizontal-v2. New rooms are required; Redis room namespace advanced to v2 to avoid restoring incompatible geometry.


Painted-frame revision: replaced the flat vector UI frames with three exclusive built-in AI generations in assets/duck-race/painted-frames-v2. Raster artwork is embedded in SVG and nine-sliced like the factory game, with separately generated walnut/brass/duck-foot motifs. Button image states are derived locally. Factory assets are reference-only and unmodified. New browser evidence: design-preview/duck-race-painted-v3.

## Lettering and motion correction v5
Logo and hero are original built-in AI illustrated lettering (one attempt each), delivered as transparent WebP embedded in SVG. They replace the rejected font-outline lockups. Fixed body labels remain accessible vector outlines. The forest/cream material textures are separate original AI artwork beneath existing carved frames.

All duck bodies now render at actual continuous coordinates: no 100px packing or hidden representatives. Local intent prediction is reconciled without reversing held movement; remote positions use ordered interpolation. Old HTTP/socket revisions cannot overwrite newer state. Physics ticks at 50ms, broadcasts at 100ms. Jump animation uses takeoff, air, descent and landing; its clock advances per render frame. Native feet register at y=48. Ducky uses native crawl; Duckee crawl is a documented whole-frame low-posture adaptation of its native walk, with no articulated limb assembly. Purple jump is extracted from the source GIF (the supplied PNG directory contained a GIF). Held crouch has a small whole-sprite breathing motion in Pixi, not CSS.

No jump/roll/attack cooldown and no global action-busy lock. Airborne jump presses buffer one hop for landing, without rewinding the arc or raising an error. Victim immunity and authoritative balance/answer validation still apply. Evidence: design-preview/duck-race-motion-v5, including frame-by-frame motion.json.

## Player identification and focus v6
Host canvas shows every name; player canvas suppresses all nameplates, keeps the player name in the top HUD and attaches one red/gold animated SVG marker above the controlled duck. Motion is Pixi ticker driven and respects reduced motion. Portrait thumbnails use cropped native idle frames against parchment surfaces, with cream names on framed roster cards and separate light portrait backdrops. Input focus has no rectangular outer outline: a pointer-transparent Pixi canvas draws an animated gold feather and drifting sparks. A static SVG fallback covers renderer failure. Evidence: design-preview/duck-race-ui-v6, twenty browser checks with fifty players at 390/768/1440px.
