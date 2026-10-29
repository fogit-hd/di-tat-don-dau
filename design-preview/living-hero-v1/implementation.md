# Living hero implementation — 2026-10-29

Approved references: `01-desktop-living-hero.png`, `02-mobile-living-hero.png`, `03-seamless-loop-storyboard.png`. Existing logo/title lettering, paper/wine textures, frame family, Vietnamese copy, routes and authentication/join handlers are preserved. Only the home hero changes; gameplay and Wiki content are unchanged.

## Production assets and animation

- Built-in ImageGen produced clean desktop and portrait factory/harbor backplates, a complete paired-worker pose atlas, truck, boat, hoist with crate, and chimney smoke. The mixed props atlas was rejected for vehicles/hoist because objects crossed cell boundaries; only its separate crate and water cells are used. Replacements are individually generated transparent assets.
- Final local runtime assets: `frontend/public/assets/living-hero-v1/` (nine WebPs, about 2.4 MB including both backplates). Each viewport loads its matching backplate, plus shared sprites; the other backplate is fetched only after a matching layout change. `manifest.json` records natural dimensions, bytes and ImageGen source IDs. No Cloudinary or API credential is involved.
- `scripts/prepare-living-hero.py` only encodes/resizes props, packs whole-character poses with one scale and a common foot baseline, and exports metadata. It does not assemble body parts. Pillow is an existing local development tool, not an app dependency. Original generated art remains untouched.
- `LivingHeroScene.tsx`: Canvas2D/requestAnimationFrame, one active-time clock; 30 FPS desktop / 24 FPS portrait draw cap and DPR capped at 1.5. DOM navigation, lettering and join form remain stationary and independently usable. Generated WebPs are sprites/backgrounds, not a full-scene GIF or CSS-transformed still.
- Master loop: 12 seconds. Truck travels on the paved foreground road; its painted wheel hubs rotate. Fully outside the viewport at wrap; the orchard hides its entrance. Conveyor parcels loop in the factory opening every 2 seconds. Crane cable remains attached while the crate lifts/lowers. Boat bob/roll repeats every 4 seconds, water flecks and smoke every 3 seconds. Whole-worker bend/lift poses repeat every 2 seconds without per-pose body scaling.
- Canvas uses contain geometry, anchored right on desktop, centered on portrait. Edge fades are applied at the actual painted image bounds, so letterboxing on a short laptop or wider tablet does not produce a hard vertical rectangle. There is no camera pan, scene-wide shake, audio or gameplay timer in the hero.
- A static matching backplate is present while Canvas/assets decode or if Canvas cannot initialize. Optional sprite failures do not block the form. The pause/play button is keyboard accessible; reduced-motion starts paused. Motion pauses offscreen, on `document.hidden`, and while login/create/join-name panels cover the hero. Return resumes active time without fast-forwarding.

## Actual verification

- `npm run build -w frontend`: passed. Existing bundle-size warning remains.
- `npm run lint -w frontend`: exit 0; 12 pre-existing warnings in other/current existing code, no new animation-file warnings.
- `scripts/living-hero.qa.cjs` against the production bundle: passed at 360×800, 390×844, 768×1024, 844×390, 1440×900, 1920×1080. No document overflow, clipped controls, missing assets or page errors. Portrait copy/form precedes the scene. Exact accessible H1 and single navbar create action checked.
- Pixel equality at time 0 and 12 was checked using the actual renderer and loaded sprites; identical. Time 6 differs. Pause freezes canvas pixels and time, resume advances; reduced-motion checked on preference change and fresh page load. Offscreen and modal suspension checked. In headless Chromium, hidden-tab behavior required simulating `document.hidden` and dispatching the real visibilitychange event; native minimized-window behavior on hardware is not claimed.
- `scripts/home-login-wiki.qa.cjs`: passed at five sizes, covering join Enter validation, create/login intent, Google loading/error/retry/cancel, Escape/focus restoration, token persistence and Wiki navigation/current event notes. Google/API are fixtures; no real Google account, room, live DB or deployment was exercised. Its report is `verification/auth-report.json`.
- Browser/IAB initially could not reach the old hung preview on 4521. After starting a separate read-only preview on 4523, IAB successfully showed the page; pause/play was checked there. The new preview serves the local production build and disables game mutations, so it is for visual review only.
- Screenshots captured by Playwright are in `verification/`. Accepted desktop/portrait canvases and final screenshots were inspected directly with `view_image`, including short landscape.

## Fidelity ledger

| Point | Reference / issue observed | Final implementation |
| --- | --- | --- |
| Structure/copy | Single hero; exact two-line lettering, subtitle and join form | Preserved; no added lower sections, badges or marketing copy. Only pause/play accessibility labels are new. |
| Palette/art | Wine/gold nav, pale parchment, painted factory/harbor | Existing textures/lettering/frame reused; new production layers generated in that visual family. No photo, neon or generic vector substitute. |
| Desktop density | Integrated right-side factory and lower foreground, not a small vignette with blank margins | Backplate occupies the hero; truck, workers, crane and boat share registered scene coordinates. |
| Mobile order | Title → subtitle → room form → portrait scene | A first screenshot revealed reversed flex order; corrected and asserted. Portrait backplate is separately composed, not cover-cropped. |
| Image edges | No detached rectangular art panel | IAB at 1280×720 exposed a hard left edge from contain letterboxing; image-bounds alpha fades removed it. Wider tablets intentionally retain surrounding paper so the entire portrait scene stays visible. |
| Motion | Objects actually move, UI does not | Complete-body pose frames, moving parcels, truck/wheels, hoist/cable, boat and smoke; tested exact loop endpoints. |
| Interaction | Navbar-only create + account; permanent join form | Existing handlers untouched; regression tests cover validation, auth intent and keyboard focus. |

Intentional production differences from the illustrative storyboard: the crane keeps its load attached through a lift/lower cycle, rather than detaching/re-picking a crate (the generated hoist is one mechanically coherent sprite). Workers use a 2-second whole-pose cycle instead of the storyboard's proposed 4 seconds. The factory/crane do not shift camera or transfer location. Assets are redrawn production art, not pixel-identical crops of the concept. No claim of real-device performance profiling, real Google OAuth completion or live deployment.

## Reproduce

Build frontend, then `node scripts/living-hero-preview.cjs` → `http://127.0.0.1:4523/` (read-only local preview; Google/room mutations unavailable). The regular app server remains the authoritative gameplay/auth environment.

Browser QA uses installed Playwright via `PLAYWRIGHT_MODULE` and `PLAYWRIGHT_EXECUTABLE_PATH`; no dependency installation. The production-asset packer accepts the original ImageGen source folder as its argument. Source prompts are recorded in `production-prompts.md`.
