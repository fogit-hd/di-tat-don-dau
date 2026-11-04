import { describe, expect, it } from 'vitest'
import { makeRng } from './rng'
import { buildThemes, pickFreshTheme, type ThemeBoard, type IndustryPart, type ScenarioPart } from './catalog'
import type { LineDef } from './types'

const lines: LineDef[] = [
  { id: 'eng', label: 'Người', hint: 'Nhân lực', log: '+{{hired}}' },
  { id: 'mac', label: 'Máy', hint: 'Máy', log: '+{{added}}' },
  { id: 'sup', label: 'Phụ', hint: 'Phụ', log: 'phụ' },
  { id: 'inf', label: 'Hạ tầng', hint: 'Hạ tầng', log: 'hạ tầng' },
  { id: 'grn', label: 'Sạch', hint: 'Môi trường', log: 'sạch' },
]

const industry: IndustryPart = {
  id: 'chip-ban-dan',
  name: 'Chip bán dẫn',
  unit: 'lô',
  art: 'cleanroom',
  sort: 1,
  role: 'Giám đốc',
  mission: 'Làm chip.',
  worker: 'kỹ sư',
  product: 'chip',
  leap: 'đóng gói',
  weak: 'phụ trợ yếu',
  epl: 1400,
  tech: 0.1,
  support: 0.1,
  infra: 0.1,
  emission: 1,
  baseOutput: 10,
  basePrice: 2,
  opex: 1,
  idleCost: 1,
  directions: [{ line: 'eng', label: 'Đào tạo kỹ sư bán dẫn', sort: 0 }],
  patterns: [{ pattern: 'Nhà máy {{region}}', sort: 0 }],
}

const base = {
  industries: [industry],
  regions: [
    { id: 'ha-noi', name: 'Hà Nội', sort: 1 },
    { id: 'bac-ninh', name: 'Bắc Ninh', sort: 2 },
  ],
  scales: [{ id: 'nha-may', name: 'Nhà máy', sort: 1, roleTemplate: '{{role}} tại {{region}}' }],
  contexts: [
    {
      id: 'khoi-nghiep',
      name: 'Khởi nghiệp',
      line: 'Dựng từ đầu.',
      sort: 1,
      start: { cashMul: 1, engineers: 10, machines: 0, pollution: 0, dependency: 0, condition: 1 },
    },
  ],
  lines,
  themeName: '{{scale}} {{industry}} · {{region}}',
  mission: '{{mission}} {{contextLine}}',
}

describe('buildThemes', () => {
  it('crosses industries, regions, scales and contexts into unique themes', () => {
    const themes = buildThemes({ ...base, scenarios: [] })
    expect(themes.map((item) => item.id)).toEqual(['chip-ban-dan.ha-noi.nha-may.khoi-nghiep', 'chip-ban-dan.bac-ninh.nha-may.khoi-nghiep'])
    expect(themes[0]?.role).toBe('Giám đốc tại Hà Nội')
    expect(themes[0]?.mission).toBe('Làm chip. Dựng từ đầu.')
    expect(themes[0]?.lines[0]?.label).toBe('Đào tạo kỹ sư bán dẫn')
    expect(themes[0]?.lines[4]?.label).toBe('Sạch')
    expect(themes[0]?.factoryName).toBe('Nhà máy Hà Nội')
  })

  it('lets a scenario row replace the role-play intro', () => {
    const scenarios: ScenarioPart[] = [
      {
        industryId: 'chip-ban-dan',
        regionId: null,
        scaleId: 'nha-may',
        contextId: 'khoi-nghiep',
        role: 'Chủ xưởng tại {{region}}',
        mission: 'Nhiệm vụ riêng ở {{factory}}',
        factoryName: null,
      },
    ]
    const themes = buildThemes({ ...base, scenarios })
    expect(themes[1]?.role).toBe('Chủ xưởng tại Bắc Ninh')
    expect(themes[1]?.mission).toBe('Nhiệm vụ riêng ở Nhà máy Bắc Ninh')
  })
})

describe('50-CEO theme assignment',()=>{
 it('assigns 50 distinct themes from a 64-theme board and finds the last unpicked theme after repeated collisions',()=>{
  const board:ThemeBoard={...base,industries:Array.from({length:64},(_,i)=>({...industry,id:`industry-${i}`})),regions:[base.regions[0]!],scales:[{...base.scales[0]!,capitalFactor:1}],scenarios:[],nameParts:[]}
  for(const seed of [1,5,32,1234,9999]){
   const used=new Set<string>(),rng=makeRng(seed)
   for(let i=0;i<50;i++){const theme=pickFreshTheme(board,rng,used);expect(used.has(theme.id)).toBe(false);used.add(theme.id)}
   expect(used.size).toBe(50)
  }
  const used=new Set(board.industries.slice(0,63).map(row=>`${row.id}.ha-noi.nha-may.khoi-nghiep.base.ten`))
  const repeated=makeRng(1);repeated.pick=((rows:unknown[])=>rows[0]) as typeof repeated.pick
  expect(pickFreshTheme(board,repeated,used).industryId).toBe('industry-63')
  used.add('industry-63.ha-noi.nha-may.khoi-nghiep.base.ten')
  expect(()=>pickFreshTheme(board,repeated,used)).toThrow('Hết chủ đề')
 })
})
