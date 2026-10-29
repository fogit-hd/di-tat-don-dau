# Landing hero — living 2D scene concept

2026-10-29. User requested a new landing hero canvas after removal of the lower sections, with continuously replaying 2D models. The three PNGs below are the approved static design references. **The approved hero is now implemented with separate generated scenery/sprites and Canvas2D motion.** See `implementation.md` for actual choreography, assets, verification and remaining differences from the storyboard. The reference PNGs themselves are not animations.

## Concepts

- `01-desktop-living-hero.png`: complete desktop single-hero landing page. Existing red/gold identity and join form remain; the former small detached illustration becomes an integrated industrial-harbor stage filling the right side and lower foreground. Mountains/clouds fill the upper art area, factory/conveyor/crane establish the middle, truck/workers/produce fill the lower foreground. Light parchment behind the text/form keeps the action legible.
- `02-mobile-living-hero.png`: one approximately 390:844 portrait composition. Compact two-row navbar, exact headline/copy/form first, and a separately composed portrait scene below. The important truck, crane, boat and foreground workers are re-positioned, not obtained by blindly cover-cropping the desktop art. Full text and join action remain above the moving area.
- `03-seamless-loop-storyboard.png`: three scene stages at 0 / 6 / 12 seconds plus closeups for truck, conveyor, hoist and whole-body worker actions. Timing labels and explanations belong to this storyboard only, not the website.

## Preserved page structure and copy

- Only navbar plus hero. No returned how-to/investment/host/footer sections, fake metrics, badges or extra CTA stacks.
- Logo only in the navbar. Center links remain Cách chơi, Sự kiện, Wiki. Tạo phòng remains only in the navbar beside account login/logout.
- The illustrated auth state is logged in, so it shows Đăng xuất. Actual current account state must continue to choose Đăng nhập/Đăng xuất; Tạo phòng still requires the existing Google host-login flow. Players joining by code still do not need host login.
- Hero lettering keeps exactly two lines: `Xây doanh nghiệp.` / `Chốt vận mệnh.`. Existing generated-art title/brand treatment is retained in the concept, rather than substituted with a generic UI font.
- Exact subtitle: `Trở thành CEO, đầu tư, vượt biến cố và đưa doanh nghiệp vươn lên dẫn đầu.`
- Room input `Nhập mã phòng` and `Vào phòng` stay always visible and interactive. Existing validation, loading/error states, keyboard behavior and subsequent CEO-name step remain authoritative. Decorative movement never delays checking/joining.

## Proposed real 2D motion

The goal is actual object/state motion, not panning one flat illustration, adding arrows/particles, or wobbling an unchanged picture.

| Layer/object | Proposed period | Motion |
| --- | --- | --- |
| Scenery and UI | Static | Buildings, perspective, camera, title, subtitle, nav and form do not move or scale. |
| Delivery truck | 12s | Full vehicle travels along a valid paved path; wheels change angle. Start and end are behind real orchard/warehouse foreground occluders, never on the water or popping back in the open. |
| Conveyor | 2s | Rollers/belt move and wooden crates advance through the loading area, entering/exiting behind a doorway. Repeat six complete cycles per master loop. |
| Harbor crane | 12s | Hoist lowers, takes a crate, lifts/transfers it, releases it and returns empty to its start pose. Cable stays taut, hook stays attached, physical pivots stay aligned. |
| Workers | 4s | Complete painted character poses bend, lift/adjust or set a crate, then return to a matching rest pose. Repeat three times per master cycle. Same clothing, head/body size, foot anchor and perspective throughout. |
| Boat/water | 4s / 3s | Small coherent boat bob, reflections/ripples and restrained wake cycle; no sudden position reset or whole-water-image jump. |
| Smoke/cloud/foliage | 3s / 6s | Subtle secondary loops with particles entering and fading naturally; no flashing or attention-seeking storm effect over the input. |

These are proposed choreography periods, not production-tested timing. Scene must feel alive without every moving object peaking at once. No speech, autoplay audio, obligatory interaction, countdown or gameplay state is introduced into the landing page.

## Production route to review after design approval

- Recommended: one dedicated Canvas2D scene with requestAnimationFrame, layered hand-painted scenery, full-object sprites and authored full-character frame sequences. Keep all actual DOM UI above it and independent from animation. This can use existing browser capabilities without an app animation dependency.
- Mechanically moving wheels/crane parts need correct pivots and overlap masks; whole-person animation must use registered complete poses. Do not return to the rejected cut-up humanoid rig with mismatched joints or slightly changing character scale.
- First create/validate production scenery and sprite sequences from the approved art; a generated concept PNG is not itself a ready-to-loop scene. Check every frame’s silhouettes, proportions, object identity, occlusion, endpoints and grounding before applying.
- Reuse an identical registered starting pose at a loop endpoint. Where objects traverse the scene, wrap only while fully occluded. Match position, velocity, lighting and secondary phases; do not hide a broken endpoint with a full-frame dissolve.
- The storyboard’s independently generated 0/12 illustrations contain minor visual differences and are **not** pixel-identical production endpoints. The intended invariant is shown, not proven. A smooth real loop, actual frames/fps and runtime performance remain unverified until the asset/animation pass.
- Use a single scene coordinate system and registered anchors; avoid stretching separate people or giving the truck a different scale across frames. Foreground foliage can naturally occlude feet/road edges, but avoid accidental clipping of elbows/heads and cable seams.
- Preserve reduced-motion/static mode and an unobtrusive pause/play control with an accessible DOM button. Mobile shows its intended lower-right location; add the corresponding control to desktop within a safe artwork corner without overlapping form/nav/character. Pause while hidden/offscreen, resume cleanly rather than speeding up to catch up.
- Initial still artwork must render while any motion assets are loading. Form/nav must work immediately and on an animation failure. Keep the first paint light, limit mobile secondary detail/particles and avoid one huge full-scene GIF for delivery.
- Final desktop viewport fit target is 1440×900 with header+hero visible; mobile target is approximately 390×844. The images show composition, not verified DOM sizes. Respect safe areas and larger accessibility text; do not enforce a global overflow lock that clips real controls or auth dialogs on smaller/shorter screens.

## Visual review

Inspected current StartScreen and its actual asset inventory. Compared supplied current screenshot with concepts for five concrete points: existing wine/gold/parchment palette; exact generated title/brand mood; one navbar-only create action plus adjacent account control; clear unchanged room-code form; and replacing empty parchment margins/small vignette with a coherent full-height scene. Mobile keeps the same content in a portrait scene arrangement. The loop storyboard shows object movement instead of decorative arrows over a still picture.

The three selected images were generated with the built-in ImageGen tool, one generation each, then inspected directly. Prompts and sources are summarized in `prompts.md`. No implementation/build/browser timing verification is claimed in this concept-only task.
