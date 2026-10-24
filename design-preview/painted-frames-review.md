# Model-generated responsive gameplay frames

## What is actually delivered

Three different frame artworks were generated with Codex's built-in `image_gen`, one call per asset:

| Asset | Use | Intrinsic size | Nine-slice cut | Rendered corner size |
| --- | --- | --- | --- | --- |
| `panel.svg` / `panel.png` | HUD, factory, workspace, event overview, year dock | 768×768 | 112 | 20px desktop / 16px compact |
| `inset.svg` / `inset.png` | Paper panels, investment cards, result cards, stats, event detail, image rims | 768×768 | 80 | 10px desktop / 8px compact; 5–6px small badges |
| `control.svg` / `control.png` | Tabs, count controls, show-all, investment costs, year/finish buttons, mute | 768×768 | 96 | 12px desktop / 10px compact |

Location: `frontend/public/assets/ui/painted-frames-v1/`.

**These SVG files embed the model-generated transparent PNG artwork. They are not vector-traced SVG paths.** The built-in image model does not output vector SVG. The SVG packaging is self-contained and references no external resources; the PNG exports are also retained. This distinction was explained before implementation.

The transparent center is not painted or stretched. CSS `border-image` places nine slices: corners retain equal horizontal/vertical scale, straight edge strips stretch, and the HTML content keeps its layout. One artwork therefore fits different panel widths/heights instead of shipping a fixed-size screenshot for every device.

The CSS radial-gradient corner studs were removed. `painted-frames.css`, loaded after the responsive layout, replaces decorative border colors, outlines and inset shadows with the generated assets. Background fills, accessibility focus indicators, semantic colors and the live perimeter timer remain code-native. The frame artwork is not redrawn in CSS.

## Generation prompts

1. **Panel**: a standalone symmetric square antique-gold border ring, rounded corners, carved curled corner brackets, small spherical gold rivets, warm ivory highlights, dark metal grooves and burgundy lacquer lip. Straight uniform rails for nine-slice, all ornament within the corner cuts, true alpha inside and outside, no text/logo/fill/scene, no neon glow. The approved event canvas was the style reference.
2. **Inset**: a slimmer parchment-card border in the same painted-gold family, fine polished rim, brown groove, delicate curled brass corners and tiny rivets, thin uniform rails, transparent center and outside, no labels or parchment fill. The generated panel frame was the style reference.
3. **Control**: a simpler rounded gold button rim, burnt-orange lower lip and ivory inner bevel, four small curled brackets without large rivet balls, uniform rails and transparent opening/outside, no text/face/halo/debris. The approved event canvas was the style reference.

Full source PNG paths and crop bounds: `painted-frames-manifest.json`. Original generated PNGs are preserved in Codex's generated-images directory. `scripts/prepare-game-frames.py` only crops, normalizes size and exports PNG/SVG; it does not redraw frame details. Public manifest contains dimensions/slices and no private local source paths.

## Verification actually run

- All three SVGs decode at 768×768 in Chromium. PNG center alpha checked as zero during export.
- All 13 responsive viewports from the previous review were rerun: 320×568 through 1600×1000, including phone portrait, 540×720 foldable, 720×540 landscape, 768×1024 tablet and 844×390 landscape.
- Computed styles confirm actual generated SVG `border-image-source` on HUD, workspace, event overview, year dock, paper panel, investment card, selected tab and year button. Their CSS inset frame shadows are `none`.
- Existing checks remain passing: no page overflow, five visible single-line tabs, only workspace vertical scrolling, visible year dock/perimeter, 0/1/7/20 event counts and full-list access, manual detail readability, year-duration/deferred effects, lock/pause behavior, inline traits without focus theft, long company names/large money, finished state, investment/year/restart request payloads, and all 64 industry image mappings.
- Separate mobile/touch Chromium context at 390×844 with deviceScaleFactor 3: passed; saved `painted-frames-retina-phone.png`.
- Frontend build passed. Lint exit 0 with the existing hook/ref/start-screen warnings.
- Direct visual inspection with `view_image`: generated assets, phone, tablet and 320×568 renders. Corner sizes were enlarged after the first render to keep the painted details visible without changing layout geometry.
- Browser/IAB localhost remains unavailable (`net::ERR_CONNECTION_TIMED_OUT` from the preceding responsive review); production-bundle Playwright Chromium with mocked room snapshots was used. This is not a claim of real Safari/iOS hardware testing.

Evidence: `painted-frames-phone.png`, `painted-frames-tablet.png`, `painted-frames-fold.png`, `painted-frames-retina-phone.png`, `painted-frames-verification.json`.

No new app dependencies, secrets, cloud hosting, game-rule or route/handler changes. Nothing deployed, committed or pushed.
