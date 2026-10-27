import { beforeEach, describe, expect, it, vi } from 'vitest'
import { balance } from '../prisma/seed/balance'
import { LINES } from '../prisma/seed/rules'
import { createState } from './game/engine'
import { introRequestSchema } from './game/intro'
import { makeRng } from './game/rng'
import { annualEconomy } from './game/random-economy'
import type { ThemeDef } from './game/types'

const scenario = vi.hoisted(() => ({ family: false, outcome: 'steady' as 'steady' | 'bankrupt', noRisks: true, shared: false, inflation: false, strategic: false }))
const db = vi.hoisted(() => {
  let sequence = 0
  return {
    $transaction:vi.fn(async(queries:Promise<unknown>[])=>Promise.all(queries)),
    room: { create: vi.fn(async () => ({ id: `room-${++sequence}` })), findUnique: vi.fn(async () => null), findMany: vi.fn(async () => [] as unknown[]), update: vi.fn(async () => ({})) },
    participant: { deleteMany: vi.fn(async () => ({})), upsert: vi.fn(async () => ({})) },
    answer: { createMany: vi.fn(async () => ({})), findMany: vi.fn(async () => [] as unknown[]) },
  }
})
vi.mock('./prisma', () => ({ prisma: db }))
vi.mock('./game/catalog', async () => {
  const { balance } = await import('../prisma/seed/balance')
  const { LINES } = await import('../prisma/seed/rules')
  const {COMPANY_EVENTS}=await import('./game/company-events')
  return { catalog: () => ({ balance: { ...balance, yearEventChance: scenario.shared ? 2 : 0, inflationBase: scenario.inflation ? .02 : balance.inflationBase, classEventChance: scenario.shared ? 2 : 0, yearMaxEvents: 1, familyEventChance: scenario.family ? 2 : 0 }, lines: LINES, themeCount: 64, endings: [], traitCopy: [],
    familyEvents: scenario.family ? [{ id: 'retirement', trait: 'early_retirement', title: 'Nghỉ hưu sớm', body: '', weight: 1 }] : [],
    questions: [], events: [...(scenario.strategic?COMPANY_EVENTS:[]),{ id:'shared-cash',title:'Hỗ trợ chung',body:'Cấp vốn',weight:1,scope:'team',good:true,icon:'coins',visual:'supply_shock',exposure:'any',durationSec:[1,1],outputMul:[1,1],priceMul:[1,1],inflationMul:[1,1],cash:[100,100],yearSpan:1,
      choice:{timeoutIndex:0,options:[{id:'cash-choice',text:'Nhận',patch:{visual:'none',title:'Lựa chọn nhận tiền',body:'Đã nhận',exposure:'any',durationSec:[1,1],outputMul:[1,1],priceMul:[1,1],inflationMul:[1,1],cash:[50,50]}}]} }], successionReasons: [],
    heirOutcomes: [{ id: 'heir', outcomeType: scenario.outcome, industryId: null, contextId: null, label: scenario.outcome, detail: '', weight: 1, multiplier: scenario.outcome === 'bankrupt' ? 0 : 1, sort: 1 }],
    successionPolicy: { baseChance: scenario.noRisks ? 0 : .01, stepPerYear: .0025, maxChance: .3, longevityChance: 0, illnessAdd: .1, traitRules: {} } }), pickFreshTheme: vi.fn() }

})
import { buildSnapshot, confirmIntro, createRoom, getRoom, investLine, joinRoom, advanceTeamYear, restartTeam, startLoop, answerPrompt, dismissPrompt, tick, acknowledgeTutorial, startRoom, saveAvatar, bootRooms, endRoom } from './runtime'
import { TUTORIAL_ACTIONS, TUTORIAL_V2_ACTIONS } from './game/tutorial'

const factoryName = 'Hồng Hà Chế tạo máy công cụ (máy tiện, máy phay CNC)'
function theme(): ThemeDef {
  return {
    id: 'cnc', industryId: 'may-cong-cu', industryName: 'Chế tạo máy công cụ', name: 'Nhà máy CNC', factoryName,
    unit: 'máy', role: 'Giám đốc', mission: '', dirs: ['Nhân lực', 'Máy', 'Phụ trợ', 'Hạ tầng'], lines: LINES, art: '', anchors: null, eventIds: [],
    regionId: 'quang-ninh', regionName: 'Quảng Ninh', scaleId: 'vua', scaleName: 'Vừa', contextId: 'moi', contextName: 'Mới', vars: { factory: factoryName },
    coefs: { epl: 1000, tech: .1, support: .1, infra: .1, emission: 1, baseOutput: 10, basePrice: 2, opex: 1, idleCost: 1 },
    start: { cashMul: 1, engineers: 100, machines: 0, pollution: 0, dependency: 0, condition: 1 },
  }
}
async function roomWithTeam() {
  const created = await createRoom({ hostUserId: 'host', hostName: 'Chủ phòng', durationMin: 15, startingCapital: 10000, linePrices: { sup: 750 } })
  const player = await joinRoom(created.code, 'Đội trùng tên')
  const room = getRoom(created.code)!
  const team = room.teams[0]!
  team.theme = theme()
  team.state = createState(team.theme, 10000, makeRng(1), balance)
  return { ...created, player, room, team }
}

describe('room-scoped names and purchases', () => {
  beforeEach(() => { vi.clearAllMocks(); scenario.family = false; scenario.outcome = 'steady'; scenario.noRisks = true; scenario.shared = false; scenario.inflation = false })

  it('publishes the same upgrade draw used for the actual purchase and never rerolls snapshots', async () => {
    const a = await roomWithTeam()
    a.room.status = 'playing'
    await confirmIntro(a.code, a.player.playerToken, factoryName)
    const viewer = { role: 'player' as const, code: a.code, teamId: a.player.teamId }
    const before = buildSnapshot(a.room, viewer).you!.scene!
    expect(buildSnapshot(a.room, viewer).you!.scene!.upgradeEfficiency).toEqual(before.upgradeEfficiency)
    const rngBefore = a.team.state!.rng
    buildSnapshot(a.room, viewer)
    expect(a.team.state!.rng).toBe(rngBefore)
    await investLine(a.code, a.player.playerToken, 'sup')
    expect(a.team.state?.support).toBe(1)
    const after = buildSnapshot(a.room, viewer).you!.scene!
    expect(after.upgradeEfficiency).toEqual(before.upgradeEfficiency)
    expect(after.deathChance).toBe(before.deathChance)
    expect(after.annualConditions).toEqual(before.annualConditions)
  })

  it('allows repeated team/factory names while intro changes only the authenticated participant', async () => {
    const a = await roomWithTeam()
    const other = await joinRoom(a.code, 'Đội trùng tên')
    const b = await roomWithTeam()
    expect(a.player.teamName).toBe(b.player.teamName)
    expect(new Set([a.player.teamId, b.player.teamId, other.teamId]).size).toBe(3)
    expect(new Set([a.player.playerToken, b.player.playerToken, other.playerToken]).size).toBe(3)
    a.room.status = 'playing'; b.room.status = 'playing'
    const input = introRequestSchema.parse({ factoryName })
    await confirmIntro(a.code, a.player.playerToken, input.factoryName)
    expect(a.team.state?.factoryName).toBe(factoryName)
    expect(a.team.state?.introDone).toBe(true)
    expect(b.team.state?.introDone).toBe(false)
    await confirmIntro(b.code, b.player.playerToken, input.factoryName)
    expect(b.team.state?.factoryName).toBe(factoryName)
    await expect(confirmIntro(b.code, a.player.playerToken, 'Tên khác')).rejects.toMatchObject({ status: 403 })
    expect(db.participant.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { id: a.player.teamId }, create: expect.objectContaining({ roomId: a.room.id }) }))
    expect(db.participant.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { id: b.player.teamId }, create: expect.objectContaining({ roomId: b.room.id }) }))
  })

  it('uses the room base price for upgrade quantity and the event price only for the invoice', async () => {
    const a = await roomWithTeam()
    const b = await roomWithTeam()
    a.room.status = 'playing'; b.room.status = 'playing'
    await confirmIntro(a.code, a.player.playerToken, factoryName)
    a.team.state!.effects = [{ id: 'discount', visual: 'none', title: 'Ưu đãi', body: '', severity: 1, startedAt: 0, endsAt: 1, outputMul: 1, priceMul: 1, inflationMul: 1, yearsLeft: 2, investmentMul: .9 }]
    await investLine(a.code, a.player.playerToken, 'sup')
    expect(a.team.state?.cash).toBe(9100)
    expect(a.team.state?.support).toBeCloseTo(1, 8)
    expect(a.team.state?.pendingCauses?.at(-1)).toMatchObject({ kind: 'investment', cash: -900 })
    expect(b.team.state?.cash).toBe(10000)
    expect(b.team.state?.support).toBe(0)
  })

  it('buys 5/10 packages atomically and computes max using the live discounted invoice', async () => {
    const a = await roomWithTeam()
    a.room.status = 'playing'
    await confirmIntro(a.code, a.player.playerToken, factoryName)
    a.team.state!.effects = [{ id: 'discount', visual: 'none', title: 'Ưu đãi', body: '', severity: 1, startedAt: 0, endsAt: 1, outputMul: 1, priceMul: 1, inflationMul: 1, yearsLeft: 2, investmentMul: .9 }]
    const perPackage = 1
    await investLine(a.code, a.player.playerToken, 'sup', 5)
    expect(a.team.state?.cash).toBe(5140)
    expect(a.team.state?.support).toBeCloseTo(5 * perPackage, 8)
    await expect(investLine(a.code, a.player.playerToken, 'sup', 10)).rejects.toMatchObject({ status: 400 })
    expect(a.team.state?.cash).toBe(5140)
    expect(a.team.state?.support).toBeCloseTo(5 * perPackage, 8)
    await investLine(a.code, a.player.playerToken, 'sup', 'max')
    expect(a.team.state?.cash).toBe(604)
    expect(a.team.state?.support).toBeCloseTo(9 * perPackage, 8)
    await expect(investLine(a.code, a.player.playerToken, 'sup', 'max')).rejects.toMatchObject({ status: 400 })
    a.team.state!.cash = 20000
    await investLine(a.code, a.player.playerToken, 'sup', 10)
    expect(a.team.state?.cash).toBe(4520)
    expect(a.team.state?.support).toBeCloseTo(19 * perPackage, 8)
  })
})


describe('economic lifecycle regressions', () => {
  beforeEach(() => { vi.clearAllMocks(); scenario.family = false; scenario.outcome = 'steady'; scenario.noRisks = true; scenario.shared = false; scenario.inflation = false })
  async function playing() {
    const a = await roomWithTeam()
    a.room.status = 'playing'
    await confirmIntro(a.code, a.player.playerToken, factoryName)
    a.team.state!.yearLockUntil = 0
    a.team.state!.machines = 1
    a.team.state!.engineers = 1400
    return a
  }
  it('lets cash-zero and indebted companies produce, without granting restructuring eligibility', async () => {
    for (const cash of [0, -100]) {
      const a = await playing()
      a.team.state!.cash = cash
      await advanceTeamYear(a.code, a.player.playerToken)
      expect(a.team.state!.cycles).toBe(1)
      expect(a.team.state!.finished).toBe(false)
      expect(a.team.state!.stateAidEligible).toBe(false)
      expect(buildSnapshot(a.room, { role: 'player', code: a.code, teamId: a.player.teamId }).you!.scene!.bankrupt).toBe(false)
      await expect(restartTeam(a.code, a.player.playerToken)).rejects.toMatchObject({ status: 409 })
    }
  })
  it('pays life insurance into cash only on death, records it once and preserves the cash ledger', async () => {
    const a = await playing()
    a.team.state!.traits = ['life_insurance']
    a.room.debugForceDeath = true; a.room.debugDeathYear = 1
    await advanceTeamYear(a.code, a.player.playerToken)
    const state = a.team.state!
    const ledger = state.yearLedger[0]!
    const insurance = ledger.causes.filter(c => c.kind === 'insurance')
    expect(insurance).toHaveLength(1)
    expect(insurance[0]!.cash).toBeGreaterThan(0)
    expect(ledger.cashAfter - ledger.cashBefore).toBeCloseTo(ledger.causes.reduce((sum, c) => sum + c.cash, 0), 6)
    expect(a.team.score).toBe(state.succession!.assetsAfter)
    expect(state.succession!.assetsAfter - state.succession!.assetsBefore).toBeCloseTo(insurance[0]!.cash, 0)
    expect(state.finished).toBe(true)
    expect(state.nextYearAt).toBe(0)
    const cash = state.cash
    await expect(advanceTeamYear(a.code, a.player.playerToken)).rejects.toMatchObject({ status: 409 })
    await expect(restartTeam(a.code, a.player.playerToken)).rejects.toMatchObject({ status: 409 })
    expect(a.team.state!.cash).toBe(cash)
  })
  it('does not pay life insurance when the founder retires alive', async () => {
    scenario.family = true
    const a = await playing()
    a.team.state!.traits = ['life_insurance']
    await advanceTeamYear(a.code, a.player.playerToken)
    expect(a.team.state!.succession?.causeText).toBe('Nghỉ hưu sớm')
    expect(a.team.state!.yearLedger[0]!.causes.some(c => c.kind === 'insurance')).toBe(false)
    expect(a.team.state!.succession!.assetsAfter).toBe(a.team.state!.succession!.assetsBefore)
  })
  it('freezes true bankruptcy and permits an approved restart exactly once in the same industry', async () => {
    scenario.family = true; scenario.outcome = 'bankrupt'
    const a = await playing()
    a.team.state!.secondLife = 'available'
    await advanceTeamYear(a.code, a.player.playerToken)
    const state = a.team.state!
    expect(state.bankrupt).toBe(true); expect(state.finished).toBe(false)
    expect(state.nextYearAt).toBe(0); expect(state.machines).toBe(0); expect(a.team.score).toBe(0)
    const ledger = state.yearLedger[0]!
    expect(ledger.cashAfter - ledger.cashBefore).toBeCloseTo(ledger.causes.reduce((sum, c) => sum + c.cash, 0), 6)
    await expect(investLine(a.code, a.player.playerToken, 'sup')).rejects.toMatchObject({ status: 409 })
    await expect(advanceTeamYear(a.code, a.player.playerToken)).rejects.toMatchObject({ status: 409 })
    const industry = a.team.theme!.industryId
    await restartTeam(a.code, a.player.playerToken)
    expect(a.team.theme!.industryId).toBe(industry)
    expect(a.team.state!.secondLife).toBe('used'); expect(a.team.state!.cycles).toBe(0)
    expect(a.team.state!.stateAidEligible).toBe(false); expect(a.team.score).toBe(null)
    a.team.state!.yearLockUntil = 0
    await advanceTeamYear(a.code, a.player.playerToken)
    expect(a.team.state!.bankrupt).toBe(true); expect(a.team.state!.finished).toBe(true)
    await expect(restartTeam(a.code, a.player.playerToken)).rejects.toMatchObject({ status: 409 })
  })
  it('never auto-produces after bankruptcy, including a legacy state with a stale timer', async () => {
    const a = await playing()
    a.team.state!.stateAidEligible = true
    a.team.state!.succession = { causeText: '', outcome: 'bankrupt', outcomeLabel: '', outcomeDetail: '', assetsBefore: 1000, assetsAfter: 0, year: 0 }
    a.team.state!.nextYearAt = Date.now() - 1
    const cash = a.team.state!.cash
    vi.useFakeTimers()
    try {
      startLoop()
      await vi.advanceTimersByTimeAsync(1200)
      expect(a.team.state!.cycles).toBe(0); expect(a.team.state!.cash).toBe(cash)
    } finally { vi.clearAllTimers(); vi.useRealTimers() }
  })
  it.each(['eng','mac','sup','inf','grn'] as const)('matches %s receipts at every purchase quantity and includes deferred year effects', async (line) => {
    for (const quantity of [1,5,10,'max'] as const) {
      const a=await playing()
      a.team.state!.cash=20000
      a.team.state!.yearOpenCash=20000
      a.team.state!.pollution=65
      a.team.state!.effects=[{id:'known-shock',visual:'none',title:'',body:'',severity:1,startedAt:0,endsAt:1,outputMul:.8,priceMul:1,inflationMul:1,yearsLeft:2,defer:true,bornAt:Date.now()-10}]
      const viewer={role:'player' as const,code:a.code,teamId:a.player.teamId}
      const before=buildSnapshot(a.room,viewer).you!.scene!
      const preview=before.investmentPreviews![line][quantity]!
      if(quantity==='max'){expect(preview.total).toBeLessThanOrEqual(20000);expect(preview.total+preview.nextPrice).toBeGreaterThan(20000)}else expect(preview.count).toBe(quantity)
      await investLine(a.code,a.player.playerToken,line,quantity)
      const after=buildSnapshot(a.room,viewer).you!.scene!
      expect(after.cash).toBe(20000-preview.total)
      expect(after.operatingForecast.net).toBeCloseTo(preview.net,8)
      expect(after.operatingForecast.pollution).toBeCloseTo(preview.pollution,8)
      expect(after.operatingForecast.delivery).toBeCloseTo(preview.delivery,8)
    }
  })
  it('stores the actual production draw and separates inflation without changing total cash', async () => {
    scenario.inflation=true
    const a=await playing()
    await advanceTeamYear(a.code,a.player.playerToken)
    const row=a.team.state!.yearLedger[0]!
    const report=row.production!
    expect(report).toBeDefined()
    expect(report.output).toBe(a.team.state!.lastOutput)
    expect(report.revenue-report.opex).toBeCloseTo(report.net,10)
    expect(row.causes.find(c=>c.kind==='production')!.cash).toBe(report.net)
    expect(row.causes.filter(c=>c.kind==='inflation').reduce((sum,c)=>sum+c.cash,0)).toBeCloseTo(-report.inflation,10)
    expect(report.inflation).toBeGreaterThan(0)
    expect(row.causes.reduce((sum,c)=>sum+c.cash,0)).toBeCloseTo(row.cashAfter-row.cashBefore,8)
    const copy=JSON.stringify(report)
    a.team.state!.engineers+=10000
    a.team.state!.yearLockUntil=0
    await advanceTeamYear(a.code,a.player.playerToken)
    expect(JSON.stringify(a.team.state!.yearLedger[1]!.production)).toBe(copy)
  })
  it('accounts for question rewards exactly once across the next year boundary', async () => {
    const a=await playing()
    a.team.state!.pending={id:'q',kind:'question',phase:'open',title:'',body:'Câu hỏi',options:[{id:'yes',text:'Đúng'}],correctOptionId:'yes',explanation:'',expiresAt:Date.now()+10000}
    const before=a.team.state!.cash
    await answerPrompt(a.code,a.player.playerToken,'yes')
    const reward=a.team.state!.cash-before
    expect(reward).toBeGreaterThan(0)
    await expect(answerPrompt(a.code,a.player.playerToken,'yes')).rejects.toMatchObject({status:409})
    expect(a.team.state!.pendingCauses.filter(c=>c.kind==='quiz')).toHaveLength(1)
    await dismissPrompt(a.code,a.player.playerToken)
    await advanceTeamYear(a.code,a.player.playerToken)
    const row=a.team.state!.yearLedger[0]!
    expect(row.causes.find(c=>c.kind==='quiz')!.cash).toBe(reward)
    expect(row.causes.reduce((sum,c)=>sum+c.cash,0)).toBeCloseTo(row.cashAfter-row.cashBefore,8)
  })
  it('accounts for immediate choice cash on manual and timed-out choices without double counting', async () => {
    for(const timeout of [false,true]) {
      const a=await playing()
      a.team.state!.pending={id:'choice',kind:'choice',phase:'open',title:'',body:'',options:[{id:'cash-choice',text:'Nhận'}],explanation:'',eventId:'shared-cash',expiresAt:timeout?Date.now()-1:Date.now()+10000}
      if(!timeout) await answerPrompt(a.code,a.player.playerToken,'cash-choice')
      await advanceTeamYear(a.code,a.player.playerToken)
      const row=a.team.state!.yearLedger[0]!
      expect(row.causes.filter(c=>c.label==='Lựa chọn nhận tiền')).toHaveLength(1)
      expect(row.causes.reduce((sum,c)=>sum+c.cash,0)).toBeCloseTo(row.cashAfter-row.cashBefore,8)
    }
  })
  it('queues shared event cash in the receiving team ledger, not the originating team twice', async () => {
    scenario.shared=true
    const a=await playing()
    a.room.status='lobby'
    const joined=await joinRoom(a.code,'Đội thứ hai')
    a.room.status='playing'
    const other=a.room.teams.find(t=>t.id===joined.teamId)!
    other.theme=theme();other.state=createState(other.theme,10000,makeRng(4),balance);other.state.introDone=true;other.state.yearOpenCash=10000
    a.team.theme!.eventIds=['shared-cash']
    const before=other.state.cash
    await advanceTeamYear(a.code,a.player.playerToken)
    const received=other.state.cash-before
    expect(received).toBeGreaterThan(0)
    expect(other.state.pendingCauses.filter(c=>c.label==='Hỗ trợ chung')).toHaveLength(1)
    scenario.shared=false
    await advanceTeamYear(a.code,joined.playerToken)
    const row=other.state.yearLedger[0]!
    expect(row.causes.filter(c=>c.label==='Hỗ trợ chung')).toHaveLength(1)
    expect(row.causes.reduce((sum,c)=>sum+c.cash,0)).toBeCloseTo(row.cashAfter-row.cashBefore,8)
  })
  it('uses exactly the same projection for discounted bulk buys, including unaffordable previews', async () => {
    const a = await playing()
    a.team.state!.effects = [{ id:'discount', visual:'none', title:'', body:'', severity:1, startedAt:0, endsAt:1, outputMul:1, priceMul:1, inflationMul:1, yearsLeft:2, investmentMul:.9 }]
    const view = () => buildSnapshot(a.room, { role:'player', code:a.code, teamId:a.player.teamId }).you!.scene!
    const before = JSON.stringify(a.team.state)
    const preview = view().investmentPreviews!.eng[5]!
    expect(JSON.stringify(a.team.state)).toBe(before)
    await investLine(a.code, a.player.playerToken, 'eng', 5)
    expect(a.team.state!.cash).toBe(10000 - preview.total)
    expect(a.team.state!.engineers).toBeCloseTo(preview.levelAfter)
    expect(view().operatingForecast.net).toBeCloseTo(preview.net, 8)
    a.team.state!.cash = 1
    expect(view().investmentPreviews!.mac[10]!.count).toBe(10)
    expect(view().investmentPreviews!.mac.max).toBe(null)
    await expect(investLine(a.code, a.player.playerToken, 'mac', 10)).rejects.toMatchObject({ status:400 })
  })
})


describe('question protects the team year clock',()=>{
 it('does not replace an unanswered question at 60 seconds; resumes only after its result closes',async()=>{
  const a=await roomWithTeam();a.room.status='playing';await confirmIntro(a.code,a.player.playerToken,factoryName)
  const start=Date.now();a.room.endsAt=start+900000
  a.team.state!.nextYearAt=start+60000
  a.team.state!.pending={id:'original',kind:'question',phase:'open',title:'Câu hỏi',body:'Chưa trả lời',options:[{id:'yes',text:'Đúng'}],correctOptionId:'yes',explanation:'',expiresAt:start+50000}
  tick(a.room,start)
  await expect(advanceTeamYear(a.code,a.player.playerToken)).rejects.toMatchObject({status:409})
  tick(a.room,start+50000)
  expect(a.team.state!.pending).toMatchObject({id:'original',phase:'resolved'})
  tick(a.room,start+60000)
  expect(a.team.state!.cycles).toBe(0);expect(a.team.state!.pending!.id).toBe('original')
  expect(a.room.answers.filter(r=>r.questionId==='original')).toHaveLength(1)
  tick(a.room,start+62000)
  expect(a.team.state!.pending).toBeNull();expect(a.team.state!.nextYearAt).toBe(start+122000)
  expect(a.room.endsAt).toBe(start+900000)
  tick(a.room,start+121999);expect(a.team.state!.cycles).toBe(0)
  tick(a.room,start+122000);expect(a.team.state!.cycles).toBe(1)
 })
 it('rejects a late answer without paying any reward',async()=>{
  const a=await roomWithTeam();a.room.status='playing';await confirmIntro(a.code,a.player.playerToken,factoryName)
  a.team.state!.pending={id:'expired',kind:'question',phase:'open',title:'',body:'',options:[{id:'yes',text:'Đúng'}],correctOptionId:'yes',explanation:'',expiresAt:Date.now()-1}
  const cash=a.team.state!.cash
  await expect(answerPrompt(a.code,a.player.playerToken,'yes','stale-question')).rejects.toMatchObject({status:409})
  await expect(answerPrompt(a.code,a.player.playerToken,'not-in-options','expired')).rejects.toMatchObject({status:400})
  await expect(answerPrompt(a.code,a.player.playerToken,'yes')).rejects.toMatchObject({status:409})
  expect(a.team.state!.cash).toBe(cash);expect(a.team.state!.pending!.phase).toBe('resolved')
 })
})


describe('first-year advisor clock and required actions',()=>{
  it('enables the guide when a real new room begins, without changing the match duration',async()=>{
    vi.mocked((await import('./game/catalog')).pickFreshTheme).mockReturnValue(theme())
    const a=await roomWithTeam();await startRoom(a.code,a.hostToken)
    const start=a.room.countdownEndsAt!;tick(a.room,start)
    expect(a.team.state!.tutorial).toEqual({version:2,step:0,complete:false})
    expect(a.room.endsAt).toBe(start+a.room.durationSec*1000)
    await confirmIntro(a.code,a.player.playerToken,factoryName)
    expect(a.team.state!.nextYearAt).toBe(0)
  })

  async function guided(){
    const a=await roomWithTeam();a.team.state!.tutorial={version:1,step:0,complete:false};a.room.status='playing';a.room.endsAt=Date.now()+900000
    await confirmIntro(a.code,a.player.playerToken,factoryName);return a
  }
  it('persists HUD/tab visits in order and blocks future purchases or years without moving the room deadline',async()=>{
    const a=await guided(),deadline=a.room.endsAt
    expect(a.team.state!.nextYearAt).toBe(0);expect(a.team.state!.yearLockUntil).toBe(0)
    await expect(acknowledgeTutorial(a.code,a.player.playerToken,'cash')).rejects.toMatchObject({status:409})
    await expect(acknowledgeTutorial(a.code,a.player.playerToken,'cluster')).rejects.toMatchObject({status:400})
    await expect(investLine(a.code,a.player.playerToken,'mac')).rejects.toMatchObject({status:409})
    await expect(advanceTeamYear(a.code,a.player.playerToken)).rejects.toMatchObject({status:409})
    for(const action of TUTORIAL_ACTIONS.slice(0,TUTORIAL_ACTIONS.indexOf('cluster'))){
      await acknowledgeTutorial(a.code,a.player.playerToken,action)
      const step=a.team.state!.tutorial!.step
      await acknowledgeTutorial(a.code,a.player.playerToken,action)
      expect(a.team.state!.tutorial!.step).toBe(step)
      expect(buildSnapshot(a.room,{role:'player',code:a.code,teamId:a.player.teamId}).you!.scene!.tutorial).toEqual(a.team.state!.tutorial)
    }
    expect(db.participant.upsert).toHaveBeenLastCalledWith(expect.objectContaining({update:expect.objectContaining({state:expect.objectContaining({tutorial:expect.objectContaining({step:TUTORIAL_ACTIONS.indexOf('cluster')})})})}))
    await expect(investLine(a.code,a.player.playerToken,'eng','crew')).rejects.toMatchObject({status:409})
    await expect(investLine(a.code,a.player.playerToken,'mac',5)).rejects.toMatchObject({status:409})
    await investLine(a.code,a.player.playerToken,'mac',1)
    expect(a.team.state!.machines).toBe(1);expect(a.team.state!.tutorial!.step).toBe(TUTORIAL_ACTIONS.indexOf('crew'))
    await investLine(a.code,a.player.playerToken,'eng','crew')
    expect(a.team.state!.engineers).toBe(a.team.state!.crewSize);expect(a.team.state!.tutorial!.step).toBe(TUTORIAL_ACTIONS.indexOf('enterprise-ready'))
    await acknowledgeTutorial(a.code,a.player.playerToken,'enterprise-ready')
    await advanceTeamYear(a.code,a.player.playerToken)
    expect(a.team.state!.cycles).toBe(1);expect(a.team.state!.tutorial!.complete).toBe(false);expect(a.team.state!.nextYearAt).toBe(0);expect(a.team.state!.pending).toBeNull()
    await expect(advanceTeamYear(a.code,a.player.playerToken)).rejects.toMatchObject({status:409})
    const before=Date.now();await acknowledgeTutorial(a.code,a.player.playerToken,'complete')
    expect(a.team.state!.tutorial!.complete).toBe(true);expect(a.team.state!.nextYearAt).toBeGreaterThanOrEqual(before+a.room.cycleSeconds*1000)
    const next=a.team.state!.nextYearAt;await acknowledgeTutorial(a.code,a.player.playerToken,'complete');expect(a.team.state!.nextYearAt).toBe(next)
    expect(a.room.endsAt).toBe(deadline)
  })
  it('keeps the global match and other teams running while one player waits in the guide',async()=>{
    const a=await roomWithTeam(),joined=await joinRoom(a.code,'Đội khác'),other=a.room.teams.find(t=>t.id===joined.teamId)!,start=Date.now()
    a.team.state!.tutorial={version:1,step:0,complete:false};a.room.status='playing';a.room.endsAt=start+900000
    other.theme=theme();other.state=createState(other.theme,10000,makeRng(5),balance);other.state.introDone=true;other.state.nextYearAt=start+60000
    await confirmIntro(a.code,a.player.playerToken,factoryName)
    tick(a.room,start+61000)
    expect(a.team.state!.cycles).toBe(0);expect(a.team.state!.tutorial!.step).toBe(0);expect(other.state.cycles).toBe(1);expect(a.room.endsAt).toBe(start+900000)
    tick(a.room,start+900001);expect(a.room.status).toBe('ended')
  })
  it('handles resources received during the guide without requiring a duplicate purchase',async()=>{
    const a=await guided();a.team.state!.tutorial!.step=TUTORIAL_ACTIONS.indexOf('cluster')
    await expect(acknowledgeTutorial(a.code,a.player.playerToken,'confirm-existing-cluster')).rejects.toMatchObject({status:409})
    a.team.state!.machines=1;const cash=a.team.state!.cash
    await acknowledgeTutorial(a.code,a.player.playerToken,'confirm-existing-cluster')
    await expect(acknowledgeTutorial(a.code,a.player.playerToken,'confirm-existing-crew')).rejects.toMatchObject({status:409})
    a.team.state!.engineers=a.team.state!.crewSize!
    await acknowledgeTutorial(a.code,a.player.playerToken,'confirm-existing-crew')
    expect(a.team.state!.tutorial!.step).toBe(TUTORIAL_ACTIONS.indexOf('enterprise-ready'));expect(a.team.state!.cash).toBe(cash)
  })
  it('does not trap a low-capital team or grant it free funds',async()=>{
    const a=await guided();a.team.state!.tutorial!.step=TUTORIAL_ACTIONS.indexOf('cluster')
    await expect(acknowledgeTutorial(a.code,a.player.playerToken,'continue-without-purchase')).rejects.toMatchObject({status:409})
    a.team.state!.cash=1
    await acknowledgeTutorial(a.code,a.player.playerToken,'continue-without-purchase')
    expect(a.team.state!.cash).toBe(1);expect(a.team.state!.machines).toBe(0);expect(a.team.state!.tutorial!.step).toBe(TUTORIAL_ACTIONS.indexOf('enterprise-ready'))
  })
})

describe('CEO avatars remain separate from economic state',()=>{
 beforeEach(()=>{vi.clearAllMocks();scenario.family=false;scenario.noRisks=true})
 it('updates only the token owner and rejects paths, unknown options and foreign-room tokens',async()=>{
  const a=await roomWithTeam(),b=await roomWithTeam(),other=await joinRoom(a.code,'Đội trùng tên')
  const before=JSON.stringify(a.team.state),avatar={body:'curvy-female',skin:'deep',outfit:'engineer'}
  await saveAvatar(a.code,a.player.playerToken,avatar)
  expect(a.team.avatar).toEqual(avatar);expect(JSON.stringify(a.team.state)).toBe(before)
  expect(buildSnapshot(a.room,{role:'player',code:a.code,teamId:a.player.teamId}).you!.avatar).toEqual(avatar)
  expect(buildSnapshot(a.room,{role:'host',code:a.code}).leaderboard.find(r=>r.teamId===a.player.teamId)!.avatar).toEqual(avatar)
  expect(buildSnapshot(a.room,{role:'host',code:a.code}).teams.find(r=>r.id===other.teamId)!.avatar).not.toEqual(avatar)
  await expect(saveAvatar(b.code,a.player.playerToken,avatar)).rejects.toMatchObject({status:403})
  for(const bad of [{...avatar,body:'../../secret'},{...avatar,skin:'purple'},{...avatar,teamId:other.teamId}])await expect(saveAvatar(a.code,a.player.playerToken,bad)).rejects.toMatchObject({status:400})
  expect(a.team.avatar).toEqual(avatar)
 })
 it('persists through room reload, locks once countdown starts and includes avatar in saved results',async()=>{
  const a=await roomWithTeam(),avatar={body:'broad-male',skin:'honey',outfit:'founder'}
  const before=(db.room.update.mock.calls as unknown as [{data:Record<string,unknown>}][]).at(-1)![0]
  await saveAvatar(a.code,a.player.playerToken,avatar)
  const stored=(db.room.update.mock.calls as unknown as [{data:Record<string,unknown>}][]).at(-1)![0]
  expect((stored.data.meta as {avatars:Record<string,unknown>}).avatars[a.player.teamId]).toEqual(avatar)
  db.room.findMany.mockResolvedValueOnce([{...before.data,...stored.data,id:'restored',code:'AVTEST',seed:'restored',hostTokenHash:a.room.hostTokenHash,hostUserId:'host',participants:[{id:a.team.id,tokenHash:a.team.tokenHash,teamName:a.team.teamName,theme:a.team.theme,state:a.team.state,score:null,ending:null,connected:true}]}])
  await bootRooms();expect(getRoom('AVTEST')!.teams[0]!.avatar).toEqual(avatar)
  await startRoom(a.code,a.hostToken)
  await expect(saveAvatar(a.code,a.player.playerToken,{...avatar,outfit:'shirt'})).rejects.toMatchObject({status:409})
  a.room.status='playing';await endRoom(a.code,a.hostToken)
  expect(a.room.report!.teams[0]!.avatar).toEqual(avatar)
  expect(a.room.report!.teams[0]!.teamId).toBe(a.player.teamId)
 })
 it('keeps the last saved appearance when the metadata write fails',async()=>{
  const a=await roomWithTeam(),previous={...a.team.avatar!},state=JSON.stringify(a.team.state)
  db.room.update.mockRejectedValueOnce(new Error('Database unavailable'))
  await expect(saveAvatar(a.code,a.player.playerToken,{body:'slim-female',skin:'tan',outfit:'shirt'})).rejects.toThrow('Database unavailable')
  expect(a.team.avatar).toEqual(previous);expect(JSON.stringify(a.team.state)).toBe(state)
 })
})


describe('approved v2 tutorial and host lifecycle statuses',()=>{
 it('requires every actual purchase, protects retry, visits six stats, and starts only the year-two timer',async()=>{
  scenario.noRisks=true;scenario.family=false
  const a=await roomWithTeam();a.team.state!.tutorial={version:2,step:0,complete:false};a.room.status='playing';a.room.endsAt=Date.now()+900000
  await confirmIntro(a.code,a.player.playerToken,factoryName)
  const deadline=a.room.endsAt
  const purchases:Record<string, ['eng'|'mac'|'sup'|'inf'|'grn',1|'crew']>={cluster:['mac',1],crew:['eng','crew'],supply:['sup',1],infrastructure:['inf',1],green:['grn',1]}
  for(const action of TUTORIAL_V2_ACTIONS){
   const state=a.team.state!,step=state.tutorial!.step
   expect(state.nextYearAt).toBe(0)
   if(purchases[action]){
    await expect(acknowledgeTutorial(a.code,a.player.playerToken,action)).rejects.toMatchObject({status:400})
    const cash=state.cash,[line,quantity]=purchases[action]
    await investLine(a.code,a.player.playerToken,line,quantity)
    expect(a.team.state!.cash).toBeLessThan(cash)
    const after=a.team.state!.cash
    await expect(investLine(a.code,a.player.playerToken,line,quantity)).rejects.toMatchObject({status:409})
    expect(a.team.state!.cash).toBe(after)
   }else if(action==='year'){
    await advanceTeamYear(a.code,a.player.playerToken)
    expect(a.team.state!.cycles).toBe(1)
   }else await acknowledgeTutorial(a.code,a.player.playerToken,action)
   expect(a.team.state!.tutorial!.step).toBe(step+1)
  }
  expect(a.team.state!.tutorial!.complete).toBe(true)
  expect(a.team.state!.nextYearAt).toBeGreaterThan(Date.now()+59000)
  expect(a.room.endsAt).toBe(deadline)
  expect(a.team.state!.machines).toBe(1);expect(a.team.state!.engineers).toBe(a.team.state!.crewSize)
 })
 it('skips only an unaffordable v2 purchase without granting cash or resources',async()=>{
  const a=await roomWithTeam();a.team.state!.tutorial={version:2,step:TUTORIAL_V2_ACTIONS.indexOf('supply'),complete:false};a.team.state!.cash=1;a.team.state!.introDone=true;a.room.status='playing'
  const support=a.team.state!.support
  await acknowledgeTutorial(a.code,a.player.playerToken,'continue-without-purchase')
  expect(a.team.state!.tutorial!.step).toBe(TUTORIAL_V2_ACTIONS.indexOf('infrastructure'));expect(a.team.state!.cash).toBe(1);expect(a.team.state!.support).toBe(support)
 })
 it('keeps mortality, retirement, succession and restructuring distinct even for identical heir multipliers',async()=>{
  const a=await roomWithTeam(),state=a.team.state!
  const status=()=>buildSnapshot(a.room,{role:'host',code:a.code}).teams[0].playerStatus
  state.introDone=true;expect(status()).toBe('operating')
  state.finished=true;state.succession={causeText:'x',outcome:'steady',outcomeLabel:'x',outcomeDetail:'x',assetsBefore:1,assetsAfter:1,year:1}
  state.finishReason='mortality';expect(status()).toBe('deceased')
  state.finishReason='retirement';expect(status()).toBe('retired')
  state.finishReason='succession';expect(status()).toBe('transferred')
  state.bankrupt=true;state.finished=false;state.stateAidEligible=true;state.secondLife='available';expect(status()).toBe('restructuring')
  state.finished=true;expect(status()).toBe('bankrupt')
  state.bankrupt=false;state.stateAidEligible=false;state.finished=false;state.succession=null;state.finishReason=undefined;expect(status()).toBe('operating')
 })
})


describe('final quiz review and strategic settlement integration',()=>{
 beforeEach(()=>{vi.clearAllMocks();scenario.family=false;scenario.noRisks=true;scenario.shared=false;scenario.strategic=false;scenario.inflation=false})
 it('does not expose answer keys during play, then shows own selection and all host distributions',async()=>{
  const a=await roomWithTeam();a.room.status='playing';a.team.state!.introDone=true
  const make=(id:string)=>({id,kind:'question' as const,phase:'open' as const,title:'Câu hỏi',body:'Chọn một đáp án',options:['a','b','c','d'].map(id=>({id,text:'Đáp án '+id})),correctOptionId:'b',explanation:'B là đúng',expiresAt:Date.now()+100000,questionId:'sample'})
  a.team.state!.pending=make('first');await answerPrompt(a.code,a.player.playerToken,'a','first')
  const viewer={role:'player' as const,code:a.code,teamId:a.team.id}
  expect(buildSnapshot(a.room,viewer).you!.questionReview).toEqual([])
  expect(buildSnapshot(a.room,{role:'host',code:a.code}).room.questionStats[0]).not.toHaveProperty('options')
  a.team.state!.pending=make('second');await answerPrompt(a.code,a.player.playerToken,'b','second')
  a.team.state!.pending=make('timeout');await endRoom(a.code,a.hostToken)
  const self=buildSnapshot(a.room,viewer),host=buildSnapshot(a.room,{role:'host',code:a.code})
  expect(self.you!.questionReview).toHaveLength(3);expect(self.you!.questionReview[0].chosenOptionId).toBe('a');expect(self.you!.questionReview[1].correct).toBe(true);expect(self.you!.questionReview[2].chosenOptionId).toBeUndefined()
  expect(host.room.questionStats).toHaveLength(1);expect(host.room.questionStats[0]).toMatchObject({appearances:3,total:3,correct:1,unanswered:1})
  expect(host.room.questionStats[0]).toMatchObject({options:expect.arrayContaining([expect.objectContaining({id:'b',count:1,correct:true})])})
  const saved=(db.participant.upsert.mock.calls as unknown as [{update:{state:{questionHistory:unknown[]}}}][]).at(-1)![0].update.state
  expect(saved.questionHistory).toHaveLength(3)
 })
 it('queues a fast CEO event until the target next year, then settles both ledgers once',async()=>{
  scenario.strategic=true;scenario.shared=true
  try{
   const a=await roomWithTeam(),joined=await joinRoom(a.code,'Đối tác'),other=a.room.teams.find(t=>t.id===joined.teamId)!
   other.theme=theme();other.state=createState(other.theme,10000,makeRng(8),balance);other.state.introDone=true;other.state.cycles=3
   a.room.status='playing';a.team.state!.introDone=true;a.team.state!.cycles=30;a.team.state!.eventBag=['company-commission'];a.team.state!.seenEvents=(await import('./game/company-events')).COMPANY_EVENTS.map(e=>e.id);a.team.state!.machines=0;a.team.state!.engineers=0
   const before=other.state.cash,tier=JSON.stringify(other.state.investmentCounts)
   await advanceTeamYear(a.code,a.player.playerToken)
   expect(a.room.interactions).toHaveLength(1);expect(a.room.interactions![0]).toMatchObject({status:'pending',targetYear:4,originYear:31});expect(other.state.cash).toBe(before);expect(other.state.eventLog).toHaveLength(0)
   const actorView=()=>buildSnapshot(a.room,{role:'player',code:a.code,teamId:a.team.id}).you!.scene!
   const targetView=()=>buildSnapshot(a.room,{role:'player',code:a.code,teamId:other.id}).you!.scene!
   expect(actorView().pendingInteractions).toHaveLength(1);expect(targetView().pendingInteractions).toHaveLength(0)
   expect(a.team.state!.yearLedger[0].causes.find(c=>c.label==='Nhận hoa hồng giao dịch')!.cash).toBe(0)
   scenario.shared=false
   await advanceTeamYear(a.code,joined.playerToken)
   const row=a.room.interactions![0],paid=other.state!.yearLedger[0].causes.find(c=>c.label==='Nhận hoa hồng giao dịch')!,received=a.team.state!.pendingCauses.find(c=>c.label==='Nhận hoa hồng giao dịch')!
   expect(row.status).toBe('settled');expect(row.amount).toBeGreaterThan(0);expect(row.amount).toBeLessThanOrEqual(75);expect(paid.cash).toBe(-row.amount!);expect(received.cash).toBe(row.amount);expect(actorView().pendingInteractions).toHaveLength(0)
   expect(other.state!.eventLog.find(e=>e.eventId==='company-commission')!.year).toBe(4);expect(other.state!.eventLog[0].effect).toContain('Đã xử lý khi sang năm');expect(JSON.stringify(other.state!.investmentCounts)).toBe(tier)
   const ledger=other.state!.yearLedger[0];expect(ledger.cashBefore+ledger.causes.reduce((n,c)=>n+c.cash,0)).toBeCloseTo(ledger.cashAfter,8)
   other.state!.yearLockUntil=0;await advanceTeamYear(a.code,joined.playerToken)
   expect(a.team.state!.pendingCauses.filter(c=>c.label==='Nhận hoa hồng giao dịch')).toHaveLength(1)
   expect(other.state!.eventLog.filter(e=>e.eventId==='company-commission')).toHaveLength(1)
  }finally{scenario.strategic=false;scenario.shared=false}
 })
 it('draws exclusive rights, temporary scale effects and integer final claims through the annual event deck',async()=>{
  scenario.strategic=true;scenario.shared=true
  try{
   const {COMPANY_EVENTS}=await import('./game/company-events')
   const {strategicEligible}=await import('./game/strategic-events')
   for(const id of ['company-exclusive-technology','company-monopoly-scale','company-final-benchmark','company-final-levy']){
    const a=await roomWithTeam();a.room.status='playing';a.team.state!.introDone=true;a.team.state!.machines=3;a.team.state!.engineers=100;a.team.state!.eventBag=[id];a.team.state!.seenEvents=COMPANY_EVENTS.map(e=>e.id)
    await advanceTeamYear(a.code,a.player.playerToken)
    expect(a.team.state!.eventLog.some(e=>e.eventId===id)).toBe(true);expect(a.team.state!.seenEvents).toContain(id)
    if(id==='company-exclusive-technology'){expect(a.team.state!.exclusiveTechnology).toBe(true);expect(strategicEligible(id,a.team.state!,true)).toBe(false)}
    if(id==='company-monopoly-scale'){const effect=a.team.state!.effects.find(e=>e.eventId===id)!;expect(effect.revenueMul).toBeGreaterThanOrEqual(1.06);expect(effect.revenueMul).toBeLessThanOrEqual(1.12);expect(effect.costMul).toBeGreaterThanOrEqual(1.02);expect(effect.costMul).toBeLessThanOrEqual(1.05);expect(effect.defer).toBe(true)}
    if(id.startsWith('company-final-')){const claim=a.team.state!.finalClaims![0];expect(Number.isInteger(claim.percent)).toBe(true);expect(claim.percent).toBeGreaterThanOrEqual(id.endsWith('levy')?3:1);expect(claim.percent).toBeLessThanOrEqual(id.endsWith('levy')?8:3);expect(strategicEligible(id,a.team.state!,true)).toBe(false);expect(buildSnapshot(a.room,{role:'player',code:a.code,teamId:a.team.id}).you!.scene!.finalClaims).toEqual([claim])}
   }
  }finally{scenario.strategic=false;scenario.shared=false}
 })
 it('freezes a common baseline and records the final adjustment without paying again after reload',async()=>{
  const a=await roomWithTeam();a.room.status='playing';a.team.state!.finalClaims=[{eventId:'company-final-benchmark',title:'Thưởng',percent:3,basis:'richest',direction:1}]
  await endRoom(a.code,a.hostToken)
  const saved=a.team.state!.finalSettlement!;expect(saved.items).toHaveLength(1);expect(a.team.score).toBe(saved.before+saved.items[0].delta)
  await expect(endRoom(a.code,a.hostToken)).rejects.toMatchObject({status:409});expect(a.team.state!.finalSettlement).toEqual(saved)
  const self=buildSnapshot(a.room,{role:'player',code:a.code,teamId:a.team.id});expect(self.you!.finalSettlement).toEqual(saved);expect(a.room.report!.teams[0].value).toBe(Math.round(saved.after))
 })
})


describe('asynchronous CEO interaction persistence and finalization',()=>{
 beforeEach(()=>{vi.clearAllMocks();scenario.family=false;scenario.noRisks=true;scenario.shared=false;scenario.strategic=false;scenario.inflation=false})
 async function waiting(){
  const a=await roomWithTeam(),joined=await joinRoom(a.code,'CEO chậm'),target=a.room.teams.find(t=>t.id===joined.teamId)!
  target.theme=theme();target.state=createState(target.theme,10000,makeRng(8),balance);target.state.introDone=true;a.team.state!.introDone=true;a.room.status='playing'
  a.room.interactions=[{id:'transfer-one',eventId:'company-commission',title:'Nhận hoa hồng giao dịch',body:'Giao dịch chờ',originId:a.team.id,targetId:target.id,originYear:20,targetYear:1,percent:3,cap:75,createdAt:1,status:'pending'}]
  return {...a,joined,target}
 }
 it('settles pending fees at game end and explicitly records final settlement in both histories',async()=>{
  const a=await waiting(),before=a.team.state!.cash,targetBefore=a.target.state!.cash
  await endRoom(a.code,a.hostToken)
  expect(a.room.interactions![0]).toMatchObject({status:'settled',amount:75});expect(a.team.state!.cash).toBe(before+75);expect(a.target.state!.cash).toBe(targetBefore-75)
  for(const team of [a.team,a.target]){const event=team.state!.eventLog.find(e=>e.eventId==='company-commission')!;expect(event.effect).toContain('Quyết toán khi tổng kết');expect(event.effect).toContain('75 triệu');expect(event.year).toBe(team.state!.cycles)}
  expect(a.target.state!.cycles).toBe(0);const cash=a.target.state!.cash;tick(a.room,Date.now()+100000);expect(a.target.state!.cash).toBe(cash)
  await expect(endRoom(a.code,a.hostToken)).rejects.toMatchObject({status:409});expect(a.team.state!.cash).toBe(before+75)
 })
 it('persists the queue in room metadata and restores it without notifying the target early',async()=>{
  const a=await waiting();await confirmIntro(a.code,a.player.playerToken,factoryName)
  const persisted=(db.room.update.mock.calls as unknown as [{data:Record<string,unknown>}][]).at(-1)![0].data
  expect((persisted.meta as {interactions:unknown[]}).interactions).toEqual(a.room.interactions);expect(db.$transaction).toHaveBeenCalled()
  db.room.findMany.mockResolvedValueOnce([{...persisted,id:'restored',code:'ASYNC1',seed:'restored',hostTokenHash:a.room.hostTokenHash,hostUserId:'host',participants:[a.team,a.target].map(t=>({id:t.id,tokenHash:t.tokenHash,teamName:t.teamName,theme:t.theme,state:t.state,score:t.score,ending:t.ending,connected:true}))}])
  await bootRooms();const restored=getRoom('ASYNC1')!;expect(restored.interactions).toEqual(a.room.interactions);expect(restored.teams.find(t=>t.id===a.target.id)!.state!.eventLog).toHaveLength(0)
  await advanceTeamYear('ASYNC1',a.joined.playerToken);expect(restored.interactions![0].status).toBe('settled')
 })
 it('uses the current available cash without rerolling rates, and does not revive zero-value estates',async()=>{
  const a=await waiting();a.target.state!.cash=100;a.target.state!.yearOpenCash=100
  await advanceTeamYear(a.code,a.joined.playerToken)
  expect(a.room.interactions![0]).toMatchObject({status:'settled',percent:3,amount:3})
  const b=await waiting();b.team.state!.finished=true;b.team.score=0;const before=b.target.state!.cash
  await endRoom(b.code,b.hostToken);expect(b.room.interactions![0].status).toBe('cancelled');expect(b.target.state!.cash).toBe(before);expect(b.team.score).toBe(0);expect(b.target.state!.eventLog[0].effect).toContain('giao dịch hủy')
 })
 it('keeps the next-turn rule when restructuring has reset the target year counter',async()=>{
  const a=await waiting();a.room.interactions![0].targetYear=35
  await advanceTeamYear(a.code,a.joined.playerToken)
  expect(a.target.state!.cycles).toBe(1);expect(a.room.interactions![0].status).toBe('settled');expect(a.target.state!.eventLog.find(e=>e.eventId==='company-commission')!.year).toBe(1)
 })
 it('applies cash changes to a frozen positive estate without restarting its turn',async()=>{
  const a=await waiting();a.team.state!.finished=true;a.team.score=500
  await endRoom(a.code,a.hostToken);expect(a.team.score).toBe(575);expect(a.team.state!.finished).toBe(true);expect(a.team.state!.cycles).toBe(0)
 })
})


describe('patent expiry random right and final ranking transfer',()=>{
 beforeEach(()=>{vi.clearAllMocks();scenario.family=false;scenario.noRisks=true;scenario.shared=false;scenario.strategic=false;scenario.inflation=false})
 it('draws one saved integer right, transfers assets only at finalization and reverses ranks with matching histories',async()=>{
  scenario.strategic=true;scenario.shared=true
  try{
   const a=await roomWithTeam(),joined=await joinRoom(a.code,'CEO Bản quyền'),owner=a.room.teams.find(t=>t.id===joined.teamId)!
   owner.theme=theme();owner.state=createState(owner.theme,10000,makeRng(8),balance);owner.state.exclusiveTechnology=true;owner.state.cash=0;owner.state.machines=3;owner.state.engineers=100
   a.room.status='playing';a.team.state!.introDone=true;a.team.state!.eventBag=['company-patent-expiry'];a.team.state!.seenEvents=(await import('./game/company-events')).COMPANY_EVENTS.map(e=>e.id)
   await advanceTeamYear(a.code,a.player.playerToken)
   const claim=a.team.state!.patentLevy!;expect(claim).toBeDefined();expect(Number.isInteger(claim.percent)).toBe(true);expect(claim.percent).toBeGreaterThanOrEqual(1);expect(claim.percent).toBeLessThanOrEqual(3)
   const viewer={role:'player' as const,code:a.code,teamId:a.team.id};expect(buildSnapshot(a.room,viewer).you!.scene!.patentLevy).toEqual(claim);expect(owner.state.patentLevy).toBeUndefined();expect(owner.state.eventLog).toHaveLength(0)
   const savedClaim={...claim},rng=a.team.state!.rng;buildSnapshot(a.room,viewer);buildSnapshot(a.room,viewer);expect(a.team.state!.patentLevy).toEqual(savedClaim);expect(a.team.state!.rng).toBe(rng)
   a.team.state!.finished=true;a.team.score=9900;owner.state.finished=true;owner.score=10000
   const cashA=a.team.state!.cash,cashOwner=owner.state.cash,fee=10000*claim.percent/100
   expect(buildSnapshot(a.room,{role:'host',code:a.code}).leaderboard[0].teamId).toBe(owner.id)
   await endRoom(a.code,a.hostToken)
   expect(a.team.score).toBe(9900+fee);expect(owner.score).toBe(10000-fee);expect(a.team.state!.cash).toBe(cashA);expect(owner.state.cash).toBe(cashOwner)
   const snap=buildSnapshot(a.room,{role:'host',code:a.code});expect(snap.leaderboard[0].teamId).toBe(a.team.id);expect(a.room.report!.teams[0].teamId).toBe(a.team.id)
   const aItem=a.team.state!.finalSettlement!.items.find(i=>i.eventId==='company-patent-expiry')!,bItem=owner.state.finalSettlement!.items.find(i=>i.eventId==='company-patent-expiry')!
   expect(aItem.delta).toBe(fee);expect(bItem.delta).toBe(-fee);expect(aItem.receiptId).toBe(bItem.receiptId)
   for(const team of [a.team,owner]){const event=team.state!.eventLog.find(e=>e.eventId==='company-patent-expiry'&&e.effect.includes('Quyết toán khi tổng kết'))!;expect(event).toBeDefined();expect(event.effect).toContain('tài sản');expect(event.body).toContain('không trừ tiền mặt')}
   expect(db.$transaction).toHaveBeenCalled();await expect(endRoom(a.code,a.hostToken)).rejects.toMatchObject({status:409});expect(a.team.score).toBe(9900+fee)
  }finally{scenario.strategic=false;scenario.shared=false}
 })
 it('settles existing cash obligations first, then uses one baseline for the asset fee',async()=>{
  const a=await roomWithTeam(),joined=await joinRoom(a.code,'Chủ công nghệ'),owner=a.room.teams.find(t=>t.id===joined.teamId)!
  owner.theme=theme();owner.state=createState(owner.theme,10000,makeRng(8),balance);owner.state.exclusiveTechnology=true;owner.state.finished=true;owner.score=10000
  a.room.status='playing';a.team.state!.patentLevy={percent:3,year:1};a.team.state!.finished=true;a.team.score=9900
  a.room.interactions=[{id:'cash-first',eventId:'company-commission',title:'Hoa hồng',body:'',originId:a.team.id,targetId:owner.id,originYear:1,targetYear:1,percent:3,cap:75,createdAt:1,status:'pending'}]
  await endRoom(a.code,a.hostToken)
  const basis=10000-75,fee=basis*.03
  expect(a.team.score).toBeCloseTo(9900+75+fee,8);expect(owner.score).toBeCloseTo(basis-fee,8)
  expect(a.team.state!.finalSettlement!.items.find(i=>i.eventId==='company-patent-expiry')!.basis).toBe(basis)
  expect(a.team.score!+owner.score!).toBeCloseTo(19900,8)
 })
 it('restores the right from participant JSON without rerolling or inventing an expiration date',async()=>{
  const a=await roomWithTeam();a.room.status='playing';a.team.state!.patentLevy={percent:3,year:8};a.team.state!.exclusiveTechnology=true
  await confirmIntro(a.code,a.player.playerToken,factoryName)
  const stored=(db.room.update.mock.calls as unknown as [{data:Record<string,unknown>}][]).at(-1)![0].data
  db.room.findMany.mockResolvedValueOnce([{...stored,id:'patent-restored',code:'PATENT1',seed:'restore',hostTokenHash:a.room.hostTokenHash,hostUserId:'host',participants:[{id:a.team.id,tokenHash:a.team.tokenHash,teamName:a.team.teamName,theme:a.team.theme,state:JSON.parse(JSON.stringify(a.team.state)),score:null,ending:null,connected:true}]}])
  await bootRooms();const restored=getRoom('PATENT1')!;expect(restored.teams[0].state!.patentLevy).toEqual({percent:3,year:8});expect(restored.teams[0].state!.exclusiveTechnology).toBe(true)
  expect(buildSnapshot(restored,{role:'player',code:'PATENT1',teamId:a.team.id}).you!.scene!.patentLevy).toEqual({percent:3,year:8})
 })
})
