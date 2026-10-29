# Human-handled harbour shipment

Replaces the v2 belt/forklift source after the user rejected cargo appearing without a visible human source. The landing replay and hero sizing change in this round. The hero now reaches both viewport edges with its outer decorative frame removed; navigation, lettering, forms and gameplay remain intact. Desktop, tablet, portrait phone and landscape phone layouts retain the complete contained artwork.

## Sequence and physical constraints

| Time | Visible cause and effect |
| --- | --- |
| 0–2.1 s | A porter emerges carrying a crate from the open, stocked warehouse. The doorway hides his approach inside; he never fades into view on the quay. |
| 2.1–4.4 s | Both hands support the crate throughout the walk along the paved loading apron. Legs animate in complete painted poses. |
| 4.4–6 s | He bends, places the crate on the ground and raises its sling onto the waiting crane hook. The complete poses contain the held crate until his hands release it. |
| 6–6.6 s | The crate remains on the quay while the worker steps clear. The hoist cannot lift during this pause. |
| 6.6–13 s | Crane raises the load, traverses along its existing jib and lowers it onto the stationary boat. The porter returns empty-handed through the warehouse door. |
| 13–16 s | A separate deckhand reaches the hook, removes the sling and lowers the rope. The crate stays on deck while the empty hook rises. |
| 16–23 s | The loaded boat backs out into the same water channel from which it approached. |
| 23–24 s | The berth is clear. Porter and replacement stock are concealed inside the warehouse before the next cycle. |

The foreground truck has a painted driver and follows the paved road, entering/exiting behind near stock and foliage. Its near-front tyre is the ground anchor; scale increases towards the camera and wheel hubs turn with travel. The road's projected slope matches the tyre contact plane separately in desktop and portrait. It does not cross the quay wall or water. Feet share the painting's ground plane; the porter steps onto the visible low pallet to rig the parcel and down onto the apron on his empty return. Indoor depth reduces apparent scale gradually. Background shoreline pixels are redrawn as a foreground occluder. Boat cabins can extend above the water surface; the lowest 7.5% of the hull is submerged with contact ripples instead of exposing a dry keel floating above the sea.

## Art and implementation

- Built-in ImageGen produced four complete-body, eight-pose atlases: carrying, placing/rigging, empty return and deckhand release. It also edited the existing desktop/portrait backplates to open a stocked warehouse bay. Source image IDs are recorded in `frontend/public/assets/living-hero-v3/porter.json`.
- `scripts/pack-porters.py` packs full poses into padded 576px cells, registers feet/hips and encodes local WebP. Every pose must have a clear alpha gutter on all four sides, including the extended receiving hand. It does not assemble body parts. Only already-disconnected **whole** actor and parcel components are separated in release poses. The final parcel is reused at exactly the same scale on the ground, cable and boat.
- `frontend/src/lib/living-hero.ts` renders the shared timeline in Canvas2D, with separate measured desktop/portrait paths, hand-contact anchors, concealed reset and depth ordering. Character motion does not use CSS transforms or a limb rig.
- `LivingHeroScene.tsx` waits for all seven critical actor/prop assets before starting the clock. Pause, reduced motion, offscreen/hidden-tab and modal suspension are retained.
- Existing empty boat, water, smoke and cropped metal hook are reused. The truck is a new ImageGen edit retaining its design and adding a seated driver. Old v1/v2 assets remain on disk as prior design iterations but the belt/forklift are no longer requested or rendered.

This is a painted pose-atlas animation, **not generated video**. Agent Sprite Forge was consulted in the earlier iteration; its external image-to-video pipeline was not run and no API/dependency was added.

## Verification

`verification/` contains samples from the actual renderer at 19 timestamps in each layout, contact sheets, production-page viewport screenshots and JSON assertions. Numeric checks cover continuous crane handovers, lift only after the hands-clear pause, a moored boat throughout loading/unhooking, vertical cable attachment, receiving hand/hook contact, release before departure and pixel-identical 0/24-second frames. Visual inspection additionally covers the warehouse source, full-body gait, ground contact, set-down/rigging and release sequence; endpoint equality alone is not a physical-logic check.

`scripts/living-hero.qa.cjs` checks 360×800, 390×844, 768×1024, 844×390, 1440×900 and 1920×1080: document overflow, visible controls, join validation, pause/resume, reduced motion, modal/offscreen/hidden suspension and missing assets. Headless hidden-tab coverage uses a simulated `document.hidden` where the browser cannot expose native tab visibility.

`replay-desktop.webm` is a 26-second recording of the production component. The final full-bleed page was also opened and visually checked in the user's in-app browser after restarting the local preview server. Local read-only preview: http://127.0.0.1:4523/ . No production deployment or physical-device performance test.
