# V2 refinement — crawl-only clearance and dense placement

User requested a lower Shift-only opening and a denser randomized course after the V2 approval. Update: only the subsequently attached vertical crawl model is approved and implemented in an isolated Phaser fixture; see `CRAWL-REPORT.md`. Other obstacle paintings remain unapproved.

## Implemented authoritative rules

- `shared/duck-motor.ts` is the source, synchronized into separate frontend/backend Docker contexts. The low opening accepts only grounded crouching. Standing/running, rolling, either jump, attack and guard do not clear it, even if stale contradictory state flags are present.
- Recovery/white flashing and a shield suppress damage, not collision with a solid obstacle. A non-clearing movement stops at its swept contact point. They cannot be used to roll through the crawl-only barrier.
- Ordinary groups are spaced 210–370 world px, compared with the previous 760–1199. Position/depth and span/thickness vary with the room seed; no lanes or racer-following spawn.
- Every placement is rejected if its ground footprint comes within 20px of another. Ordinary obstacles retain an 8px road-edge inset. Mandatory crawl gates instead meet both banks with a 6px coverage overlap; their foot centers stay on the soil. Cast shadows are decorative and excluded from collision/separation tests.
- Rare full-depth action barriers get at least 820px before and after for approach/landing. Every other row preserves a walk-around opening after accounting for the duck footprint.
- Collision retreat now ends just outside the obstacle entry face, instead of a fixed 260px jump back that could put a racer inside a previous obstacle on the denser course.
- New rooms use course version 5 (mandatory crawl gates cover the full road). Lobby/countdown rooms can upgrade; an active room's placed objects are never replaced halfway through a race. Finished room data remains unchanged.

## Verification

- 128 deterministic seeds checked for pairwise ground-footprint separation, road bounds, density and continuous position/size variation.
- 32 seeds checked for a walkable opening or correctly spaced actionable full-depth barrier per row.
- Direct state and server integration checks cover Shift-only traversal, roll/jump rejection, shield/recovery blocking and safe retreat.
- Duck engine/course/guard suites passed; shared-copy parity and game ownership boundaries passed. Frontend/backend builds and frontend lint passed (pre-existing factory warnings remain).
- The selected crawl model now has runtime art and clearance checks in the isolated preview. Other model/scene parity and the live renderer replacement remain pending; see `CRAWL-REPORT.md` for the actual browser checks.
