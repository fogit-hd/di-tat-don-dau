import type { TeamState } from './types'

/** Persisted in the participant's existing state JSON, isolated from other teams. */
export const TUTORIAL_ACTIONS = ['company', 'cash', 'assets', 'year-count', 'clock', 'income', 'rank', 'sound', 'investment', 'enterprise', 'risk', 'events', 'years', 'investment-return', 'cluster', 'crew', 'enterprise-ready', 'year', 'complete'] as const
export const TUTORIAL_V2_ACTIONS = ['company','cash','assets','year-count','clock','income','rank','sound','investment','cluster','crew','supply','infrastructure','green','enterprise-ready','stat-workers','stat-clusters','stat-products','stat-tech','stat-supply','stat-infra','stat-environment','stat-quality','risk','events','years','year','complete'] as const
export function tutorialActions(state: TeamState): readonly string[] { return state.tutorial?.version === 2 ? TUTORIAL_V2_ACTIONS : TUTORIAL_ACTIONS }
export function tutorialActive(state: TeamState) { return (state.tutorial?.version === 1 || state.tutorial?.version === 2) && !state.tutorial.complete }
export function tutorialAction(state: TeamState) { return tutorialActive(state) ? tutorialActions(state)[state.tutorial!.step] : undefined }
export function tutorialPurchase(state:TeamState) {
 const action=tutorialAction(state)
 return ({cluster:{line:'mac',quantity:1},crew:{line:'eng',quantity:'crew'},supply:{line:'sup',quantity:1},infrastructure:{line:'inf',quantity:1},green:{line:'grn',quantity:1}} as const)[action as 'cluster'|'crew'|'supply'|'infrastructure'|'green']
}
