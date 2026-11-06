# Revised V3 review — 2026-11-06

Status: **pending visual approval; no live-room activation**. User rejected stationary-feeling ducks, foreground houses and architecture demolition/growth, then requested four scrolling scenes per era and separate smoke.

The revised artifact is `design-preview/duck-race-eras-v3/`; open `http://127.0.0.1:4541/duck-race-eras-v3/`. Its `review.md` contains the exact presentation proposal, provenance, tests and limitations. This supersedes the movement/scenery description in `ERAS-V3-REVIEW.md` only for the isolated review.

Changes:

- `motion-v4.mjs` and its tests: common cruise for visible running without point mutation, score offset ×3.2, 1.45–2.8s surges, velocity-continuous retargeting, damped camera.
- `scenery-scroll-v4.mjs`: four paintings per era, distance-based repeating sequence, alpha overlap, same-phase era crossfade and separate pooled painted smoke/dust.
- `review.mjs`, `index.html`, `review.css`, `rules.mjs`: connect presentation to existing V3 review rules, compact review controls, foreground chest dock; no production route, transport or server mutation.
- `scroll-sources-v4.json`, `assets/scroll-v4/`, public Duck-local `assets/duck-race/scroll-v4/`: 24 panorama images plus corrected transparent smoke atlas and manifest.
- `backgrounds.html`, `scripts/prepare-duck-scroll-gallery.py`, `scripts/package-duck-scroll-v4.py`: review gallery and repeatable crop/package scripts. No new dependency.

Checks actually run: 11 Node tests, module syntax checks, 24 unique panorama hashes, smoke alpha checks, browser score surge, a complete four-scene loop, manual six-era transitions and viewport checks at 390/768/1280/1440px. No browser errors observed. App build/lint, server-authoritative multiplayer behaviour, real mobile hardware and a 12-minute concurrency/performance run remain unverified. The completed sitting/reading clip is still pending; this revision intentionally shows running during questions to demonstrate motion.

No approval is inferred from completion of this review. Existing live rooms and the factory game remain untouched. The earlier chest video predates the revised motion/scenery.
