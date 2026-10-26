# Refinement — 26/10/2026

Requested fixes: neighbouring frame bleed while speaking; clipped outer elbow; slower-than-desired pointing; eyes/chin should look up with the pointing arm; apparent body resize between wait/talk/point.

## Implemented

- Generated replacement talk-safe.png and point-safe.png using built-in Image Gen, preserving the whole-actor art. No limb splitting or CSS movement.
- Discovered the generated row positions are NOT an exact equal grid. Analyze connected whole characters and crop their real full extents with transparent padding; reject crop intersections with neighbouring actors.
- Load each complete frame into its own ImageBitmap. Downscaling can no longer sample pixels from a neighbouring atlas cell.
- Calibrate uniform camera scale and anchor from the torso/belt buckle, not total actor height or head emblem. Use a common reference and fixed world waist.
- Wait/closed-mouth and point frame0 share the EXACT same bitmap. This guarantees no image change at the start boundary; later frames are authored whole poses.
- Pointing: 480ms, down from875ms to reach oldframe7. Return:320ms played backwards through existing whole frames. No crossfade/double body.
- Replacement pointing art has the pupils look up-right before the hand extends, then the chin/head angle follows. Visual verification is required; tests cannot certify gaze quality.
- Explicit repeated Point clicks replay by lowering and re-raising the arm. Waiting on its own never replays, advances the tutorial, or starts a year timer.
- Existing overlay and first-year rules remain unchanged.

## Evidence

- verification/sprite-analysis.json:8 complete connected actors per source.
- verification/sprite-calibration.json: crop margins, no neighbouring intersections, uniform torso corrections.
- verification-refined/report.json: responsive and interaction tests at390/768/1440.
- 04-refined-motion.webm: fresh browser recording.
- 05-refined-closeup.webm: same recording cropped for a clearer view.

Local preview only. No production React/game changes, new dependency, route or backend change.
IAB still reports a localhost timeout; Chromium serves the same local files through route.fulfill for verification.

