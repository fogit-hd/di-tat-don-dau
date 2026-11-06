# V3 review delivery — one score and chest opening in place

Controlling user reply: one score; no spend while running; gains move forward and losses move backward. This supersedes earlier fuel-wallet/passive-movement proposals.

New isolated package: `design-preview/duck-race-eras-v3/`. It references already packaged V2 architecture/chest/native duck art without cross-importing either game's code. Modules: pure `rules.mjs`, six tests in `rules.test.mjs`, transparent in-place `chest-stage.js`, point-only `chest-events.js`, `review.mjs`, responsive HTML/CSS. A new generated six-frame hourglass is packaged into `frontend/public/assets/duck-race/eras-v3/hourglass.webp` and the review asset directory by `scripts/package-duck-review-v3.py`. Four unmodified shared question fixtures are copied by that script.

No production frontend/backend module was changed. This does not activate the 12-minute mode in live rooms. Current live rules are still the earlier mode until runtime integration is approved; the review toolbar explicitly labels the isolated canvas.

## New interaction

Three same-form transparent chests stay in a horizontal row without a background panel. Selection locks once, shakes the selected sprite about its ground anchor, plays six opening frames at the same position, emits painted item particles and awards only the selected event. Other chests remain closed and faint. The reward summary stays in the question panel; the chest is never moved to a new modal.

The question section is exactly one third of desktop/tablet width, right of the track. Questions last 10 seconds. Incorrect/timeout hides the question for 10 seconds. Correct gives one integer 50–150 reward, then a chest event; only after opening/target choice completes does a five-second painted hourglass wait begin. Hope Star is usable during either waiting period if still available. One star per game, next question only, reward doubled on correct and same prospective reward deducted on incorrect, minimum score zero.

The 30-second room event awards the same random integer 10–50 to all groups. Score-to-world mapping is linear (0.45 world px/point) with a separate visual interpolation/camera transform; no division by a player's zero score. Initial scores are illustrative.

## Verification actually performed

- `node --test design-preview/duck-race-eras-v3/rules.test.mjs`: **6 passed**, covering requested score ratios; no point drain; both random endpoints; periodic-boundary deduplication; question timeout and wrong lock; opening → five-second wait; star availability during waits; star correct/wrong amounts and one-use guard; final event settlement and seven-player limit.
- `node --check` on `review.mjs`, `chest-stage.js`, `chest-events.js`: passed.
- Browser at 1440×900: arena960px / panel480px, document1440×900, question panel client/scroll764/764. At 768×1024: arena512 / panel256; all three chest buttons have identical Y and near-equal widths; computed chest-picker background is fully transparent. At 390×844: document390×844; final question panel client/scroll407/407 (no inner vertical overflow in the tested question).
- Browser correct + star: prospective51 points produced +102, from1,000 to1,102. Wrong + star: prospective143 points produced −143, from1,000 to857; question hidden,10s wait. A separate wrong case successfully armed an unused star during lock.
- One real capture pass:45 browser screenshots over8.49seconds, encoded with original frame timing via `scripts/encode-duck-review-recording.py`. The clip includes selection, opening in place, +27-point scholarship and the hourglass wait. Source capture rate about5fps; repeated output frames preserve time, no interpolated images. Do not claim a60fps capture.
- Browser console errors: none observed. Screenshots include question states, star loss/wait and chest layout. No production build/lint run: only standalone review files/assets changed.
- Impeccable detector was run once. It reported undersized review/mobile metadata and marginal green text contrast; functional mobile text was raised to11px and reward text darkened. Its cream-button-on-cream warning does not recognize the painted amber border-image fill. Manual rendered checks were then repeated. Detector is not claimed clean/passed.

Not verified: real multiplayer scoring/transport, all28 random event outcomes, full12-minute browser match, full production question bank, all long-content/mobile combinations, final results integration, native study animation, production FPS. These are not implemented by this review page.

Runtime integration remains a distinct milestone under the root `AGENTS.md`: “prepare its full canvas/state/motion package and request review” before an unapproved gameplay milestone. The V3 package is now concrete and ready for that review.
