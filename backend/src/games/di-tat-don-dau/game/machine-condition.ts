import { hashString, makeRng } from './rng'
import type { TeamState } from './types'

/** Integer percentage points; fixed for this CEO/year across reloads and previews. */
export function annualMachineWear(state: Pick<TeamState,'seed'|'cycles'>) {
  return makeRng(hashString(`machine-wear-v2:${state.seed}:${state.cycles+1}`)).int(5,10)/100
}

/** Lower bound is exclusive: e.g. 80% belongs to the 61–80 tier. */
export function machineHealth(condition: number) {
  const percent=Math.max(0,Math.min(100,condition*100))
  if(percent>80)return {speed:1,defectMin:0,defectMax:1}
  if(percent>60)return {speed:.9,defectMin:2,defectMax:4}
  if(percent>40)return {speed:.75,defectMin:5,defectMax:8}
  if(percent>20)return {speed:.55,defectMin:9,defectMax:15}
  if(percent>0)return {speed:.3,defectMin:16,defectMax:25}
  return {speed:0,defectMin:0,defectMax:0}
}

/** A stable, independent roll: viewing a forecast cannot alter the settled result. */
export function annualDefectPercent(state: Pick<TeamState,'seed'|'cycles'|'condition'>) {
  const health=machineHealth(state.condition)
  return makeRng(hashString(`machine-defects-v1:${state.seed}:${state.cycles+1}`)).int(health.defectMin,health.defectMax)
}
