# Approved lobby implementation

2026-10-28. Implements the approved v4 full-body player lobby and identity drawer, the v3 50-CEO host lobby and painted timing controls. The approval-only documents remain as historical design records.

## Screens and behavior

- Player lobby: one full-body personal character, one personal name and one room code in the header. Other CEOs appear in a searchable roster. Pagination is based on the real participant count; the player’s own portrait is not repeated in that roster.
- Identity drawer: overlays from the right, dims the unchanged lobby, traps focus and makes the background inert. Complete character preview and complete outfit thumbnails reuse the existing four bodies, six skin tones and six outfits. Mobile uses three tabs. Save uses the existing authenticated avatar endpoint; failure keeps the draft, retry is possible, and closing without saving discards the draft. Right arrow, backdrop and Escape close it; focus returns to the trigger. Starting the room unmounts it and restores scrolling/inert state.
- Host: all 50 CEO cells visible at desktop sizes from 1280 × 700; smaller screens paginate. Search, connected/disconnected state and full-name reveal use actual data. A compact low-height layout prevents the QR/copy column or roster from crossing into the footer. Saved room settings remain read-only; Start retains its existing POST and never resends settings.
- Painted timing buttons: 16 distinct 88 × 88 SVG drawings, eight per direction, rendered to Canvas at a 44px hit target. Hover and press replay the drawings; no CSS animation, CSS transform or dependency drives these controls. Numeric keyboard entry, bounds and existing setting callbacks remain available.
- Runtime capacity is 50, bounded by available themes. A lazy unused-theme fallback avoids a false “no themes left” after repeated random collisions. No database schema or seed change is required.
- Wiki current-rules notes include the lobby, identity saving and controls.

## Motion inventory

New lobby motion uses the Web Animations API; the up/down drawings use requestAnimationFrame/Canvas. The character is still a complete static image with a whole-image transition, not a new articulated model.

1. Personal panel entrance; roster panel entrance with a short offset.
2. Host invite and roster panel entrances.
3. Staggered CEO arrivals; departure ghosts fade/shrink without taking layout space.
4. FLIP movement when cells change position; a brief connected/disconnected background response.
5. Page/search changes use roster enter/exit motion.
6. Action and roster button hover, press and release.
7. Right drawer entrance and exit, with independent scrim fade.
8. Body, outfit and skin selection feedback; complete-character crossfade with fixed stage geometry.
9. Mobile customization-panel entrance on tab change.
10. Save-success stage response; save-error short shake; copy confirmation entrance.
11. Countdown-stage entrance and each numeral’s short scale/rotation entrance.
12. Separate painted hover, pressed and release control frames.

No perpetual ambient animation was added. Reduced-motion and hidden-document paths remove the new lobby motion. Pending image loads cannot overwrite a newer choice; animation cleanup and a WeakMap prevent stacked button animations from accumulating.

## Main files

- `frontend/src/components/CeoLobby.tsx`, `HostLobby.tsx`, `LobbyParts.tsx`, `IdentityDrawer.tsx`, `lobby-v4.css`.
- `frontend/src/lib/lobby-motion.ts`; `CeoAvatar.tsx` adds an optional public-lettering path while gameplay keeps its existing default.
- `PaintedStepper.tsx`, `painted-stepper.css`, `SessionUI.tsx`, `SessionEntry.tsx`.
- `frontend/public/assets/session-v2/painted-stepper/*` and the reproducible dev generator `scripts/generate-painted-stepper.cjs`.
- `backend/src/runtime.ts`, `backend/src/game/catalog.ts` and their regression tests.
- `WikiUpdates.tsx`; `scripts/lobby-v4.qa.cjs` and updated existing session-flow regression selectors.

## Verification

- Backend suite: 186 passed, one database integration skipped. Includes 50 parallel runtime joins, unique tokens, independent avatars, rejecting CEO 51, starting all 50 and assigning distinct themes. Database access is mocked in runtime tests.
- Browser checks use the production bundle in Chromium with local HTTP/Socket.IO fixtures, not a production service. Screenshots/reports: `design-preview/lobby-settings-v4/verification/` and `design-preview/session-flow-v1/verification-lobby-v4/`.
- Session-flow regression passed at 390, 768, 1366 and 1440px: decimal capital/settings POST, no post-create settings PATCH, QR/copy, empty-room guard and question-result flows.
- The lobby-specific browser script exercises full-body containment, 50-cell geometry, long names, search, connection changes, joins/removals, drawer open/close, unchanged background geometry, focus restoration, draft/save/error/retry, reduced motion, countdown interruption and real pixel changes in painted control frames.
- Final lobby run passed at 360 × 800, 390 × 844, 768 × 1024, 1280 × 700, 1366 × 768 and 1440 × 900. No page errors, missing local assets or horizontal overflow. All 50 cells and their controls fit the desktop host; the invite action stays inside its frame. Screenshots were inspected directly, including the compact 700px layout and mobile controls.
- Final frontend production build, frontend lint and backend TypeScript build pass. Lint reports existing warnings outside the new lobby files; the production bundler retains its existing large-chunk warning.
- No dependencies installed, production data changed or deployment performed. Real Google login, live database integration and a 50-browser production load test are not verified here. Existing build chunk-size and unrelated lint warnings remain.
