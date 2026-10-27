# Avatar and session-flow design review — 27/10/2026

Built-in Image Gen was used to extend the approved wine/gold/parchment canvas style. The user approved these canvases and requested responsive long CEO names. The screens and appearance save endpoint are implemented; economic behavior is unchanged. The user subsequently rejected the animated rig and chose the original whole painted avatar, now used in production.

## Approved canvases

| File | Surface |
| --- | --- |
| 09-ceo-join.png | Room code and CEO-name entry |
| 10-ceo-avatar-lobby.png | Character customization while waiting for the host |
| 11-session-countdown.png | Three-second shared start |
| 12-assigned-business-v2.png | Assigned industry, region, scale and actual starting stats |
| 13-host-live-podium.png | Host observation: top three plus ranks four onward |
| 14-host-results-podium.png | Final host podium and ranking table |
| 15-player-results-avatar.png | Personal result with the same saved avatar |

## Brief shared across the generated concepts

Hand-painted 2D business board-game UI, ruby wine brocade, thin gold filigree frames, cream parchment, painterly industrial harbor. Show a legible desktop view and coherent mobile view. Preserve existing routes, true data and controls. Use CEO terminology and exact Vietnamese accents. Do not invent ready states, login requirements, formulas or gameplay rules. Figures shown are illustrative.

Avatar lobby: proposed four body presets, six skin colors, six outfit styles (Sơ mi, Vest CEO, Kỹ sư, Áo khoác, Công xưởng, Nhà sáng lập). Live preview and explicit Lưu diện mạo. Mobile uses Nhân vật / Trong phòng views. The CEO enters with a room code and name; the generated header “Đã đăng nhập CEO” should be implemented as joined-room identity, not Google authentication. Only hosts use Google.

Ranking: selected CEO avatars on a separate 2–1–3 podium; the table starts at rank four and never repeats the podium entries. Personal summary uses the same selected avatar as the podium. Host live details show the actual selected factory, year, cash and value. No made-up histories or question counts.

Context: display the actual randomized industry/region/scale, assigned factory name, role, cash/workers/clusters/people-per-cluster. The global clock is already running. Do not ask for a company name again or allow an invented reroll.

The new podium designs supersede the overview layouts in references 01/02. Existing 03/04/05 remain the source for question statistics, creation and host lobby. The ten-minute shared-round proposal remains a separate rules proposal.

## Already implemented and checked

Creation, host lobby and question-statistics surfaces: see `../../docs/session-flow-implementation.md`, `../../../scripts/session-flow.qa.cjs`, and `verification-final/report.json`. Advisor: `../mascot-guide-v3/verification-ceo-final/report.json`.

Production background/illustration prompts and original generated paths are in `assets-provenance.json`. Runtime art is copied into the project's public assets; no deployed page references a Codex-internal generated-image path.
