# Painted environments, version 3

Created with Codex image generation for this project, 2026-11-02. Source outputs and the terrain registration are recorded in `provenance.json`.

- `park.webp`: a hand-painted woodland park with a wooden foreground deck, a distant factory on the left, and a dirt race on the right. Quiet central space accommodates real, accessible HTML controls. Used full-bleed by the game portal and Duck Race menus, lobby and results.
- `terrain.webp`: a horizontal, straight ochre dirt course with grassy forest verges. No characters, UI, water or baked obstacles. Its vertical bands were registered to the existing world coordinates: dirt from y=220 through y=780, surrounding the walkable y=240 through y=760.
- `terrain.svg`: the same bitmap embedded in an SVG texture for the established Pixi asset loader. This is AI-painted raster artwork in an SVG container, not a claimed pure-vector drawing.

The renderer pools five adjacent 1600x1000 terrain sprites. Alternating horizontal reflection joins identical edge pixels without widening a texture to 40,000 pixels. Camera and collision coordinates remain unchanged.
