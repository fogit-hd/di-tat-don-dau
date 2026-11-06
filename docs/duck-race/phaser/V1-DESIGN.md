# Approved V1 implementation contract

Reference: `design-preview/duck-race-phaser-v1/{desktop-concept,mobile-race-concept,mobile-question-concept}.png`. Approved by user 2026-11-04, with obstacle grounding feedback reserved for the next canvas.

- Forest material #123c2f, gold #f4d071, cream parchment #f7e8c4; existing painted HUD, question, field, action and lucky frame families. No generic flat panel replacement.
- Desktop: compact 64px top bar, left race with integrated player/funds/progress/rank ribbon, right question + two boost purchases + three lucky slots. Controls on foreground soil below the road.
- Under 1024px: full-width race, 56px bar, compact HUD, controls in soil, question launcher with countdown. A modal bottom sheet contains all four answers, closes without layout changes, and releases held movement. Clock continues.
- Original 64×64 native frames with ground baseline 48px, 3.2 world scale for every state. Only jump Z changes body Y; shadow and camera ground anchor never jump.
- Continuous manual X/Y movement, no lanes or passive drift. No economic/collision-rule change. Basic walk, air, landing, crawl, roll and pose preview reuse existing clips. Full combat/collision integration is V2.
- V1's interactive local room is clearly identified as a preview; funds/questions are local, with no socket or live score mutation. Expose reusable scene/bridge mount for later authority integration.
- Reuse existing approved countryside and native/UI assets. No new obstacle/terrain artwork implemented in V1. An empty dry test track makes registration and camera defects observable before V2.
- Test 1440×900, 1366×768, 768×1024, 390×844, 360×800 and short landscape. Visible tap targets ≥44px; long names truncated with full accessible name; no document scroll or horizontal overflow.
