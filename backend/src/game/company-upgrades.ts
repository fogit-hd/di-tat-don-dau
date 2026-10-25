import {industryEconomy} from './industry-economy'
import { investmentPrice, openYearEffects } from './engine'
import { productionPlan } from './production'
import type { Balance, TeamState, ThemeDef } from './types'

export type CompanyUpgrade = 'training' | 'modernization' | 'maintenance'
export const COMPANY_UPGRADES: CompanyUpgrade[] = ['training','modernization','maintenance']

/** A fleet-wide improvement: price follows the fleet it improves, not just the button count. */
export function companyUpgradePreview(state: TeamState, theme: ThemeDef, balance: Balance, kind: CompanyUpgrade, now: number) {
  const level = kind==='training' ? state.workerSkill??0 : kind==='modernization' ? state.machineQuality??0 : 0
  const profile=industryEconomy(theme.industryId,state.companyProfile)
  const operating=Math.min(Math.floor(state.machines),Math.floor(state.engineers/profile.crew))
  const reason = kind==='maintenance' ? state.machines<1 ? 'Cần có máy trước khi bảo dưỡng' : state.condition>=.99 ? 'Máy đang ở tình trạng tốt' : ''
    : operating<3 ? 'Mở khi có 3 máy đang vận hành' : level>=5 ? 'Đã đạt cấp tối đa' : ''
  const base = kind==='training' ? (20+state.engineers*profile.prices.eng*.10)*(1+level*.6)
    : kind==='modernization' ? (50+state.machines*profile.prices.mac*.12)*(1+level*.6)
    : 15+state.machines*profile.prices.mac*.025
  const price=investmentPrice(state,Math.ceil(base),now)
  const next={...state,cash:state.cash-price}
  if(kind==='training')next.workerSkill=level+1
  else if(kind==='modernization')next.machineQuality=level+1
  else next.condition=1
  const before=productionPlan(openYearEffects(state,now+1),theme,balance,now+1)
  const after=productionPlan(openYearEffects(next,now+1),theme,balance,now+1)
  return {kind,level,levelAfter:kind==='maintenance'?0:level+1,price,locked:Boolean(reason),reason,
    outputBefore:before.output,outputAfter:after.output,netBefore:before.net,netAfter:after.net,
    conditionBefore:state.condition,conditionAfter:next.condition}
}

export function upgradeCompany(state: TeamState, theme: ThemeDef, balance: Balance, kind: CompanyUpgrade, now: number) {
  const preview=companyUpgradePreview(state,theme,balance,kind,now)
  if(state.finished || state.bankrupt)return {ok:false as const,error:'Doanh nghiệp đã dừng hoạt động'}
  if(preview.locked)return {ok:false as const,error:preview.reason}
  if(state.cash<preview.price)return {ok:false as const,error:'Không đủ vốn'}
  const label={training:'Đào tạo tay nghề',modernization:'Cải tiến máy',maintenance:'Bảo dưỡng máy'}[kind]
  const next={...state,cash:state.cash-preview.price,
    workerSkill:kind==='training'?preview.levelAfter:state.workerSkill??0,
    machineQuality:kind==='modernization'?preview.levelAfter:state.machineQuality??0,
    condition:preview.conditionAfter,
    pendingCauses:[...(state.pendingCauses??[]),{kind:'investment' as const,label,cash:-preview.price,packages:1,cashBefore:state.cash,cashAfter:state.cash-preview.price,
      detail:`${label} · sản lượng dự kiến ${preview.outputBefore} → ${preview.outputAfter} · lãi sản xuất ${preview.netBefore.toFixed(2)} → ${preview.netAfter.toFixed(2)} triệu/năm`}],
    log:[`${label} · cấp ${preview.levelAfter || 'bảo dưỡng hoàn tất'}`,...state.log].slice(0,balance.logLimit)}
  return {ok:true as const,state:next}
}
