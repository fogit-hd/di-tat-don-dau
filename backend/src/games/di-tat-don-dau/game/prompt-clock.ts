import type {TeamState} from './types'

export function pauseYearForPrompt(state: TeamState, now: number) {
  if(state.promptYearPausedAt==null)state.promptYearPausedAt=now
}
export function resumeYearAfterPrompt(state: TeamState, now: number) {
  if(state.promptYearPausedAt==null)return
  const elapsed=Math.max(0,now-state.promptYearPausedAt)
  if(state.nextYearAt)state.nextYearAt+=elapsed
  if(state.yearLockUntil)state.yearLockUntil+=elapsed
  delete state.promptYearPausedAt
}
