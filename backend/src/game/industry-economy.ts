import type {Line,EffectPatch,TeamState,ThemeDef} from './types'

/** Authored game scenarios, not real-world staffing or equipment quotations.
 * slug: crew, recruitment, production unit, supply, logistics, clean technology (million VND).
 * Revenue is calibrated against the complete unit + crew, not against a lone button price.
 */
const rows: [string,number,number,number,number,number,number][] = [
 ['chip-ban-dan',4,90,500,140,180,130],['man-hinh',4,70,360,110,130,100],
 ['pin-lithium',5,65,360,110,150,140],['xe-dien',5,65,420,120,150,100],
 ['robot-cong-nghiep',3,85,420,100,120,80],['drone',3,70,280,85,100,65],
 ['vien-thong',3,75,320,100,140,65],['phan-mem-ai',3,100,250,70,100,50],
 ['trung-tam-du-lieu',3,90,450,110,200,130],['ve-tinh',4,100,550,140,170,90],
 ['thiet-bi-y-te',4,75,330,100,120,90],['linh-kien-dien-tu',4,60,280,90,110,85],
 ['thep',6,55,420,130,160,160],['xi-mang',6,45,360,100,150,160],
 ['dong-tau',6,60,480,140,200,130],['o-to',5,60,380,110,140,100],
 ['xe-may',5,50,260,85,110,80],['may-nong-nghiep',4,50,260,80,100,75],
 ['may-cong-cu',4,65,340,100,120,80],['hoa-chat',5,65,380,130,150,170],
 ['phan-bon',5,45,300,100,130,150],['loc-hoa-dau',6,75,550,170,220,200],
 ['nhom',5,55,350,110,140,150],['duong-sat',6,60,420,120,200,110],
 ['dat-hiem',6,65,450,140,180,180],['day-cap-dien',4,50,270,95,110,90],
 ['dien-mat-troi',3,60,300,90,150,70],['dien-gio',4,70,450,110,190,80],
 ['thuy-dien',4,65,420,100,200,110],['hydro-xanh',5,85,520,150,200,150],
 ['luoi-dien-thong-minh',4,80,400,120,210,80],['pin-luu-tru',4,65,340,105,150,120],
 ['lng-khi-dot',5,75,480,140,200,160],
 ['det-may',5,35,170,60,80,65],['da-giay',5,35,180,65,85,75],
 ['do-go',5,45,230,75,110,100],['nhua',4,40,220,80,90,110],
 ['giay',5,40,250,75,110,130],['gom-su',5,40,200,65,90,90],
 ['thuy-tinh',5,45,240,75,100,100],['do-choi',4,35,150,55,75,60],
 ['my-pham',4,55,230,90,90,85],['duoc-pham',5,85,400,130,150,120],
 ['thiet-bi-gia-dung',4,50,240,80,100,75],
 ['ca-phe',4,40,200,70,95,75],['cacao-chocolate',4,45,220,75,100,75],
 ['che',4,35,170,60,85,65],['gao',5,35,200,65,110,70],
 ['sua',5,50,280,90,140,100],['thuy-san',6,40,250,85,160,110],
 ['trai-cay-say',5,40,220,75,110,80],['hat-dieu',5,35,180,65,95,70],
 ['mia-duong',5,40,260,80,120,100],['nuoc-mam',5,35,170,60,90,80],
 ['bia-nuoc-giai-khat',5,50,300,90,130,100],['thuc-pham-dong-hop',5,45,270,85,130,95],
 ['nong-nghiep-cong-nghe-cao',4,55,280,95,140,90],['cao-su',5,40,250,80,110,120],
 ['cang-bien-logistics',6,55,400,110,220,100],['nha-tien-che',5,50,300,90,150,90],
 ['tai-che',5,40,230,75,100,130],['xu-ly-nuoc',4,60,320,100,160,140],
 ['in-3d',3,75,300,90,100,70],['hang-khong',5,90,550,150,220,120],
]
export const INDUSTRY_ECONOMY=Object.fromEntries(rows.map(([id,crew,eng,mac,sup,inf,grn])=>[id,{crew,prices:{eng,mac,sup,inf,grn} as Record<Line,number>}]))
export function industryEconomy(id: string, stored?: {crew:number;prices:Record<Line,number>}) {
  return stored??INDUSTRY_ECONOMY[id]??{crew:5,prices:{eng:50,mac:200,sup:75,inf:100,grn:60}}
}

/** Existing authored events describe old large workforces; preserve equivalent crew capacity. */
export function companyEventPatch(state: TeamState, theme: ThemeDef, patch: EffectPatch): EffectPatch {
  if(state.productionVersion!==3 || !patch.engineersAdd)return patch
  const ratio=industryEconomy(theme.industryId,state.companyProfile).crew/Math.max(1,theme.coefs.epl)
  return {...patch,engineersAdd:[patch.engineersAdd[0]*ratio,patch.engineersAdd[1]*ratio]}
}
