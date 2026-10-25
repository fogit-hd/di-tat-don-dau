# Random economy verification

Economy randomness is server-authoritative. Existing scalar settings become baselines rather than fixed gameplay outcomes.

- Annual team factors: whole percentages from 80–120% of baseline for event probabilities, family events, questions, support approval, debt interest, machine wear, insurance and centennial bonus. The illness penalty is a whole-% draw fixed for the team's journey.
- Risk exception requested by the user: retain initial configured risks; mortality rises by exactly 0.2 percentage points/year, succession by exactly 0.25 percentage points/year after the initial operating period and until capped. These increments are not randomized or rounded to whole percentages. Longevity retains its protective risk lock.
- Each investment line has its own annual efficiency between 80–120%, shown before buying. Discounts only change the invoice. The same efficiency applies to single and bulk purchases during that year.
- Outcome/family weights also vary per team/year. A protective perk that disables bankruptcy keeps its zero weight.
- Event point ranges receive 80–120% variation around their non-neutral effect. Applied percentage impacts are whole numbers, and the exact applied number is shown. Economic year spans vary around the authored span and stay positive. Multipliers are stored internally as fractions (e.g. 0.51 means 51%); this does not introduce fractional rolled percentages.
- Heir results draw whole percentages within their configured range; missing or obsolete equal bounds fall back to the outcome range. The applied multiplier is stored with the exact whole-% loss/gain description. Centennial rewards are also described as whole percentages, without fractional “times” labels.
- Quiz rewards roll once when resolved. Insurance and centennial rewards are applied once and recorded with their actual amount/multiplier.

Annual factors derive from the team's persisted seed, year and a distinct channel name. Snapshots do not mutate the RNG; refreshing or buying again cannot reroll them. Event draws and resolved results use persisted RNG/state. No database reset or new app dependency is required.

Unchanged settings: currency units, explicit room capital/prices and year duration. Neutral effects (0 change / multiplier 1), bankruptcy (0 assets), and protective guarantees retain their literal meaning. Accounting formulas and display constants are not chance rolls.

Verification: backend/frontend builds; frontend lint (existing warnings, no blocking errors); 93 backend tests passed, 1 PostgreSQL integration test skipped. Production frontend tested in Chromium with mocked HTTP/WebSocket snapshots at 390, 768, 1440px: whole-% efficiency labels, bulk/max purchasing, disabled insufficient-cash purchases, year countdown, fixed +0.2/+0.25pp risk details, exact succession percentage and reload stability. Live Render/database not tested or deployed.
