# Eras V2 — isolated review, not runtime activation

Latest chest instruction: “3 cái rương phải có form dáng giống nhau, chỉ khác model bên ngoài thôi, không được làm cái cao, cái thấp.”

Implemented in the review package:

- A common original six-frame chest master; two AI-edited exterior skins preserve the same form. Old different-height variants are excluded.
- All 18 transparent frames use one master-derived transform per pose, one 384×384 canvas, and ground anchor (192,364). `chest-registration.json` records the selected source and crop for every skin. Decorations may extend beyond the body silhouette; the body is not resized separately by skin.
- Native frame playback plus short anticipation shake; painted coin/link/parchment/dust/skull effects. Reward appears only after opening, and single-choice/repeated-click guards are present in the simulator.
- 28 proposed events and explicit target/result presentation. These values have not been approved for production.
- Six separate terrain paintings and 24 individual architecture sprites. 120 seconds per era. A layered 6.2-second transition dismantles/builds at fixed foundation anchors and replaces the road. 5/6 are clearly labelled speculative.
- Direct review: `http://127.0.0.1:4541/duck-race-eras-v2/?view=chests`.

## Files

`design-preview/duck-race-eras-v2/`: generated HTML, `review.js`, `era-stage.js`, `chest-opening.js`, `chest-events.js`, `sources.json`, copied local assets, review notes and actual browser screenshots.

Packaging/dev scripts: `scripts/package-duck-era-layers-v2.py`, `scripts/package-duck-chest-review-v2.py`, `scripts/prepare-duck-review-v2.py`. New project assets: `frontend/public/assets/duck-race/eras-v2/`. No game code imports these assets/modules yet. No dependencies, routes, handlers or backend reward tables changed.

## Verification actually performed

- `node --check` on all four preview JS modules: passed.
- Python packaging succeeded. All 18 chest frames are 384×384; alpha content bounds remain strictly inside their frame, including open chain tails and lid poses. Closed cards share an identical crop rectangle.
- Browser at 390×844 and 768×1024: document dimensions match the viewport with no body horizontal/vertical overflow. All three cards have equal dimensions. At 768px, all three image boxes measure 95×88; at 390px all three cards measure about 322.8×103.6.
- Browser screenshots at 1440×900, 768×1024 and 390×844 include chest choice, opened safe/chain/skull rewards and mobile question state.
- Opened all three types through UI. Safe fixture gave the opener base points plus a shield. Chain fixture affected one named player. Skull fixture affected three named players. No points were awarded by selecting the two unchosen chests.
- Wrong answer showed a 10-second disabled next-question control. Closing retains the ability to return to the track if funded.
- Observed demolition through browser and saved screenshots for eras 2/3. No browser console errors during these checks.

Not verified: production multiplayer, authoritative reward settlement/targets, all 28 random outcomes, 12-minute end-to-end run, all era transitions on all devices, actual native seated-reading clip, or production FPS. No app build/lint was run for this isolated HTML/JS/assets-only revision. Runtime replacement still requires the user's separate milestone approval under `AGENTS.md`.
