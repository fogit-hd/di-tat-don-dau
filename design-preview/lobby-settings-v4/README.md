# Player lobby revision — approval only

2026-10-28. User rejected v3's tiny personal portraits and repeated/ambiguous identity information. No application code was changed in this round.

- `ceo-lobby-full-body.png`: one full-body personal stage, complete hat/arms/garments/legs/shoes, CEO name above it and one Change Identity action below. Room code occurs only in the header and is labeled as a room code. No duplicate personal avatar/name row or repeated joined-room sentence. Other CEOs have compact portrait cards and pagination/search. Saved room settings appear once in a bottom strip. This is the **player** screen; the separate host 50-cell proposal is unchanged and still awaits approval.
- `identity-drawer-full-body.png`: full-body outfit preview beside desktop body/skin/outfit controls, with full-body outfit thumbnails. Mobile keeps a complete character above tabs for body/skin/outfit, rather than stacking all controls. Right-arrow closes the overlay to the right; background is dimmed and its geometry must stay unchanged. Overlay preview uses the new lobby as its background, not the rejected v3 identity row.

Images are design references, not working screens or production sprite assets. They use illustrative people/counts/code. Implementation will use real CEO identity and current avatar configuration, preserve all four body choices, six skins and six existing outfit identities. Some generated clothing details are illustrative; they do not authorize changing existing character/outfit art or introducing a new model. Names get at most two visible lines with full-name reveal. Participant pagination derives from actual records; the concept's “1 / 4” is illustrative.

Generated using built-in ImageGen: one initial generation and one focused correction per final canvas. Resting-lobby correction changed only the caption under year duration; drawer correction replaced old background fragments with the new lobby. Final prompts: complete unclipped personal character and clear separate identity/code hierarchy; complete desktop/mobile wardrobe preview with full-body thumbnails and no layout push. No animation or CSS motion was added.

These images supersede only `lobby-settings-v3/ceo-identity-drawer.png`. Actual responsive measurements, focus/drawer behavior and full-body containment will be tested after design approval.

Implementation was subsequently approved and completed. See `docs/lobby-settings-v4-implementation.md` for behavior, animation inventory and verification; `verification/` contains actual production-bundle screenshots and its test report. The concept images above remain design references.
