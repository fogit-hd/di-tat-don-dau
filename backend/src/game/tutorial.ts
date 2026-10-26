import type { TeamState } from './types'

/** Persisted in the participant's existing state JSON, isolated from other teams. */
export const TUTORIAL_ACTIONS = ['company', 'cash', 'assets', 'year-count', 'clock', 'income', 'rank', 'sound', 'investment', 'enterprise', 'risk', 'events', 'years', 'investment-return', 'cluster', 'crew', 'enterprise-ready', 'year', 'complete'] as const
export function tutorialActive(state: TeamState) { return state.tutorial?.version === 1 && !state.tutorial.complete }
export function tutorialAction(state: TeamState) { return tutorialActive(state) ? TUTORIAL_ACTIONS[state.tutorial!.step] : undefined }
