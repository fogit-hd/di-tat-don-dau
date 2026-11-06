# Phaser configuration — V1 preview implemented

Engine **4.2.1** runs the isolated `/duck-race/preview/phaser` route after explicit V1 approval. `createGameConfig.ts` and the Boot/Race scenes implement the V1 settings below. Live-room activation and collision parity remain gated by V2; later rows about gear, advanced FX and full combat are the subsequent plan.

| Area | Planned setting | Reason |
| --- | --- | --- |
| Renderer | `Phaser.AUTO` | WebGL when available, Canvas fallback |
| Scale | `Phaser.Scale.RESIZE`, parent = race mount | Match the actual game viewport; do not stretch world coordinates |
| Scenes | Boot → Race; separate presentation FX scene where needed | Explicit loading/retry and teardown |
| Physics | Arcade, fixed step 60Hz, global gravity `{x:0,y:0}` | Ground X/Y is independent from jump height Z |
| Background filtering | Smooth/linear | Preserve painted scenery |
| Native duck/gear filtering | `texture.setFilter(Phaser.Textures.FilterMode.NEAREST)` | Preserve original pixel sprite silhouettes |
| Camera | bounded follow target at the ground anchor, smooth lerp and forward look | No jump-induced bobbing or actor resizing |
| Animation | registered atlas frames; idle/run loops; action states keyed by entry time | Avoid resetting a clip every snapshot or render |
| Input | Phaser keyboard/pointer + existing touch intents | One normalized intent path; release on blur/cancel/drawer |
| Socket ownership | existing React room connection; bridge data into scene | No extra connection per scene restart |
| Authority | existing backend simulation and integer score | Phaser does not award points or bypass purchases |
| Vite loading | dedicated `phaser-renderer` chunk when first imported | Keep engine out of landing/Wiki startup |

Priority to implement after approval: captured/terminal → stun/recovery → guard → attack pose → roll → double-air → first-jump/fall → crouch/crawl → swim/mud → walk/idle. Each action must be reconciled with server state; this table is not permission to alter cooldowns or economic rules.

## Existing Duck files to migrate

`RaceTrack.tsx`, `camera.ts`, `GearRig.ts`, `ObstacleArt.ts`, `TerrainEffects.ts`, `FieldFocus.tsx` and the GSAP usage in `EquipmentDrawer.tsx` were inventoried. They are migration targets; installing Phaser does not replace them automatically. Remove the old dependency only after the final approved audit finds no remaining consumers.
