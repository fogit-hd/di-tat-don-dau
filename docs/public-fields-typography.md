# Public Wiki fields and typography

Scope: landing page and Wiki only, per the follow-up “trong game thì ổn, sửa bên ngoài thôi”. Gameplay fonts, legacy SVG lettering, logo images, economics, routes and form handlers are unchanged.

## Changes

- `frontend/src/public-fields.css`: explicit Wiki input/select styling with the existing session-v2 nine-slice paper SVG frames. Includes native select chevrons and focus/error/disabled assets; keeps text entry, IME and keyboard operation native. Loaded explicitly by the public entry screen instead of depending on a session screen's incidental CSS import.
- `frontend/src/components/PublicArtText.tsx`, `frontend/src/lib/public-letter-paths.json`: separate public lettering using a Vietnamese-complete font, normalized to NFC and preserving the existing accessible SVG text pattern. `ArtText.tsx` accepts an optional lettering table; existing callers still receive the original table.
- `StartScreen.tsx` and `WikiPage.tsx`: opt into public lettering. Native public fields use the same local font.
- `frontend/public/assets/fonts/public-ui/DejaVuSans.ttf` and `LICENSE.txt`: locally bundled, unmodified DejaVu Sans and the complete Bitstream/Arev license from its embedded font metadata.
- `scripts/generate-public-letter-paths.ps1`: reproducible Windows-only development generator; no app dependency and no build-time font generation. Rejects fonts missing the 102 precomposed Vietnamese characters. The existing gameplay/legacy generator is unchanged.

## Root causes

- Plain Wiki controls depended on generic rules and CSS loaded through other session components; explicit selectors now apply the approved SVG to all Wiki controls, including mobile navigation, industry choices and event-context choices.
- The old outline generator used Georgia, which lacks 92 of the 102 tested Vietnamese characters. Per-character outlines cannot reliably use a browser's fallback shaping. Mixed native font families further changed accent placement.
- Old-style numeral shapes and proportional numeric metrics produced the uneven appearance. Public outlines now use lining digits with equal advance widths; native public controls request lining/tabular numerals.

## Verification

- `npm run build -w frontend`: passed. Existing large-chunk warning remains.
- `npm run lint -w frontend`: passed with existing warnings.
- `node scripts/check-public-lettering.cjs`: legacy lettering coverage passed.
- `scripts/public-fields.qa.cjs`: Chromium production-bundle QA at 390, 768 and 1440px; all six Wiki sections, selection/filter changes, industry event contexts, decomposed Vietnamese search, normal/focus SVG frames, unchanged focus dimensions and no horizontal overflow. Proof sheets check native number widths and SVG digit baselines. Screenshots/report: `design-preview/public-fields/verification/`.
- `scripts/avatar-sessions.qa.cjs`: regression passed at 390 and 1440px for join/avatar saving, loading/error/retry, live ranking, host awards, personal results, long names and Wiki fields. Report: `design-preview/session-flow-v1/verification-public-font-regression/`.

Browser tests serve the built files through local Playwright request fixtures; they do not verify the deployed website or a real backend. Firefox, Safari and physical devices were not tested. No deployment performed.
