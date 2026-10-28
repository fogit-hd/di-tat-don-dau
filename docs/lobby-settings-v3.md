# Room setup fixes and lobby canvases for approval

2026-10-28. Scope is split according to the user's explicit request to approve the new lobby designs before implementation.

## Applied now

- CreateRoomPanel uses the repaired PublicArtText SVG glyphs for its title, labels, copy and actions. Native fields use the corresponding local Public UI font with lining/tabular numerals. Gameplay lettering is untouched.
- Duration is manually typed in whole minutes, 1–45, without a select. Capital is manually typed in billions with one decimal digit, 2–100. Both `2,5` and `2.5` convert to **2500 internal million units**, rather than rounding to 2 or 3 billion. Invalid precision/range blocks native form submission. Native fields retain the existing SVG field borders.
- Open/Close actions have identical fixed height and stay side by side on mobile as well as desktop.
- HostScreen starts the room directly, without its former settings PATCH. Removed duplicated editable local settings state and the lobby settings form. Existing lobby now displays all four saved settings as read-only facts. This fixes the duplicate-setup/overwrite path independently of the proposed new lobby layout.
- updateRoom authenticates the host first, then returns 409 for any post-create mutation of duration, capital, cycle, button-lock time or line prices. Host-name editing remains supported. Runtime regression verifies unchanged settings and decimal capital. Create API routes and money units are unchanged.
- Wiki current-rules notes explain manual amounts and fixed session configuration.

Changed/new code: `frontend/src/components/{CreateRoomPanel,SessionUI,HostScreen,HostLobby,WikiUpdates}.tsx`, `frontend/src/components/create-room-fields.css`, `frontend/src/lib/room-settings.ts`, `backend/src/runtime.ts`, `backend/src/runtime-purchases.test.ts`.

## Approval-only designs — not implemented yet

All three images were generated with the built-in ImageGen tool, one attempt each. They are saved in `design-preview/lobby-settings-v3/`. No production frame, avatar image or button asset was replaced by these canvases.

1. **host-50-ceos.png** — compact invite/QR column; 10×5 roster grid with all 50 CEOs visible at desktop size, search, connection dots, long names limited to two lines with full-name reveal on hover/focus/tap. Four locked room facts and Start action. Names, QR and counts in this raster are illustrative. The generated legend says “sẵn sàng”; implementation should use the existing **connected/disconnected** states, not invent a readiness system. Sequence numbers will derive from real data, not the raster's imperfect numbering.
2. **ceo-identity-drawer.png** — small identity row with “Thay đổi nhận diện”, normal lobby roster and room facts. Editor appears as a right overlay with scrim, preserving background geometry. Right-arrow closes it back to the right; backdrop/Escape also close; focus returns to trigger. Preview/skin/body/outfit selection and explicit Save reuse current saved avatar behavior. The sample room code appearing as a person's name in the generated concept is illustrative; actual CEO name is used. No replacement character rig or avatar model is proposed.
3. **create-and-painted-steppers.png** — proposed separately painted up/down buttons replacing native advanced-field spinners. Shows normal, hover and press states; four hover-highlight frames and three press/release frames. This PNG is a storyboard, **not a working animation or production sprite atlas**. After approval, draw/export clean consistent frames, play with JavaScript Canvas/requestAnimationFrame, and retain native accessible button hit areas. No CSS animation/transform will produce button movement. Proposed hover 140–180ms, press 90–120ms plus 120ms release; same outer geometry/no layout shift; reduced-motion uses static state frames. Tap areas at least 44px.

### Responsive implementation plan, pending approval

- Desktop host: fit 50 cells in one view at 1440×900 and larger; compact QR panel and fixed facts/action occupy the remaining area. Never shrink names to unreadable type to meet an arbitrary count.
- Smaller host screens: QR/invite becomes a compact strip or expandable overlay. Use search and pagination when needed rather than forcing 50 tiny unreadable names onto a phone. Exact breakpoints will be verified at 390/768/1366/1440 after approval.
- Player: compact roster with search/pagination, identity editor absent from normal layout. Drawer width up to ~420px desktop and at most viewport minus 12–24px on phones; only drawer contents may scroll if needed, with Save reachable and close always visible. Draft/save/error behavior must survive realtime roster updates; leaving lobby closes drawer.
- Current server join capacity is **24**, not 50 (`joinRoom` and catalog theme-count configuration). Raising capacity and ensuring theme assignment, snapshots, join bursts and 50-name rendering work together is part of the next approved implementation, not claimed complete by a canvas.

### Image generation briefs

- Host: existing harbor/burgundy/parchment/gold system; compact read-only lobby, exactly 10×5 small portrait cells, long-name reveal, invite QR, four saved settings, Start; no podium and no edit form.
- Player: same resting lobby geometry plus dimmed desktop and mobile right overlay drawer; small identity trigger, compact preview/body/skin/outfit choices, right-arrow close and Save.
- Controls: complete manual-entry create form and detailed painted normal/hover/pressed up/down storyboard; one-decimal capital, same-height horizontal Open/Close; distinct internal frame drawings, no CSS or generic arrows pretending to animate the object.

## Verification

- Frontend/backend builds pass. Frontend lint passes with existing warnings (HostScreen's previous effect warning was removed with duplicated settings state).
- Backend: **184 passed, 1 database integration skipped**.
- Production-bundle Playwright regression at **390, 768, 1366, 1440px**: zero selects in create, manual 10 minutes + 2,5 billion, invalid 2,55 and 1,9 rejected, decimal point accepted, same-height/horizontal actions, proper stored host session forwarding, POST body with 2500 capital, only Start POST after creation (no PATCH), lobby has no editable settings. No missing local assets, page errors or horizontal overflow. Expanded create form fits the tested 1366×768 laptop.
- Report/screenshots: `design-preview/session-flow-v1/verification-manual-locked/`.
- Canvas images inspected directly against supplied references; review separates them from screenshots of implemented fixes. New lobby/drawer/painted-button animations and 50-player capacity await user approval. API/socket/Google authentication in browser tests is mocked; no live database, Google account login, deployment or 50-player concurrency test was run.
