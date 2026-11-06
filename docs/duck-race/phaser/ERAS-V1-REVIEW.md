# New mode review: 12 minutes / 7 groups

Prepared 2026-11-05. Status: interactive approval canvas and packaged artwork, not activated gameplay.

Preview: `design-preview/duck-race-eras-v1/index.html`; readable brief alongside it in `review.md`.

Latest user instructions supersede the older manual-motion/obstacle design. Do not implement the old passive movement prohibition when this new mode is approved. New scope: four industrial era backgrounds, 180 seconds per era, 720-second room, seven groups, no obstacles, point-fuel auto-run, study popup, wrong-answer 10-second question lock, and one-of-three reward chests.

Explicit chat confirmation received: study stops motion; closing the popup resumes motion when funded even during the wrong-answer cooldown. Correct answers allow selecting exactly one chest. These decisions do not constitute visual approval of this newly prepared canvas.

No live renderer or backend file changed for this review. Existing factory game and shared login unaffected.

Art: `frontend/public/assets/duck-race/eras-v1/`, provenance records generator and prompts. Four backgrounds generated with the built-in image tool, each based on the existing countryside geometry. Three chest props packaged from a generated transparent sheet. Scripts: `package-duck-eras-review.py`, `prepare-duck-eras-review.py`.

Native animation audit: original duckee supplies idle, walk, crouch, jump, fall, land, damage, roll and death; DuckyV2 adds combat/air poses but neither supplies reading or seated-study. Do not claim such a native clip exists. Preview uses unmodified registered native frames plus a separate proposed book prop. A true seated reading extension remains a visual approval item, not completed production art.

## Verification actually performed

- Opened isolated preview in the in-app browser. Server outside sandbox on loopback port4541; sandbox-only servers were unreachable from the desktop browser.
- Checked 1440×900, 768×1024 and 390×844. Document dimensions equal viewport dimensions; mobile game bottom corrected from858.8px to844px by fixing the review-toolbar height. Question and reward dialogs stayed within viewport. Mobile answer targets measured61px tall.
- Correct answer B showed exactly three chests. Selecting capital changed the displayed120 points to280; only selected chest reward applied. Returning to race resumed consumption.
- Wrong answer displayed10s question lock. Closing returned to racing while locked; subsequent inspection showed running state, consumed points and enabled question button after the lock expired.
- Switched all four era buttons, including tablet4.0. Host view displayed seven names and a seven-row list. This is fixture data, not a seven-client multiplayer capacity test.
- Browser console error log empty in the successful preview tab.
- `node --check` passed for the extracted preview JavaScript. Packager/preparation scripts ran successfully; native copies verified byte-for-byte against registered source frames.
- Production build/lint not rerun: no application TypeScript, runtime CSS, routes, handlers, engine or transport changed for this approval package.

Proof screenshots: `design-preview/duck-race-eras-v1/{race-1440,chests-1440,question-1440,race-390,chests-390,race-768,host-1440,era-2-1440,era-3-1440}.png`.

Unverified/not implemented: full12-minute multiplayer match, authoritative seven-player room enforcement, reconnect/cooldown/chest replay protection, actual background transitions at180-second room boundaries, final fuel balance and seated-study native extension. Browser demo is not evidence of these production behaviors.
