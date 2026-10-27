# Room connection screen: typography and layout

Applies only to `RoomLoading` (player/host loading and connection errors). Gameplay typography and backend/network behavior are unchanged.

- Replaced legacy Georgia letter outlines with the Vietnamese-complete `PublicArtText` table already used by the public pages. Room codes use lining digits. Shared the local font-face declaration through `public-font.css` without applying its family to gameplay.
- Added `room-loading.css`: centered card capped at 520px, restrained heading with a deliberate balanced two-line error title, consistent spacing, 44px+ action targets and equally sized buttons. Removed the empty header columns from this screen's layout.
- Narrow phones stack actions below 360px. Short landscape screens use a 660px two-column card with a compact 56px header so the entire error and both actions fit.
- Existing retry reload, home route, room code, error strings and loading behavior are preserved.

Validation:

- Frontend production build and lint passed; existing lint/chunk-size warnings remain.
- `scripts/room-loading.qa.cjs`: 20 production-bundle browser states at 320×740, 390×844, 768×1024, 1440×900 and 844×390. Checked player/host loading, missing room, long errors, centered bounded card, complete viewport fit, horizontal overflow, equal action sizes, keyboard focus, retry reload and home navigation. Screenshots/report in `design-preview/session-review-v2/verification-room-loading/`.
- Legacy SVG lettering coverage check passed. Public Wiki regression rerun after moving the font-face declaration.
- Compared the supplied screenshot with desktop/mobile/landscape captures visually.

The in-app browser could not open localhost (`ERR_CONNECTION_TIMED_OUT`). Browser QA used Chromium serving the built files and socket fixtures locally through Playwright. Real backend connectivity, deployed site, Firefox/Safari and physical devices were not tested. No deployment performed.
