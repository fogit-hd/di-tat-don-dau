# Session UI implementation — 27/10/2026

> Cập nhật: người dùng đã chốt và yêu cầu code. Đã triển khai; xem `docs/approved-session-v2.md` để biết trạng thái và báo cáo kiểm chứng cuối. Phần mô tả bên dưới giữ làm hồ sơ thiết kế.

Current user authorization: implement already-reviewed canvases and prepare previews for surfaces without a canvas. Player terminology is CEO; company names are assigned, not entered again. Do not change economic rules or implement the separate 10-minute shared-round proposal as part of UI work.

## Approved references being implemented

- `design-preview/session-flow-v1/01-player-results.png`: player final/early summary, overview/cash/events tabs, compact ranking, frozen value versus provisional rank.
- `02-host-results.png`: host summary, only one active tab, compact industry/value/result rows.
- `03-host-questions.png`: paginated question statistics, expand full real prompt, denominator is answer attempts.
- `04-create-room.png`: Google-authenticated create form, duration/capital and advanced cycle/lock fields; no global investment prices.
- `05-host-lobby.png`: real code/QR/link, CEO list, compact settings disclosure, Start.

Existing reference numbers and names are illustrative. Update all player-facing Đội labels to CEO and retain real API data, handlers/auth, room settings and routes. Keep the current 15-minute/60-second defaults until timing rules are separately authorized.

## Approved and implemented avatar/session canvases

The user approved canvases 09–15, including responsive long CEO names. These surfaces are implemented:

- `09-ceo-join.png`: enter code and CEO name.
- `10-ceo-avatar-lobby.png`: customize a static 2D character in the waiting lobby (proposed four body presets, six skin swatches, six outfit styles); room roster uses each CEO's saved avatar.
- `11-session-countdown.png`: three-second shared entry.
- `12-assigned-business-v2.png`: actual random industry/region/scale/starting stats, no second name entry.
- `13-host-live-podium.png`: live top three, separate rank-four-and-below table, selected CEO's real business scene.
- `14-host-results-podium.png`: final top three podium above rank-four-and-below table.
- `15-player-results-avatar.png`: personal result, chosen avatar, actual ending, top-three podium and table from rank four.

The newer avatar/podium request supersedes overview layout in references 01 and 02. The approved avatar picker, authenticated lobby-only save endpoint and podium layouts are implemented. Illustrative numbers are not rules. The waiting-lobby preview's header means joined as a CEO; players do not need Google login. Do not invent industries, ready states, financial histories or metrics not available in the actual snapshot.

The implementation stores only allowlisted avatar option IDs on the room's existing CEO record, not image data. Preserve identity through reconnects, host snapshots, and saved reports; the lobby, live rankings and final result must resolve the same config. Appearance must not affect economic state. Podiums support one/two CEOs without fictitious vacant winners. The table excludes the displayed top three and keeps actual backend rank order.

## Implemented approved surfaces

- `CreateRoomPanel` and `SessionSettings`: office art, own gold SVG frame, existing Google-authenticated create handler and settings constraints. Removed all global investment-price fields from the host interface; defaults remain 15 minutes / 60 seconds until game timing is separately approved.
- `HostLobby`: real room code/QR/coherent join URL, clipboard fallback, connected CEO roster, existing settings PATCH followed by start POST, empty-room start guard. The roster uses each CEO’s actual saved avatar.
- `HostQuestionStats`: four actual prompts per page, expandable full prompt, attempted-answer percentage, safe zero denominator. It replaces the old unbounded list; the final-results layout uses the approved podium design.

Verification script: `scripts/session-flow.qa.cjs` serves the production bundle and all media locally through Playwright route fulfillment, with mocked Google-session/API/socket responses. No real OAuth or deployment is exercised. It captures 390/768/1440 widths and tests original payloads, host token storage, empty-room guard, live connection flags, long names, QR generation, clipboard, question expansion and pagination.

Final result: `verification-final/report.json` passes all three widths with zero JS errors, zero missing media and no horizontal overflow. Create-dialog Escape/focus restoration and the logged-out Google-login gate pass. Production build passes (existing large-chunk advisory); lint exits zero with existing React/ref/effect warnings. The create/lobby/question screenshots were inspected against refs 04/05/03 for panel order, paper/wine colors, readable lettering, code/QR/CTA placement and question row anatomy. QR, player names and values are real runtime data rather than baked into the art. Differences retained deliberately: CEO terminology, current 15-minute default, no unimplemented ten-minute recommendation or hamburger. Playwright Chromium was used because the in-app localhost browser was unreliable earlier in this task; real Google, real Render deployment and physical iOS were not verified.

## Prior task (advisor) status

Implemented: separate dialogue SVG/tail/background, enlarged text, lower-left placement, skippable HUD introductions, required actual tabs/purchases/year action, own attention SVG, CEO terms, no second company-name field, per-CEO data-based narration, 9 aiming directions with whole-character motion. Backend 137 tests pass, 1 DB integration skipped. Final production advisor QA passed at 360/390/768/844/1440 in `verification-ceo-final/report.json`: no runtime errors or missing media, no horizontal overflow, no target covered by the bubble, actual prices and random crew, three-second speech pause, global clock uninterrupted, real required purchases/tabs/year action, second-year timer begins only on tutorial completion. Screenshots inspected at 844 and 1440. Asset-failure fallback was also verified separately.

## Production art

Built-in Image Gen: office background, harbor background, victory illustration, three-rank medal atlas, CEO avatar, question-book illustration. Inspected source art is copied to `frontend/public/assets/session-v1/` as WebP; runtime has no paths into Codex's generated-image folder. `frame.svg` is a dedicated native nine-slice asset and does not reuse the gameplay frame. Prompts/source paths are recorded in `assets-provenance.json`. No new dependencies.


## Final avatar decision and verification

The user rejected the experimental modular animated avatar and chose the original whole painted character. The production renderer now uses complete WebP figures, with no rig or CSS character animation. Four bodies × six skin choices × six outfits give 144 characters, each with body and portrait (288 files). Full bodies use a common 400×640 canvas and foot baseline. Runtime assets live in `frontend/public/assets/avatars/v1/`; source records and crop manifest are in `design-preview/avatar-v1/`. The rejected rig is archived in `design-preview/avatar-model-v2-archive/` and is not imported.

Avatar IDs are authenticated and allowlisted, stored by participant ID in room metadata, restored on reconnect and included in reports. Metadata-only saves cannot change economic state. Storage failures roll back appearance. Backend build passed; tests: 140 passed, one database integration skipped. Frontend build and lint pass, with existing warnings.

Final painted-avatar browser QA: `verification-painted-avatar-final/report.json`. Creation/lobby/questions regression: `verification-painted-regression/report.json`. First-year guide regression: `../mascot-guide-v3/verification-session-regression/report.json`. Refer to these reports for actual widths and completion. These tests use the local production bundle with mocked API/socket/session data. The in-app localhost browser timed out, so screenshots use bundled Playwright Chromium. Actual Google OAuth, Render deployment and physical iOS devices are not verified. No new dependency or economic rule change was added.
