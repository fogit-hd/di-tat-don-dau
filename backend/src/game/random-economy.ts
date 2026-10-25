import { hashString, makeRng } from './rng'
import type { Balance, Line, TeamState } from './types'
import type { SuccessionPolicy } from './succession'
import { rollWholeRate } from './percent'

/** Stochastic rounding keeps sub-percent baselines meaningful while every applied rate is whole %. */
export function annualWholeRate(state: Pick<TeamState, 'seed' | 'cycles'>, value: number, key: string, year = state.cycles) {
  const rng = makeRng(hashString(`whole-rate-v1:${state.seed}:${year}:${key}`))
  return rollWholeRate(value, rng)
}

export function annualWeights<T extends { id: string; weight: number }>(state: Pick<TeamState, 'seed' | 'cycles'>, rows: T[], group: string): T[] {
  return rows.map(row => {
    const rng = makeRng(hashString(`weights-v1:${state.seed}:${state.cycles}:${group}:${row.id}`))
    return { ...row, weight: row.weight * rng.int(80, 120) / 100 }
  })
}

/** Stable server-side draws: reconnects, purchases and snapshots cannot reroll the current year. */
export function annualEconomy(state: Pick<TeamState, 'seed' | 'cycles'>, year = state.cycles) {
  const draw = (key: string, min = 80, max = 120) => {
    const rng = makeRng(hashString(`economy-v1:${state.seed}:${year}:${key}`))
    return rng.int(min, max) / 100
  }
  return {
    upgrade: Object.fromEntries((['eng', 'mac', 'sup', 'inf', 'grn'] as Line[]).map(line => [line, draw(`upgrade:${line}`, 90, 110)])) as Record<Line, number>,
    illness: draw('illness'),
    events: draw('events'), extraEvents: draw('extra-events'), classEvents: draw('class-events'), family: draw('family'), questions: draw('questions'),
    support: draw('support'), interest: draw('interest'), wear: draw('wear'),
    insurance: draw('insurance'), centennial: draw('centennial'),
  }
}

export function annualPolicy(state: Pick<TeamState, 'seed' | 'cycles'>, policy: SuccessionPolicy, _year = state.cycles): SuccessionPolicy {
  // Annual risk increments are exact, not random: succession +0.25pp, mortality +0.2pp.
  // The illness penalty is an integer-% draw fixed for the team's journey, not rerolled each year.
  const illness = annualEconomy(state, 0).illness
  return { ...policy, maxChance: Math.min(.04, policy.maxChance), stepPerYear: .0025, illnessAdd: Math.round(policy.illnessAdd * illness * 100) / 100 }
}

export function annualBalance(state: Pick<TeamState, 'seed' | 'cycles'>, balance: Balance): Balance {
  const profile = annualEconomy(state, state.cycles + 1)
  const rate = (value: number, key: string) => annualWholeRate(state, value, key, state.cycles + 1)
  return { ...balance, debtInterest: rate(balance.debtInterest * profile.interest, 'interest'),
    conditionDecay: 1 - rate((1 - balance.conditionDecay) * profile.wear, 'wear'),
    yearEventChance: rate(balance.yearEventChance * profile.events, 'events'), yearExtraChance: rate(balance.yearExtraChance * profile.extraEvents, 'extra-events'),
    classEventChance: rate(balance.classEventChance * profile.classEvents, 'class-events'), questionChance: rate(balance.questionChance * profile.questions, 'questions') }
}
