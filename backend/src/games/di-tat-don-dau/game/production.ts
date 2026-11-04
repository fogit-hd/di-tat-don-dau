import {industryEconomy} from './industry-economy'
import {machineHealth} from './machine-condition'
import type { Balance, TeamState, ThemeDef } from './types'

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

/** Economy v2. These are distinct benefits, with diminishing returns rather than runaway multipliers. */
export function supplyBenefits(support: number, modern = false) {
  return {
    inputDiscount: .30 * (1 - Math.exp(-(modern?.35:.10) * Math.max(0, support))),
    disruptionProtection: .50 * (1 - Math.exp(-(modern?.25:.12) * Math.max(0, support))),
  }
}

export function logisticsBenefits(infra: number, modern = false) {
  return {
    logisticsDiscount: .30 * (1 - Math.exp(-(modern?.4:.15) * Math.max(0, infra))),
    delivery: .90 + .10 * (1 - Math.exp(-(modern?.35:.12) * Math.max(0, infra))),
  }
}

export function pollutionPricePenalty(pollution: number) {
  return clamp((pollution - 30) / 70, 0, 1) * .35
}

/** Shared by settlement and the server's investment forecast. No RNG or state mutation. */
export function productionPlan(state: TeamState, theme: ThemeDef, balance: Balance, now: number, outputNoise = 1, priceNoise = 1, defectPercent?: number) {
  const machines = Math.max(0,Math.floor(state.machines))
  const engineers = Math.max(0,Math.round(state.engineers))
  const modern=state.productionVersion===3
  const profile=industryEconomy(theme.industryId,state.companyProfile)
  const peoplePerMachine=modern?profile.crew:Math.max(1,theme.coefs.epl)
  const staffed = Math.min(machines,Math.floor(engineers / peoplePerMachine))
  const stopped = modern && state.condition<=0 ? staffed : 0
  const operating = staffed-stopped
  const idle = machines-staffed
  const staffMissing = Math.max(0, Math.ceil(machines * peoplePerMachine - engineers))
  const tech = modern ? Math.min(3,state.tech+(operating>0?.02:0)) : state.tech + operating * balance.techPerOperating + engineers * balance.techPerEngineer
  const workerBonus=modern?1+Math.min(5,state.workerSkill??0)*.05:1
  const machineBonus=modern?1+Math.min(5,state.machineQuality??0)*.08:1
  const health=modern?machineHealth(state.condition):{speed:1,defectMin:0,defectMax:0}
  const conditionFactor=health.speed
  const defectRatePct=clamp(Math.round(defectPercent??(health.defectMin+health.defectMax)/2),health.defectMin,health.defectMax)
  const techFactor=(1+tech*(modern?.1:theme.coefs.tech))*workerBonus*machineBonus*conditionFactor
  const baseOutput=modern?100:theme.coefs.baseOutput
  const entryCost=profile.prices.mac+profile.crew*profile.prices.eng
  const basePrice=modern?entryCost*.33/.9/100:theme.coefs.basePrice
  const emissions = operating * theme.coefs.emission * balance.emissionScale
  const treatment = state.green * balance.greenScrub
  const pollution = clamp(state.pollution * balance.pollutionRetain + emissions - treatment, 0, 100)
  const pricePenalty = pollutionPricePenalty(pollution)
  const supply = supplyBenefits(state.support,modern)
  const logistics = logisticsBenefits(state.infra,modern)
  let outputMul = 1, priceMul = 1, revenueMul = 1, costMul = 1
  const appliedEffects = state.effects.filter(effect => !effect.defer && ((effect.yearsLeft ?? 0) > 0 || effect.endsAt > now)).map(effect => ({
    id: effect.id, title: effect.title, icon: effect.icon || effect.visual, year: effect.year, yearsLeft: effect.yearsLeft ?? 0,
    outputMul: effect.outputMul, priceMul: effect.priceMul, revenueMul: effect.revenueMul ?? 1, costMul: effect.costMul ?? 1,
    cashPerYear: effect.cashPerYear ?? 0, investmentMul: effect.investmentMul ?? 1,
  }))
  for (const effect of state.effects) {
    if (effect.defer || ((effect.yearsLeft ?? 0) <= 0 && effect.endsAt <= now)) continue
    outputMul *= effect.outputMul
    priceMul *= effect.priceMul
    revenueMul *= effect.revenueMul ?? 1
    costMul *= effect.costMul ?? 1
  }
  // Pollution affects price once, never both price and manufactured output.
  const output = Math.max(0, Math.floor(operating * baseOutput * techFactor * outputNoise * outputMul+1e-9))
  const defective=Math.floor(output*defectRatePct/100+1e-9)
  const saleable=output-defective
  const sold = Math.min(saleable,Math.floor(saleable * logistics.delivery+1e-9))
  const price = Math.max(0, basePrice * priceNoise * priceMul * (1 - pricePenalty))
  const revenue = Math.max(0, sold * price * revenueMul)
  const baseCost = operating * (modern?entryCost*.11:theme.coefs.opex)
  const inputCost = baseCost * .65 * (1 - supply.inputDiscount) * costMul
  const logisticsCost = baseCost * .20 * (1 - logistics.logisticsDiscount) * costMul
  const otherCost = baseCost * .15 * costMul
  const idleCost = (idle+stopped) * (modern?profile.prices.mac*.005:theme.coefs.idleCost) * costMul
  const opex = inputCost + logisticsCost + otherCost + idleCost
  return {
    operating, idle, stopped, staffMissing, tech, emissions, treatment, pollution, pricePenalty,
    engineers, machines, engineersPerMachine: peoplePerMachine,
    workerBonus,machineBonus,conditionFactor,defective,saleable,defectRatePct,defectMin:health.defectMin,defectMax:health.defectMax,
    baseOutput, techFactor,
    basePrice, outputNoise, priceNoise, outputMul, priceMul, revenueMul, costMul,
    theoreticalOutput: operating * baseOutput * techFactor, appliedEffects,
    valuePenalty: pollution * balance.pollutionPenalty,
    retainedPollution: state.pollution * balance.pollutionRetain,
    currentValuePenalty: state.pollution * balance.pollutionPenalty,
    ...supply, ...logistics, output, sold, price, revenue, inputCost, logisticsCost, otherCost, idleCost, opex,
    net: revenue - opex,
  }
}

export type ProductionPlan = ReturnType<typeof productionPlan>
export type ProductionReport = ProductionPlan & {
  conditionBefore?: number; conditionAfter?: number; conditionWearPct?: number
  year: number; unit: string; inflation: number; inflationRate: number; interest: number; ongoing: number
}

/** Conditional range only: never samples the future RNG stream. */
export function productionForecast(state: TeamState, theme: ThemeDef, balance: Balance, now: number) {
  const expected = productionPlan(state, theme, balance, now)
  const bounds = (min: number,max: number) => {
    const low=Math.ceil(min*100-1e-8)/100, high=Math.floor(max*100+1e-8)/100
    return high>=low ? [low,high] : [Math.round((min+max)*50)/100,Math.round((min+max)*50)/100]
  }
  const [outputMin,outputMax]=bounds(balance.outputNoiseMin,balance.outputNoiseMax)
  const [priceMin,priceMax]=bounds(balance.priceNoiseMin,balance.priceNoiseMax)
  const low = productionPlan(state, theme, balance, now, outputMin, priceMin, expected.defectMax)
  const high = productionPlan(state, theme, balance, now, outputMax, priceMax, expected.defectMin)
  const inflationMul = state.effects.filter(e => !e.defer && ((e.yearsLeft ?? 0) > 0 || e.endsAt > now)).reduce((mul,e) => mul*e.inflationMul,1)
  const inflationMin = clamp(Math.floor(balance.inflationBase*inflationMul*balance.inflationNoiseMin*100+1e-8)/100,0,1)
  const inflationMax = clamp(Math.ceil(balance.inflationBase*inflationMul*balance.inflationNoiseMax*100-1e-8)/100,0,1)
  const interest = Math.min(0,state.cash)*balance.debtInterest
  const ongoing = expected.appliedEffects.reduce((sum,e) => sum+e.cashPerYear,0)
  return { expected, range: { outputMin:low.output, outputMax:high.output, soldMin:low.sold, soldMax:high.sold,
    priceMin:low.price, priceMax:high.price, revenueMin:low.revenue, revenueMax:high.revenue, netMin:low.net, netMax:high.net,
    outputNoiseMin:outputMin, outputNoiseMax:outputMax, priceNoiseMin:priceMin, priceNoiseMax:priceMax },
    interestRate:balance.debtInterest, interest, ongoing, inflationMin, inflationMax,
    cashMin:state.cash+low.net+interest+ongoing-Math.max(0,state.cash)*inflationMax,
    cashMax:state.cash+high.net+interest+ongoing-Math.max(0,state.cash)*inflationMin }
}

/** Legacy snapshots may predate the explicit bankruptcy flag. Zero cash alone is never bankruptcy. */
export function isBankrupt(state: TeamState) {
  return state.bankrupt === true || (state.stateAidEligible && state.succession?.outcome === 'bankrupt')
}
