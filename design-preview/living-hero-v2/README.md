# Harbor delivery replay — 29 October 2026

Replaces the independent truck, conveyor, crane and squatting-worker loops in v1. Existing page composition, lettering, frames, background paintings, form handlers and account flow are preserved.

## One physical shipment

| Seconds | Action |
| --- | --- |
| 0–2.4 | One crate emerges from the factory opening along the belt onto the waiting raised forks. |
| 2.4–3.1 | Collection pause, with the crate supported on the forks. |
| 3.1–6.4 | Forklift carries it along the upper paved quay to the crane pickup point. |
| 6.4–7.4 | Vehicle stops; empty crane hook approaches the load. |
| 7.4–9.4 | Crane takes custody and raises the crate clear of the quay. |
| 9.4–11.4 | Trolley travels along the existing jib; the hoist cable stays vertical. The empty forklift returns. |
| 11.4–13.8 | Crane lowers the crate onto the moored boat's clear cargo deck. |
| 13.8–16 | Crate stays on deck; empty hook retracts. |
| 16–22.6 | Bow-left workboat backs out of the loading berth into the harbour at right. It entered forward from that same channel. |
| 22.6–24 | Berth clears; empty hook/forklift are ready for the next shipment. |

The truck is parked on the foreground paved bay. There is no route across the sea. The former two-worker bend/lift atlas is no longer requested or rendered: a seated forklift operator accompanies the vehicle. No character body-part rigging or CSS motion was added.

`frontend/src/lib/living-hero.ts` owns contact points, custody and timing. Desktop and portrait have separate measured anchors. A crate changes owner once at each handover, retaining its image, scale and position. Boat/water rendering uses the harbour's shoreline mask; both ends of the moored boat fit inside the painting. Actors wait for critical assets before the clock starts. Pause, hidden/offscreen suspension, modal suspension, reduced motion and contain geometry remain intact.

## Art route and files

Built-in ImageGen, native transparent alpha; no cloud URL, video API or app dependency.

- `frontend/public/assets/living-hero-v2/forklift.webp`: complete painted vehicle and seated operator, raised empty forks; selected third forklift image after an alpha/background check and an explicit raised-carriage correction.
- `frontend/public/assets/living-hero-v2/boat-empty.webp`: painted clear-deck workboat, rendered mirrored as a whole to face left. One image edit.
- `manifest.json` beside those files records final image source IDs and encoded dimensions. `scripts/pack-harbor-delivery.py` performs alpha-margin packing/WebP encoding only.
- Existing v1 backplates, stationary truck, hoist/crate, water and smoke are reused. The loaded sling and the bare crate are source rectangles of the same painted prop, so the load cannot change shape during transfer.
- `storyboard.png` is the generated four-stage design reference. Production keeps the existing background, and the boat enters forward then backs out from the same real harbour channel; it does not cross hidden land to enter from the left.

Final prompt set: (1) same hand-painted ochre forklift, right-facing side three-quarter view, complete seated navy-uniformed operator, empty forks, native alpha; remove surrounding aura/background, then raise the fork carriage about 46% of vehicle height above ground while keeping wheels/cab fixed; (2) preserve the painted wooden boat, remove all cargo, clear the deck, cabin left/bow right in the asset, native alpha/no water/background; (3) four fixed-camera storyboard states: belt collection, forklift delivery, crane loading, loaded departure. Exact source IDs: `ac23e709-ec26-4772-8642-632c7bbcf16b`, `0b8c07ab-3bcf-417e-9832-9f8679cb99c4`, `32d58d3e-ab35-43f1-a4b2-b53ab76b7cc4`.

Reference consulted: [Agent Sprite Forge](https://github.com/0x0funky/agent-sprite-forge), especially its scene geometry/contact-anchor planning. Its image-to-video character pipeline was **not** run: this environment has built-in image generation, not a native image-to-video tool. No claim of generated character video, installed Forge pipeline or new character motion clips. The replay is an explicit Canvas2D machinery/shipment sequence using generated props.

## Verification

- Builds pass; lint exit 0 (existing warnings documented in the usability report).
- `scripts/harbor-delivery.qa.cjs`: one parcel owner, continuous handovers, fork/load contact, vertical cable/jib attachment, boat moored until release, loaded departure, complete moored vessel in bounds; nine renderer samples in each layout; time 0/24 pixel-identical.
- `scripts/living-hero.qa.cjs`: 360×800, 390×844, 768×1024, 844×390, 1440×900, 1920×1080. No document overflow or clipped controls, no missing assets/page errors, real join Enter validation, pause/resume, modal/offscreen suspension, reduced motion. Headless hidden-tab coverage simulates `document.hidden` and dispatches its real event.
- `scripts/record-harbor-replay.cjs`: `replay-desktop.webm` records 26 seconds of the actual production component at 1440×900. Existing locally installed FFmpeg was used as a temporary test utility, not added to the app.
- `verification/` contains screenshots and JSON reports. No physical-device profiling or production deployment performed.

Local review: `http://127.0.0.1:4523/` (read-only fixture preview, no real Google/room mutations). Refresh the page to load the new bundle.
