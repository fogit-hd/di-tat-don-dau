import type { Balance, TeamState, ThemeDef } from './types'

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

/** Economy v2. These are distinct benefits, with diminishing returns rather than runaway multipliers. */
export function supplyBenefits(support: number) {
  return {
    inputDiscount: .30 * (1 - Math.exp(-.10 * Math.max(0, support))),
    disruptionProtection: .50 * (1 - Math.exp(-.12 * Math.max(0, support))),
  }
}

export function logisticsBenefits(infra: number) {
  return {
    logisticsDiscount: .30 * (1 - Math.exp(-.15 * Math.max(0, infra))),
    delivery: .90 + .10 * (1 - Math.exp(-.12 * Math.max(0, infra))),
  }
}

export function pollutionPricePenalty(pollution: number) {
  return clamp((pollution - 30) / 70, 0, 1) * .35
}

/** Shared by settlement and the server's investment forecast. No RNG or state mutation. */
export function productionPlan(state: TeamState, theme: ThemeDef, balance: Balance, now: number, outputNoise = 1, priceNoise = 1) {
  const operating = Math.min(state.machines, state.engineers / Math.max(1, theme.coefs.epl))
  const idle = Math.max(0, state.machines - operating)
  const staffMissing = Math.max(0, Math.ceil(state.machines * theme.coefs.epl - state.engineers))
  const tech = state.tech + operating * balance.techPerOperating + state.engineers * balance.techPerEngineer
  const emissions = operating * theme.coefs.emission * balance.emissionScale
  const treatment = state.green * balance.greenScrub
  const pollution = clamp(state.pollution * balance.pollutionRetain + emissions - treatment, 0, 100)
  const pricePenalty = pollutionPricePenalty(pollution)
  const supply = supplyBenefits(state.support)
  const logistics = logisticsBenefits(state.infra)
  let outputMul = 1, priceMul = 1, revenueMul = 1, costMul = 1
  for (const effect of state.effects) {
    if (effect.defer || ((effect.yearsLeft ?? 0) <= 0 && effect.endsAt <= now)) continue
    outputMul *= effect.outputMul
    priceMul *= effect.priceMul
    revenueMul *= effect.revenueMul ?? 1
    costMul *= effect.costMul ?? 1
  }
  // Pollution affects price once, never both price and manufactured output.
  const output = Math.max(0, operating * theme.coefs.baseOutput * (1 + tech * theme.coefs.tech) * outputNoise * outputMul)
  const sold = output * logistics.delivery
  const price = Math.max(0, theme.coefs.basePrice * priceNoise * priceMul * (1 - pricePenalty))
  const revenue = Math.max(0, sold * price * revenueMul)
  const baseCost = operating * theme.coefs.opex
  const inputCost = baseCost * .65 * (1 - supply.inputDiscount) * costMul
  const logisticsCost = baseCost * .20 * (1 - logistics.logisticsDiscount) * costMul
  const otherCost = baseCost * .15 * costMul
  const idleCost = idle * theme.coefs.idleCost * costMul
  const opex = inputCost + logisticsCost + otherCost + idleCost
  return {
    operating, idle, staffMissing, tech, emissions, treatment, pollution, pricePenalty,
    valuePenalty: pollution * balance.pollutionPenalty,
    retainedPollution: state.pollution * balance.pollutionRetain,
    currentValuePenalty: state.pollution * balance.pollutionPenalty,
    ...supply, ...logistics, output, sold, price, revenue, inputCost, logisticsCost, otherCost, idleCost, opex,
    net: revenue - opex,
  }
}

export type ProductionPlan = ReturnType<typeof productionPlan>

/** Legacy snapshots may predate the explicit bankruptcy flag. Zero cash alone is never bankruptcy. */
export function isBankrupt(state: TeamState) {
  return state.bankrupt === true || (state.stateAidEligible && state.succession?.outcome === 'bankrupt')
}
