# Render: one backend + one frontend (2026-11-04)

Keep the existing two Web Services. No third service or new OAuth client is required.

## Backend `be-ditatdondau`

- Root directory: `backend`; Dockerfile: `Dockerfile` (not `Dockerfile.duck`).
- Existing Docker entrypoint migrates the shared schema, then runs `src/index.ts`.
- `src/server.ts` composes the two game modules on one HTTP port (`PORT`, supplied by Render). Each game retains its own state, handlers, Socket.IO namespace and simulation loop. No game imports the other.
- Existing `DATABASE_URL`, `DIRECT_URL`, `GOOGLE_CLIENT_ID`, `AUTH_SESSION_SECRET` are reused. No authentication table/schema changes in this fix.
- `CORS_ORIGINS` must include `https://ditatdondau.neoforcelab.com`.
- Factory routes: `/api/...`, Socket.IO path `/socket.io/`.
- Duck routes: `/api/duck-race/...`, Socket.IO path `/duck-socket/`, namespace `/duck-race`.
- Both login buttons now call **`POST /api/auth/google`**; identity check and logout also share `/api/auth/me` and `/api/auth/logout`. The older Duck auth URLs remain aliases for cached older clients only.

## Frontend `fe-ditatdondau`

Keep the existing runtime configuration:

```dotenv
API_URL=https://be-ditatdondau.onrender.com
SOCKET_URL=https://be-ditatdondau.onrender.com
```

Keep the existing `GOOGLE_CLIENT_ID`. Leave `DUCK_API_URL` / `DUCK_SOCKET_URL` unset or blank; this revision falls back to the main API/socket configuration in both browser code and Docker config generation. Explicit Duck URLs remain supported for an optional standalone deployment.

For a same-origin nginx deployment (`API_UPSTREAM`), both API prefixes and both WebSocket paths proxy to that same upstream.

## Deploy and verify

1. Deploy the updated backend first, then the updated frontend.
2. `https://be-ditatdondau.onrender.com/health` must return JSON with `ok: true`.
3. `https://be-ditatdondau.onrender.com/api/duck-race/health` must return JSON with `game: "duck-race"`, not a 404 HTML page.
4. Refresh the frontend. `/config.js` should point both API configurations to the backend URL (or leave Duck blank only when the browser fallback is in use).
5. Log in once in either game, switch games: the account stays signed in. Open both in separate tabs and log out: both tabs clear the shared session.
6. Create and join a room in each game; verify realtime connects to the appropriate path on the same backend.

During diagnosis, the deployed main health route returned 200, the Duck health route returned 404, and the public Duck configuration was blank. POST requests therefore reached the static frontend and returned 405 before Google token verification.

This change is prepared locally; no Render deployment, Google-account sign-in or production database modification was performed by the agent.

## Verification of this fix

- Frontend production build, backend TypeScript build and import-boundary check pass.
- Frontend lint has no errors; existing factory warnings remain.
- HTTP integration exercises both health endpoints, canonical login/session/logout and the legacy alias on one ephemeral local port. It checks CORS, cross-route revocation, game-specific body limits and rejection of unauthenticated room creation.
- Both Engine.IO polling paths and simultaneous native WebSocket connections to the factory and Duck namespaces pass on that same port.
- Frontend URL-resolution tests cover the deployed empty Duck-config case, same-origin nginx mode and an explicit separate Duck backend.
- Docker shell configuration tests execute the actual variable-resolution lines with fake URLs, preserving explicit overrides and defaulting to the main backend.
