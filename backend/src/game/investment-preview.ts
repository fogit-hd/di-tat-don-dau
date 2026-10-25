import { invest, LINES, openYearEffects } from './engine'
import { annualEconomy } from './random-economy'
import { productionPlan } from './production'
import {investmentQuote} from './investment-pricing'
import type { Balance, Line, LineDef, TeamState, ThemeDef } from './types'

export function investmentPreviews(state: TeamState, theme: ThemeDef, balance: Balance, nextBalance: Balance, lines: LineDef[], prices: Partial<Record<Line, number>> | undefined, step: number, now: number) {
  return Object.fromEntries(LINES.map(line => {
    const base = prices?.[line] ?? step
    const efficiency = annualEconomy(state).upgrade[line]
    const choices = Object.fromEntries(([1, 5, 10, 'max',...(line==='eng'?['crew' as const]:[])] as const).map(quantity => {
      const {count,total,nextPrice} = investmentQuote(state,line,base,quantity,now)
      if (!count) return [quantity, null]
      // Preview unaffordable packages too, without mutating cash or relaxing the actual purchase endpoint.
      const result = invest({ ...state, cash: Math.max(state.cash, total) }, line, total, balance, lines, base, count, efficiency)
      if (!result.ok) return [quantity, null]
      const projected = { ...result.state, cash: state.cash - total }
      const plan = productionPlan(openYearEffects(projected, now + 1), theme, nextBalance, now + 1)
      const field = { eng: 'engineers', mac: 'machines', sup: 'support', inf: 'infra', grn: 'green' }[line] as 'engineers' | 'machines' | 'support' | 'infra' | 'green'
      return [quantity, {
        count, total, nextPrice, machineProgress: projected.machineProgress??0, gain: projected[field] - state[field], levelAfter: projected[field],
        pollutionNowAfter: projected.pollution, operating: plan.operating, idle: plan.idle,
        staffMissing: plan.staffMissing, idleCost: plan.idleCost, inputDiscount: plan.inputDiscount,
        disruptionProtection: plan.disruptionProtection, logisticsDiscount: plan.logisticsDiscount,
        delivery: plan.delivery, treatment: plan.treatment, pollution: plan.pollution,
        pricePenalty: plan.pricePenalty, net: plan.net,
      }]
    }))
    return [line, choices]
  }))
}
