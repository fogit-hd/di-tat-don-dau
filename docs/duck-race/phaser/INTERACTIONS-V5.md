# Chest interactions and duplicate joins — 2026-11-06

## Entry

The old V4 join handler allowed duplicate names and created a new player for every POST. A React disabled state alone cannot protect requests already submitted or sent by another tab.

The frontend now uses an immediate submit ref, a per-room browser UUID and Web Locks when available. The server serializes room mutations, remembers the UUID → player mapping in the persisted room, and returns the same player/token for retries, including when the room is full or already started. An independent browser cannot claim an existing token merely by matching the name. NFC, whitespace-normalized, case-insensitive names must be unique **inside that room**. Other rooms may reuse the name. Legacy rooms retain their old engine.

Existing duplicate players are not silently deleted or merged: their ownership and earned scores cannot be safely inferred from a name.

## Receipts

- Server-authored `ChestNotice`, private to each recipient and to the opener. It includes a stable event result ID, title, actor, exact signed score delta and personal wording.
- Not sent before settlement or before a required target selection. Multi-target transfers generate one personal receipt per actual participant, not just a result for the opener.
- Percentage transfers use each donor's pre-transaction balance. The receipt shows the requested integer percentage, base and actual amount; if limits reduce it, it says so. Floors at zero, shields, 80-point / 20% donor caps and the 160-point total cap remain in force.
- A non-modal center-screen FIFO displays each receipt once, with a close control, polite live announcement and no focus capture. It does not block answer controls. Reconnect only recovers recent receipts, not old match history. Personal history also records the result.

## Painted FX

30 existing V5 review frames (600,374 bytes total) are now runtime assets in `frontend/public/assets/duck-race/experience-v5/fx`. Each of the five types has six aligned alpha frames. The Phaser renderer blends adjacent authored frames; it does not approximate the art using CSS, redraw the duck, or add gameplay penalties. Two reusable images per active effect keep allocations bounded.

- Safe chest: coins/gold; chained chest: teal chain release; skull chest: purple skull/smoke. Only the chosen chest opens in place.
- Weather catalogue events carry semantic `lightning` or `wind` codes in authoritative score mutations. Their FX follow the affected original duck during its existing knockout slide and recovery. A shield block emits no false damage FX. Economic fees/transfers do not emit weather FX.
- Reduced motion keeps the receipt and gentler VFX opacity; score/rank remain server authoritative.

The separate proposed host 50/25/25 layout is not part of this change.

## Catalogue

120 authored events (16 safe / 40 single / 64 explosive), up from 72. There are 47 actual donor/receiver transfer events. New combinations include fixed/percentage theft, gifts to selected/random/multiple/all groups, leader/last targeting, weather on selected/multiple/all participants, shields and next-answer bonuses. All draws and score deltas are integers. See `CHEST-EVENTS-V4.md` for the updated full catalogue.

## Checks actually run

- Entire Duck Race backend suite: **102 passed**, including concurrent HTTP joins, retry token identity, name takeover rejection, full/started-room retry, catalogue-wide settlement, percentage receipts, shield handling, no unrelated-recipient disclosure, JSON persistence, weather codes and existing motion/legacy regression tests.
- Backend TypeScript build and frontend production build passed. Frontend lint exited 0 with pre-existing warnings; existing large-chunk build warnings remain.
- Contracts generator check passed.
- Local browser connected to the real room engine through the explicit loopback-only test fixture: observed victim's central transfer receipt, 5% multi-target receipt on 390px, sét frames on the lying original duck and native recoil, and chest-opening state. Existing gameplay and painted UI retained. 1440px and 390px screenshots inspected, with no document overflow at 390px.
- The fixture lives only in an opt-in test file; no QA/auth-bypass endpoint is mounted by production.

Not deployed. Rebuild/deploy both frontend and backend for the new DTOs, join behavior, events and FX. Live Render behavior and physical-device frame rates were not verified.
