# Quiz Duck Race — Đua Vịt Chiến Thuật

## Two games, independent sessions

The root `/` is the two-game selection portal (`/games` remains an alias). The factory landing is `/di-tat-don-dau`; its `/host/:code`, `/play/:code`, `/wiki` routes and existing API remain unchanged. Old root QR links `/?code=ABCDE` redirect to the factory landing with the same query. Factory home links return to its own landing; “Chọn game” returns to the portal.

The selector is `/`. The new game is `/duck-race`, `/duck-race/host/:code`, `/duck-race/play/:code`. It has its own Express entry point, room codes (`D` + six hexadecimal characters), tokens, localStorage prefix, API prefix and Socket.io path/namespace. It does not require the factory database to run.

Run from the repository root:

```powershell
npm run dev:duck
```

- Browser: http://localhost:4525/duck-race
- New API: http://localhost:4608/api/duck-race/health
- Existing game can independently run with `npm run dev` (4517 / 4607).
- For phones on the LAN use the computer's LAN IP and port 4525, not `localhost`. QR links use the origin currently open on the host.

## Shipped rules

- **Ground race**: grass verges and dirt track, finite 40,000px world; progress is displayed as 0–100 along the centreline. Ducks run, never swim. A sampled straight horizontal centreline share positions between terrain, obstacles and ducks. There are no lanes. W/A/S/D applies normalized world-space X/Y movement within a continuous dirt-road boundary. Releasing input stops the duck; no passive movement remains.
- Server clock: 3-second countdown followed by exactly 600 seconds. Each player has a shuffled, no-repeat-until-exhausted question deck, independently timed at 20 seconds, followed by 3.5 seconds for the answer and explanation. The current four-answer presentation bank is reused by reference; the factory game is not modified.
- Correct answer: `100 + floor(100 × remainingFraction)` points. Wrong/timeout: zero. Answers never advance a duck. The server owns all deadlines and balances; the correct option is sent only after answer or timeout.
- Walking is free but slow (64 world px/second), and always requires held directional input. 50 points buys one roll pulse (395.2 world px); 150 buys four pulses. E buys four pulses; held directional input consumes reserve pulses at 260 px/second. No input means no travel and no pulse consumption. Buying energy never changes position directly. This replaces the original paid-only/automatic-forward draft to match the approved free-control revision. Arrival, not purchase, triggers the finish. Purchases are serialized per room.
- Space jumps for 850ms, cooldown 1200ms. Shift is held crouch, slowing movement to 45%. The server checks jump/crouch state against specific obstacle types. F pushes a nearby forward-facing opponent within 62px, with a 3s cooldown, 0.7s stun, bounded 16px push and 2.5s victim immunity. Shield blocks one push; jumping avoids it. Pushing never transfers or destroys score. A whiff consumes the cooldown.
- Input is sent over the authenticated player socket, limited to one update per 40ms and expires after 400ms. Disconnect, blur, visibility change and touch cancellation reset held input. The server accepts directions and actions, never client-provided coordinates, speeds or balances.
- One Ngôi sao per player per match. At least 100 points required. Reserves the player's balance up to 200 before answering. Correct: returns stake and awards twice the normal answer reward; wrong/timeout: stake stays lost. No negative balances.
- After a random 3–5 answered questions (including timeouts), receive one of eight cards. Inventory cap 3; an overflow card converts to 50 points. Every effect is specified in `shared/duck-race.ts` and shown in the interface. The transfer card is capped at 10% of the richest opponent's current points and at 75 points; both players receive a log entry. Transfers conserve the sum of balances.
- Rocks, hurdles and low overhead gates are seeded throughout the course when the room is created and persist for the match. They stream into the camera window as a duck approaches. Separately, every 30 seconds six shared **environment** dust events appear for 10 seconds. Permanent obstacles stall 1.5 seconds; dust vortices 2.5 seconds. Wide hurdles require a jump; overhead gates require crouching; rocks/vortices can be steered around without lane snapping. No distance or points disappear. Shield absorbs one collision. An obstacle can hit a given duck only once.
- First physical finish wins and ends the race. If no finish, after ten minutes **reserve points** decide the winner, then distance, then correct-answer count; final stable ID breaks a complete tie. The live ranking is explicitly labelled as distance ranking. Ending early uses the same reserve-points rule.
- Host starts/ends, shares QR and sees the live track, 10-row ranking pages and final top three. Player sees their own question, wallet, movement purchases, cards, reconnectable identity and personal result. Long names ellipsize visually with the full name in the title attribute.

The canonical network contracts and track survey are in `shared/`. Run `node scripts/sync-duck-contracts.cjs` after editing them; generated local copies allow both existing folder-scoped Docker contexts to build independently. `--check` catches divergence without writing files.

## Assets and motion

The owner's `DuckyV2` and `duckee` asset folders supplied all duck animation. `scripts/prepare-duck-assets.py` imports the frames without resizing or changing registration; Ducky horizontal sheets are sliced into original 64×64 cells. The manifest contains 64 clips / 198 PNG frames in a padded 1088×884 texture atlas. PixiJS `AnimatedSprite` plays actual body frames. No CSS limb animation, GIF or hand-drawn replacement character is used. Each canvas owns a separate FollowCamera.updateCamera(duck) instance using GSAP quickTo on the world container X/Y. Host can select distance leader or wealth spotlight; the player camera always follows their own position. Boost uses a shorter camera settling time. Sprite positions interpolate and briefly extrapolate server snapshots within the surveyed road boundary. GSAP also animates obstacle entrances. Reduced-motion preference disables sprite cycling and tweens while preserving gameplay.

The renderer uses a footprint below every duck on the dirt, no water ripples. Jump lifts the original sprite above its footprint; crouch/crawl, roll, hit and the Ducky V2 attack use native full-body frames. The duckee pack has no punch clip, so it uses its existing full-body roll for a bump rather than a fabricated articulated arm. The chase camera follows the leading duck on the projector, and the player's own duck on their phone. Coincident ducks aggregate into labelled packs; the ranked list keeps every participant individually accessible.

Source attribution and license status are in `frontend/public/assets/duck-race/SOURCE.md`. The supplied folders have no license document; retain the original pack license before redistributing publicly.

## Deployment and Redis

Keep the existing factory service. Add a separate Render Web Service using this same repository. For Docker, use root directory `backend`, Dockerfile `Dockerfile.duck`; this entry point does not run the factory database migration. For a native Node service from the repository root:

```text
Build: npm ci
Start: npm run start:duck -w backend
DUCK_PORT=<Render PORT value>
CORS_ORIGINS=https://your-frontend-domain
DUCK_REDIS_URL=<your private Redis connection URL>
```

The server also reads the standard `PORT` variable if `DUCK_PORT` is absent. Never put Redis credentials into frontend environment variables.

Frontend can use an origin-level reverse proxy:

```text
/api/duck-race/* → new duck service
/duck-socket/*  → new duck service (WebSocket upgrade enabled)
/api/*         → existing factory service
/socket.io/*   → existing factory service
```

With the existing frontend Docker image, set runtime `DUCK_API_URL` and `DUCK_SOCKET_URL` to the new service URL. Alternatively set `VITE_DUCK_API_URL` and `VITE_DUCK_SOCKET_URL` before building. The duck API configuration is intentionally separate from the existing `VITE_API_URL`.

Without `DUCK_REDIS_URL`, development uses process memory and a server restart loses rooms. With Redis, room state is saved once per second and after successful actions, expires after two hours, and reloads on authenticated reconnect. A Redis connection failure at startup fails startup instead of silently discarding durable storage.

**Run one duck API instance** in this version. Redis provides persistence/recovery, not distributed simulation ownership. Horizontal API replicas need a room-owner lease and Socket.io Redis adapter before enabling them; this implementation does not claim multi-process consistency. No Redis instance is provisioned or deployed by this change.

## Verification

```powershell
node scripts/sync-duck-contracts.cjs --check
npm run test -w backend -- src/duck-race/engine.test.ts
npm run build -w backend
npm run build -w frontend
npm run lint -w frontend
node scripts/duck-race.qa.cjs
```

The browser QA uses actual HTTP actions and sockets, creates a host and 50 players, answers through the interface, purchases movement, reloads a player session, ends the race, checks private data does not leak, checks WASD/stop/jump/crouch/E/F, separate host/player camera target IDs, captures desktop/tablet/mobile views and checks horizontal overflow. Its generated evidence is in `design-preview/duck-race-v1/`.

Installed Codex tooling: all 25 skills from https://github.com/pixijs/pixijs-skills were installed before the camera/control revision. The PixiJS router, container, sprite, ticker and performance references were read.

Not yet claimed: sustained 60FPS on physical classroom devices, Redis failover under live load, horizontal replicas, or public deployment. UI captures are local browser evidence, not a classroom load test.


Horizontal-map revision: the road is now a straight 40,000px world, with continuous 520px playable breadth. Permanent seeded obstacles exist from the start along the whole course and never expire; sprites are instantiated 250px outside the viewport before reaching it, and culled behind the camera without removing server collisions. Only environment dust events use the 30-second spawn / 10-second lifetime. Fourteen authored SVG assets supply tiled ground, obstacles, labels and UI frames; original duck sprite animations remain unchanged. UI CSS arranges artwork and accessible focus/answer states. Browser evidence for this revision is design-preview/duck-race-horizontal-v2. New rooms are required; Redis room namespace advanced to v2 to avoid restoring incompatible geometry.

## Portal and painted backgrounds (2026-11-02)

`/` now opens the independent two-game portal. It imports neither game runtime until selected. Factory QR links from the previous root URL still work. Background sources and world-coordinate registration are documented in `frontend/public/assets/duck-race/background-v3/README.md`. The factory gameplay and its harbor artwork were preserved. Browser evidence at 390, 768 and 1440px is in `design-preview/game-portal-v1/`.
