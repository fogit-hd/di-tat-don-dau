import rows from './company-events.data.json'
import { readStoredEffect } from './stored-effect'
import type { EventDef, TeamState } from './types'

/** Versioned bundled events supplement existing DB catalogs without reseeding a live room. */
export const COMPANY_EVENTS: EventDef[] = rows.map(row => ({
  id:row.id,industryId:null,scope:'team',weight:1,visual:row.visual,effectCode:row.visual,
  severity:1,good:row.good,icon:'engineersAdd' in row.effect||'workerSkill' in row.effect?'people':'green' in row.effect?'leaf':'infra' in row.effect?'truck':'support' in row.effect?'box':'wrench',title:row.title,body:row.body,exposure:'any',
  ...readStoredEffect(row.effect,row.id),yearSpan:row.id==='company-exclusive-technology'||row.id==='company-monopoly-scale'?2:0,
}))

export function companyEventPool(state: TeamState, existing: string[]) {
  if(state.productionVersion!==3)return existing.filter(id=>!id.startsWith('company-'))
  return [...new Set([...existing,...COMPANY_EVENTS.map(e=>e.id)])].filter(id=>{
    const event=COMPANY_EVENTS.find(e=>e.id===id)
    if(!event)return true
    if(event.engineersAdd && event.engineersAdd[1]<0 && state.engineers<1)return false
    if(event.workerSkill && state.engineers<1)return false
    if(event.machineQuality && state.machines<1)return false
    for(const key of ['support','infra','green','workerSkill','machineQuality'] as const){
      const range=event[key],level=state[key]??0
      if(range && (range[1]<0 ? level<=0 : (key==='workerSkill'||key==='machineQuality')&&level>=5))return false
    }
    if(event.conditionPct && (state.machines<1 || (event.conditionPct[1]<0 ? state.condition<=0 : state.condition>=1)))return false
    return true
  })
}
