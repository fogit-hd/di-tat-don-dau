# Project instructions

## Two games and one account

- `frontend/src/games/di-tat-don-dau` and `backend/src/games/di-tat-don-dau` own the factory game.
- `frontend/src/games/duck-race` and `backend/src/games/duck-race` own Duck Race. Never import one game from the other.
- Shared HTTP, Google account/session and transport helpers belong in `shared`. The deployment root may compose both game modules on one backend port.
- Both games sign in through `/api/auth/google` and use the existing shared session. Preserve the two-service Render deployment.

## Duck Race Phaser migration — user approval gate

The user approved installing Phaser and its agent skills. They require a model canvas for approval **before coding each gameplay milestone**. Installing the dependency is not approval to replace the running renderer.

- Read `docs/duck-race/phaser/MIGRATION-PLAN.md` and `APPROVALS.md` before a migration change.
- If that milestone has no explicit user approval, prepare its full canvas/state/motion package and request review. Do not start its gameplay implementation or infer approval from time elapsed.
- Follow the official Phaser 4 skills in `.agents/skills/`. Start with `game-setup-and-config`, then load only the relevant specialized skills: `scenes`, `animations`, `cameras`, `loading-assets`, `physics-arcade`, `input-keyboard-mouse-touch`, `scale-and-responsive`, etc.
- Skills are pinned to the source in `.agents/skills/PHASER-SOURCE.json`; engine is pinned to Phaser 4.2.1. Do not follow Phaser 3 examples without checking the migration guide.
- Apply Phaser to Duck Race only. Audit and remove Duck-specific Pixi/GSAP imports at the final approved milestone after the replacement passes.
- Use the original round `duckee` native sprites and registered anchors. Do not substitute the different legacy duck model or redraw it via image generation.
- This is a left-to-right horizontal race. Ground Y is continuous, not lanes. No passive movement. Guard stops movement; A/D changes guard facing. Jump height is separate from ground depth and never scales the body.
- Keep points, purchases, collisions and rankings server-authoritative. Rendering, CSS transforms or local animation never award progress or points.
- Generated canvases are design references, not screenshots of a working Phaser game. Mark that distinction in reviews.
