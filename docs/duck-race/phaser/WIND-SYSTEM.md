# WindManager — Phaser 4.2.1

User-authorized implementation, 2026-11-04. The prompt mentions Phaser 3; this project stays on its installed and pinned Phaser 4.2.1. No dependency was added.

## Game rules

- The server rolls one direction for the whole room every 30 seconds. The gust lasts 10 seconds, ramps up over 700ms, and fades over the final 1400ms. Host and players receive the same `WindGust` ID, direction and timestamps.
- Wind does not add passive ground movement. Standing/walking on the ground keeps the existing movement rules.
- In the air, travelling with the wind adds up to 110 world px/s without charging funds or consuming the queued paid distance.
- Travelling against a sufficiently strong gust triggers a recoil of up to 48px in the wind direction. The duck falls over 180ms using a separate Z curve, then is knocked out on the ground for exactly 300ms.
- Recoil is swept against solid obstacles behind the duck. It cannot tunnel back through one. World boundaries still apply.
- No change to jump body scale or original native sprites. `fall` plays during descent, `knockout` after landing; camera and shadow remain attached to ground XY.
- Dash/roll and slash wind bursts are cosmetic. They do not create an unpriced global environmental force or change another racer's funds.

## Files and responsibility

- `shared/duck-wind.ts`: pure envelope and flight/recoil rules; synchronized to isolated frontend/backend copies by `scripts/sync-duck-contracts.cjs`.
- `backend/src/games/duck-race/engine.ts`: authoritative random direction, shared event, movement, collision-safe recoil, falling and stun timestamps. Snapshot sends `wind` and fall fields, not client-chosen forces.
- `frontend/src/games/duck-race/phaser/fx/WindManager.ts`: reusable presentation module with `create`, `update`, `triggerGust`, `triggerSkillWind`, `destroy`.
- `RaceScene.ts`: receives a gust from its `SimulationBridge`, triggers local skill bursts and destroys the manager on Scene shutdown.
- `wind-v1/`: six AI-painted transparent textures. Animated as pooled Phaser images, with curved motion, rotation and alpha lifecycles. Not CSS rain lines or a static fullscreen wind picture.
- Existing live renderer compatibility: original crawl painting is also used by `ObstacleArt`; the current snapshot view receives the global gust, uses its existing animated weather clip and predicts the same free wind drift. This does not silently replace all live rendering with Phaser.

## Standard Scene integration

```ts
import Phaser from 'phaser'
import { WindManager } from './fx/WindManager'
import type { WindGust } from '../contracts'

export class WindExampleScene extends Phaser.Scene {
  private wind = new WindManager()
  private latest?: WindGust
  private serverNow = 0

  create() {
    // Preload wind-leaf-green/amber, dust, ribbon, grass and slash first (see BootScene).
    this.wind.create(this)
    this.events.once('shutdown', () => this.wind.destroy())
  }
  receiveServerWind(gust: WindGust | undefined, serverTime: number) {
    this.latest = gust
    this.serverNow = serverTime
  }
  onDash(x: number, groundY: number, direction: -1 | 1) {
    this.wind.triggerSkillWind(x, groundY, direction, 'dash')
  }
  update(_time: number, delta: number) {
    this.serverNow += delta // real bridge uses its synchronized server clock
    this.wind.triggerGust(this.latest)
    this.wind.update(this.serverNow, delta, this.cameras.main)
  }
}
```

## Tweaking the visuals

`WIND_VISUALS` in WindManager controls:

| Parameter | Default | Meaning |
|---|---:|---|
| maxParticles | 96 | Hard pool ceiling; no Image creation during emission/update |
| emitPerSecond | 18 | Maximum emission at full gust strength |
| baseSpeed / gustSpeed | 170 / 260 px/s | Natural drift plus gust acceleration, in world space |
| waveHz / waveSpeed | 0.7 / 28 | Sine drift frequency and vertical curve velocity |
| lifespanMs | 4200 | Default particle life; alpha ramps in/out before reuse |
| grassDegrees | 12° | Rooted blade sway; the terrain image itself is not rotated |

Leaves use individual rotation/spin; ribbons and dust have lower opacity. Normal alpha blending preserves painted colours without a bright additive glow. Reduced-motion mode reduces emission and disables grass sway/skill bursts. Pool updates are bounded; 60 FPS is a target, not a claim about every device.

## Local test

`npm run dev:phaser` → `http://127.0.0.1:4538/duck-race/preview/phaser`.

Two clearly labelled preview-only buttons trigger either direction without waiting. They modify only the local fixture. There is no new production socket endpoint that lets players choose global wind direction.

Test input: trigger right wind, hold D and jump; compare distance without wind. Trigger left wind, hold D and jump; observe native fall, short knockout and recovery. Holding Shift still crawls through the original full-width gate.

## Validation

- Eight authoritative wind tests: envelope, no passive ground drift, both directions, extra air distance/funds, continuous fall and exact grounded stun, FPS-independent force, shared snapshots, solid recoil boundary.
- Wind QA script: no new Images after pool allocation, saturation capped at 96, fade/reuse/expiry, cleanup and local fixture behavior.
- Original crawl and V1 movement QA retained. Build/lint/browser results are recorded in the task report.
