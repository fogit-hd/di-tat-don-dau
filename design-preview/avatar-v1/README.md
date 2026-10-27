# Painted CEO avatars

Final user choice: original whole hand-painted characters, replacing the rejected modular animated rig.

Four body presets × six skin choices × six outfits = 144 characters. Each has a body and portrait WebP in `frontend/public/assets/avatars/v1/` (288 files). Full bodies use a common 400×640 transparent canvas with a normalized foot baseline. No bone assembly or CSS character animation.

Built-in image generation produced source atlases. `source-*.json` records prompts/paths; `asset-manifest.json` records bounds and sizes. `scripts/build-avatar-assets.py` crops and normalizes whole figures using Pillow, a development tool only. Contact sheets show all combinations over cream. Runtime paths only use public assets.

The rejected rig is archived in `../avatar-model-v2-archive/` and not imported. Historical rig screenshots/videos are not verification of this final renderer.
