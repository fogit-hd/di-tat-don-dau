# V14: independent games, painted frame families and obstacle grammar

## Source ownership

- `frontend/src/games/di-tat-don-dau/` and `backend/src/games/di-tat-don-dau/`: factory game only.
- `frontend/src/games/duck-race/` and `backend/src/games/duck-race/`: Duck Race only; owns its Pixi application, camera, ticker, terrain, character and obstacle assets.
- `frontend/src/shared/`: neutral HTTP client, Socket.io factory, account state, login dialog, navigation and SVG lettering.
- `backend/src/shared/`: Google verification, hashed sessions, identity routes, Prisma, questions and environment loading. No factory-runtime imports.
- `shared/duck-*.ts`: canonical, Duck-specific pure contracts/motor/geometry. The sync script emits deployment-local copies because Render builds each Docker context independently.
- `node scripts/check-game-boundaries.cjs` rejects cross-game source imports and game imports from shared code.

`npm run dev` starts both backend processes and the web hub. `npm run dev:duck` starts the independent Duck backend and its web preview on 4525. Existing public routes and room tokens are retained.

## One account, independent backends

Both backends mount the same `createAuthRouter()`: factory at `/api/auth`, Duck at `/api/duck-race/auth`. Both must use the **same `DATABASE_URL`, `AUTH_SESSION_SECRET` and `GOOGLE_CLIENT_ID`**. No key or credential is stored in source or public assets. Frontend Google client id remains runtime/Vite configuration.

The browser uses the same `host-session` key, native storage events across tabs and an in-document event across mounted screens. Expired/revoked sessions are cleared after a 401. Logout revokes the hashed server session before clearing local account state. Duck room creation now verifies the host account server-side. A local label or fabricated browser token cannot authorize it. Existing room-scoped host/player tokens keep their existing semantics.

The shared web bar has the same grid, navigation/account order and tap targets; each game retains its own brand/material. Navigation frames are neutral shared assets; game panels are Duck-owned.

## Painted UI and native character

Six distinct AI-painted frame families: green enamel HUD, clamped torn-paper question, walnut/amber action key, recessed green field, stitched burgundy lucky card, laurel result panel. They are WebP images with self-contained SVG equivalents. These SVGs embed painted bitmap artwork; they are not font-to-SVG conversions or pretend pure-vector illustrations. CSS nine-slice layout preserves their edges; CSS does not draw the artwork.

The original round native duck remains in use. Existing registered v12 jump/roll/gear clips remain unchanged. Input feedback remains its own pointer-transparent Pixi application. Player controls are on foreground soil; small screens open questions in an overlay. Only the local duck has a marker; the host retains name labels, including captured racers.

## Obstacle rules

All course objects have fixed world X, continuous random Y, random depth/span and separate physical Z height. There are no movement lanes or lane snapping. Seeded generation is deterministic per room and no longer spawns relative to a racer. New course version 3 migrates older persisted courses once without modifying funds or positions.

| Model | Correct action | Invalid shortcut |
| --- | --- | --- |
| Yellow-ended low beam | Single jump or go around | Crouch/roll through the beam |
| Thorn root | Jump or go around | Crouch/roll through roots |
| Red-flag stacked hay | Double jump above 63 world-px or go around | Single jump |
| Red overhead rail | Crouch or ground roll underneath | Jump through the rail |
| Stone wall / delivery cart | Go around the opening | Any jump/roll through the solid object |
| Net catcher | Leave the net footprint before contact, or spend a shield | Jump/roll through the net |

Two-edge solids leave a variable gap of at least 62 world-px. A one-edge solid leaves the other side open. Full-depth barriers are always actionable (jump, double jump or underpass); full-depth impassable walls are never generated. Consecutive groups are 760–1199 world-px apart. Wet terrain remains separately traversable. Damaging weather is limited to an existing blocked footprint so it does not fill an opening.

Collision is swept in world coordinates (including duck footprint); checks evaluate jump height at time of contact, so boosts cannot tunnel through a barrier. Props have a consistent front-foot pivot and cast grounded contact shadows. Painterly depth faces present their left side to racers moving +X.

## Net capture

Eight authored whole-character frames: watch, alert, wind-up, sweep, scoop, lift, hold, celebrate. The native duck is rotated and baked **inside a sagging rope bag behind the foreground mesh**, offline. Each output frame is a complete RGBA sprite containing person, net and captured duck. There is no runtime CSS layer, duck sticker or z-index trick. All eight colours plus the legacy model variant are packed into an 80-frame padded atlas.

Capture freezes that racer's points/progress, input, question rewards, purchases, cards and vulnerability to another player's fee card. The room keeps racing. A catcher holds at most one racer. The player's screen shows the frozen personal result and explains that final rank remains provisional until the room ends. A shield absorbs capture once. Host labels identify the captured racer.

## Research and tools

- [PixiJS](https://github.com/pixijs/pixijs) and [official PixiJS skills](https://github.com/pixijs/pixijs-skills): scene graph, explicit lifecycle, texture atlas/AnimatedSprite and pivots.
- [Phaser](https://github.com/phaserjs/phaser): comparison/reference for established 2D game structure; no engine migration or dependency added.
- [Claude Code Templates](https://github.com/davila7/claude-code-templates): the `2d-games` and `game-art` skills were installed locally under `.agents/skills/` and read. Applied anticipation/follow-through, silhouettes, atlas batching and ground pivots. No external JavaScript package from these repositories executes in the game.

## Development cleanup

`clean-dev.cmd -Preview` lists targets. `clean-dev.cmd` deletes `.tmp*`, `*.tmp` and `*.log` files inside this project only. It never deletes directories and skips assets, databases/seeds, dependencies, Git, skill/config directories, backups, reports, uploads and saved data. Reparse points are skipped. Only preview mode was run during this task; existing files were not cleaned automatically.

## Local review / limitations

`design-preview/duck-race-v14/` contains frame/rule canvases, the capture storyboard and actual browser screenshots. Temporary QA fixture `.tmp-duck-v14-preview.ts` is **not imported by either production server** and binds only 127.0.0.1. Its fake sessions exercise the actual engine/renderer without bypassing production Google authentication. Do not deploy this fixture; the cleanup script can remove it.

Real Google account sign-in, a Render deploy/Docker image build, 50-device latency and mobile hardware FPS are not verified by local screenshots or mocked identity tests. No production deployment or commit was performed.
