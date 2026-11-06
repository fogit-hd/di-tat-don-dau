# Production lazy-route CSS repair — 2026-11-06

## Failure and cause

The deployed `/duck-race` rendered its JavaScript but loaded only the root stylesheet. Its logo appeared at its natural large size and controls had browser-default styling. The deployed entry bundle used a computed dynamic import for DuckExperience, hiding the chunk relationship from Vite's CSS preloader.

The build-time obfuscator runs in `renderChunk`, before Vite completes its lazy CSS dependency processing. Moving an import path into the obfuscator's string table leaves a valid JavaScript import but prevents the corresponding CSS dependency from being discovered. The affected route can vary with chunk contents. The previous local build reproduced this on `/duck-race/preview/phaser`: its main element was about 7,737px tall and its route CSS was absent.

## Change

`frontend/vite.config.ts` now enables `ignoreImports`, reserves JavaScript/CSS module-path strings, and checks that literal dynamic imports remain literal after obfuscation. A future regression fails the build with the chunk and missing import path. Moderate obfuscation remains enabled; no application styles, assets, handlers, backend or authentication were changed.

## Verification performed

- `npm run build -w frontend`: passed (existing large-chunk warnings).
- `npm run lint -w frontend`: exit 0; existing React warnings remain.
- Inspected built entry: DuckExperience and PhaserPreview import paths remain literal, with their CSS in Vite preload dependencies.
- Served actual `frontend/dist` using Vite preview on port 4546, rather than relying on the dev server.
- Browser verified DuckExperience CSS loads and desktop logo is 180 × 65px.
- Visually checked landing at 1440 × 900, 768 × 1024 and 390 × 844. No horizontal or vertical page overflow at those sizes.
- Navigated from Duck Race through the game selector to the factory landing: StartScreen stylesheet loads.
- Opened `/duck-race/preview/phaser` directly: its stylesheet loads and main layout is 1440 × 900, replacing the previously broken layout.

## Deployment boundary

This is a source/build repair, not a deployment. Rebuild and deploy the frontend from this revision. Restarting the old deployed artifact does not repair its imports. Backend redeployment is not required for this fix. Live production after redeployment and authenticated room flows were not verified in this check.
