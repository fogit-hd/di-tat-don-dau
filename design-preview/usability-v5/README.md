# Gameplay, typography and Wiki — 29 October 2026

Implemented the preceding request before rebuilding the hero delivery loop.

- Reused the bundled Vietnamese-complete DejaVu Sans face (`Public UI`) for native text and existing SVG glyph outlines. No external font request. Numerals use lining/tabular forms. The CEO/company tooltip now explicitly uses dark brown on cream.
- Shared `PAGE_SIZE = 10`: Wiki industries, events, updates and questions; gameplay event lists/year ledger; player/host question reviews, results, rankings and desktop lobbies. Compact event previews remain two entries; phone lobbies may show fewer than ten.
- Added 60 original review questions to the existing 20. All 80 have four choices, one correct answer and an explanation. Scope: supplied 6.1.1–6.1.2 outline, including the hypothetical Country A/50,000-engineer discussion. Wiki and shipped runtime questions come from the same source. New IDs are merged into the runtime catalog without a destructive database reseed; explicit database edits/inactive IDs retain precedence.
- Phone gameplay hides the optional company illustration, gives cash/assets/clock/rank separate space and stacks the end-game action caption.
- Advisor: personal welcome waits for a screen/dialogue tap; highlights cash/assets/clock/rank only; no sound/year/income detours. Investment is already open. Other tabs open before their explanations; the five actual purchases and Sang năm remain player actions. Explanations use current CEO/industry/quotes, with a 2.5-second response gap. Text starts after the pointing entrance and shares a speech clock with mouth frames. Point direction is stable during each sentence, including while the target scrolls into view.

## Verification actually run

Changed/new source groups (repository-relative):

- Fonts/color/mobile: `frontend/index.html`, `frontend/src/main.tsx`, `public-font.css`, `readable-ui.css`, `components/ArtText.tsx`, `components/PublicArtText.tsx`.
- Pagination: `frontend/src/lib/pagination.ts`, `components/PageControls.tsx`, `EventOverview.tsx`, `YearLedger.tsx`, `ResultEvents.tsx`, `HostQuestionStats.tsx`, `PlayerQuestionReview.tsx`, `LiveRanking.tsx`, `SessionRanking.tsx`, `Leaderboard.tsx`, `LobbyParts.tsx`, `WikiPage.tsx`, `WikiUpdates.tsx`.
- Question bank: `backend/prisma/seed/presentation-questions.ts`, `backend/prisma/seed/pack.ts`, `backend/src/game/questions.data.ts`, `question-bank.ts`, `question-bank.test.ts`, `catalog.ts`; `frontend/src/components/WikiQuestions.tsx`, `wiki-questions.css`, `frontend/src/lib/wiki-questions.json`; `scripts/build-wiki-catalog.mts`.
- Advisor: `frontend/src/components/FirstYearAdvisor.tsx`, `first-year-advisor.css`, `PlayScreen.tsx`, `frontend/src/lib/first-year-guide.ts`, `first-year-guide-v2.ts`, `advisor-dialogue.ts`, `advisor-direction.ts`.
- Verification: `scripts/usability-guide.qa.cjs`, `usability-wiki.qa.cjs`, `home-login-wiki.qa.cjs`, `check-public-lettering.cjs`.

- Frontend and backend builds: pass. Frontend retains the existing large-chunk warning.
- Backend suite: 190 passed, 1 database integration test skipped. Question-bank tests rerun after the CommonJS-compatible fixture-path correction: 4 passed.
- Frontend lint: exit 0, 12 existing warnings; no new advisor/hero warnings.
- Vietnamese SVG glyph audit: 186 required characters, both weights.
- `scripts/usability-guide.qa.cjs`: complete year-one flow at 390×844, 768×1024, 1440×900, with five real investment requests, no automatic purchases, real year settlement and the next 60-second timer. The global match deadline stays unchanged. Checks also cover target/button visibility, automatic tabs and the corrected tooltip color. Report: `guide/report.json`.
- `scripts/usability-wiki.qa.cjs`: all 80 questions inspected at desktop, ten per page, four choices/one correct answer/explanation; search, industry/event/update pagination and no horizontal overflow at all three sizes. The test waits for the lazy question stylesheet and verifies its grid layout. Report: `wiki/report.json`.
- Public login/join regression at 360, 390, 768, 844-landscape and 1440 widths: pass; Google/API are fixtures. Report: `public/report.json`.

Screenshots under the three verification folders are local browser captures. IAB control returned `browser.user is unavailable`, so Chromium was used. Physical mobile devices, a real Google sign-in and the production database/deployment were not exercised.

Question source boundaries: questions are authored revision material, not copied textbook pages or an official exam. The 2021 book's bibliographic record and a clearly labelled supplementary official Resolution 29 link are included in the Wiki. No claim of access to the restricted full textbook PDF.
