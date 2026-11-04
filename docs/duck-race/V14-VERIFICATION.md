# V14 verification — 2026-11-03

- Frontend production build and TypeScript: passed. Vite reports existing large-chunk warnings.
- Backend TypeScript build: passed.
- Frontend lint: no errors; 11 warnings remain in factory components/realtime code.
- Backend suite: 29 files passed; 242 tests passed, 1 PostgreSQL integration test skipped.
- Import boundary audit: 582 local imports checked, no cross-game imports or shared render-loop instances.
- Duck contract synchronization and Vietnamese outline validation: passed (186 required characters, both weights).
- Asset verification: six distinct painted frames, six depth-facing obstacle props, 80 padded whole-character catcher frames; captured native ducks baked behind foreground rope mesh.
- Native motion verification: 81 frames checked; original `roll_2` source, fixed 64px canvas/ground anchor, transparent gutters and gear frames retained.
- Fixed UI word atlas: 1,093 words exported, no missing glyphs. Browser gameplay had zero `data-art-missing` fallbacks.
- Browser checks: actual game DOM at 1440×900, 768×900 and 390×844; no horizontal overflow. Small-screen captures use a same-origin iframe at the stated dimensions; only unused browser background was cropped.
- Browser capture scenario: moving into the catcher stopped the local turn, froze 500 points and kept the room timer/other racers active. Screenshot: `design-preview/duck-race-v14/capture-browser.jpg`.
- Shared navbar and the local Google-login error/retry dialog were visually inspected for both themes.
- Cleanup script: preview only. No automatic cleanup, commit or production deploy was performed.

Not verified: real Google account sign-in, live PostgreSQL migration, Render/Docker deployment, 50 physical clients, and mobile GPU/FPS. The local QA room uses a loopback-only fixture; its fake room sessions are not production authentication.
