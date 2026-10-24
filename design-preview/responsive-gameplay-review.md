# Gameplay responsive — approved canvas implementation

## Approved references and subsequent corrections

The user approved the phone active/finished, tablet, foldable/landscape and compact-events concepts, with these corrections taking precedence over the generated images:

- All five workspace tabs must always be visible. No horizontal tab carousel or arrows.
- Every tab label stays on one line. Narrow screens use a 3+2 arrangement.
- Minimize vertical scrolling and avoid nested scrollers.
- Event arrivals remain inline and never require acknowledgement or take focus from Sang năm.

References: `C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc/exec-ba717eff-cdf9-45d0-bd8b-e32c07ec37e2.png` (phone states), `exec-42918949-2305-46ea-ae45-07a670899849.png` (tablet), `exec-b4201b4c-4c77-436f-8074-843f058361e4.png` (landscape), and `exec-72509b2e-8cf6-4e8b-8442-daaf3076de4b.png` (event summary/full list).

## Implementation

- `responsive-gameplay.css`: compact HUD, responsive two-column/single-column layout, 3+2 or single-row nonwrapping tabs, reserved full-width year dock, compact upgrade typography and costs.
- `EventOverview.tsx`: bounded event preview, current/ongoing counts, explicit Xem tất cả, and user-initiated detail. The full list renders inside the workspace, not in a second scrolling sidebar.
- `EventPanels.tsx`: retains the five tabs and keyboard navigation; adds current/ongoing/history group filters within the existing events tab.
- `ongoing-events.ts`: presentation mapping moved from the former rail; preserves deferred/year-based duration and trait behavior.
- `PlayScreen.tsx`: routes the explicit preview action to the existing events workspace; finished teams initially see the result and history rather than an empty investment panel.
- `BudgetPanel.tsx`: concise visible benefit/current-value text; full benefit retained in accessible description and title. All amounts and prices still come from the existing data.
- `TopBar.tsx`: semantic clock class for stable responsive placement.

No new dependency, route, backend rule, probability or request-handler changes in this responsive task. All 257 existing hand-drawn illustrations remain local.

## Visual fidelity review

| Point | Concept and implementation evidence |
| --- | --- |
| Layout | Phone is one column with no large factory image; tablet uses a landscape factory thumbnail and an independent workspace. The previous tall cropped factory is removed. |
| Palette and frames | Wine lacquer, gold corners, cream parchment and orange action buttons retained. Existing CSS/SVG frame system retained; no new frame bitmap assets. |
| Typography | Smaller headings, 12–13px content and compact metadata. All five exact Vietnamese tab labels remain visible and single-line. |
| Event browsing | Compact rows and accurate group counts replace tall individual rail cards; explicit full-list access uses the workspace. New arrivals never open a dialog automatically. |
| Upgrade art and controls | Actual industry/perk watercolor assets; small thumbnails, benefit text and orange price badges. Full row remains the existing investment action. |
| Year action | Full-width bottom dock, original year/lock/pause timing and perimeter progress. Preview expansion never covers or shifts the action. |
| Finished state | Existing cause/outcome/value/rank plus history replace the empty parchment panel. No fabricated final statistics. |

Concept images and browser captures were inspected directly with `view_image`. The implementation follows the approved hierarchy and user corrections; it is not claimed pixel-identical to AI-generated lettering or fixture data.

Intentional responsive adaptations: very short phones show one preview row and put Xem tất cả beside the counters; other screens show up to three rows. Low landscape screens may hide the factory to preserve controls. Extra entries always remain in the full list. At 320×568 and other short screens the main workspace still needs vertical scrolling; zero scrolling cannot fit arbitrary data while keeping readable text and all controls.

Visible-copy review: existing five labels, Vietnamese diacritics, room actions and actual industry labels retained. New event grouping/count controls correspond to the approved event concept. Short upgrade benefit copy uses the approved concise explanations. Generated example names, percentages and static 3/7 counts were replaced by actual snapshot data.

## Verification

- `npm run build -w frontend`: passed, production obfuscation retained.
- `npm run lint -w frontend`: exit 0; existing hook/ref/start-screen warnings remain.
- `node scripts/gameplay-ui.qa.cjs` delegates to `responsive-gameplay.qa.cjs` and exercises the current approved UI.
- Chromium production-bundle QA: 320×568, 360×640, 390×844, 412×915, 540×720, 720×540, 768×1024, 820×1180, 1024×768, 1180×820, 844×390, 1440×900, 1600×1000.
- Assertions: no page overflow; five visible, nonclipped, nonwrapping tabs; only workspace vertical scrolling; visible year dock/perimeter; current/ongoing/history filters; 0/1/7/20 events; explicit detail typography; pending/active yearly labels even after animation expiry; lock/pause; investment/year/restart request payloads; inline trait notification without focus theft; long names and large monetary values; finished summary/history; all 64 industry image mappings.
- Browser/IAB was tried first but localhost returned `net::ERR_CONNECTION_TIMED_OUT`. Playwright Chromium loaded the actual build with local assets and mocked HTTP/Socket.IO snapshots. No real mobile/iPad hardware, production room or deployment was tested.

Final browser evidence: `responsive-implemented-phone.png`, `responsive-implemented-tablet.png`, `responsive-implemented-fold.png`, `responsive-implemented-events.png`, `responsive-implemented-finished.png`; machine-readable results in `responsive-verification.json`.

The local dev server remains available at `http://localhost:4517/`. Nothing was committed, pushed or deployed by this task.
