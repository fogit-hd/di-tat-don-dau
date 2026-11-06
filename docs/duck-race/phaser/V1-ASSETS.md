# V1 asset provenance

Native duck atlas, countryside, shadow, own-player marker, lettering and role-specific HUD/question/field/card/boost frames are reused unchanged from the existing Duck Race asset library. No legacy duck art is loaded by Phaser. `atlasAdapter.ts` reads existing native v12 frame names; it does not crop, rotate, recolour or stretch individual poses.

New asset: `frontend/public/assets/duck-race/phaser-v1/control-wood.webp`.

- Built-in ImageGen, actual transparent background, one attempt.
- Source `C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc/exec-b26dd1dc-bdd9-471b-b7f1-25b2e402541e.png`.
- Style reference: the approved desktop canvas. Packaging trims transparent gutters and resizes to 600×558; the original stays intact.
- Usage: resizable foreground control tile, 15% nine-slice so its painted corners stay inside its layout box. No CSS-drawn replacement illustration.

Prompt:

> Create ONE production game UI asset matching the wooden control tiles in the bottom row of the supplied Quiz Duck Race approved concept. Reference image is STYLE AND MATERIAL only. Generate a single EMPTY wooden button tile, almost square (width to height about 1.2), front-facing perfectly orthographic, chunky hand-painted amber-gold beveled outer rim, dark warm brown rich wood center with subtle horizontal wood grain, softly rounded bevel corners similar to the original board-game illustrated style. No words, no letters, no icons, no character, no UI mockup, no scenery, no extra objects. Bright upper-left rim and darker bottom-right rim imply tangible raised button, no large external shadow. This will be a nine-slice resizable interactive control: corners and edge ornament should stay confined to a narrow 12% border; broad uninterrupted darker warm brown center, no ornament crossing into center. Clean complete asset with 16px transparent margin, absolutely no cropping, actual transparent outside background. Do not create orange solid fill or glossy plastic. Exactly one wood button blank filling most of canvas. Project-bound asset for approved Phaser V1 UI.
