# Fixed camera / ground contact review

**Superseded and rejected by user.** The generated equal-cap/oblique canvases below are historical records, not an approved production reference. User explicitly restored the original long tapered shape and authorized its direct implementation. See `CRAWL-REPORT.md` and the current running `/duck-race/preview/phaser`. None of the images generated for this review replaces the approved original painting.

2026-11-04. This is a review-only refinement; the currently running isolated Phaser fixture is unchanged.

- X travel remains horizontal, left to right.
- The revised painting uses a mild oblique ground axis, approximately `screenX = worldX + 0.25 * groundY`; `screenY = groundY - Z`. Runtime projection is not changed.
- No body scaling by ground depth or jump elevation. Original round duckee frames only.
- Mandatory-crawl gates still span both banks. Their support footprints are not optional walk-around gaps.
- User rejected the previous canvas: mismatched end constructions and local stretching were visible. That canvas is superseded and must not become a production reference.
- The revised asset is one whole painting at a single uniform scale. No end/middle slicing, shearing or local stretching is used. Both cross-caps now share a comparable section, matching two-bolt pattern and support construction.
- The far support is partly occluded by the canopy. A small stone face, rivet, pebble and contact detail remain visible; it is not offset sideways on a separate timber branch.
- The preview shows approach, Shift crawl/occlusion, and exit states at the same native-body scale.

Review: `design-preview/duck-race-camera-standard/index.html` on the existing local review server at `http://127.0.0.1:4539/duck-race-camera-standard/`.

Approval state: previous canvas explicitly rejected; this revised concrete canvas has not yet been approved. Do not replace runtime geometry, collider projection, or the selected runtime painting based only on this document.

Validation for this revision: generated SVG with the review compositor; inspected the local browser overview and all three contact states. No gameplay/build assertion is made for a review-only asset change.
