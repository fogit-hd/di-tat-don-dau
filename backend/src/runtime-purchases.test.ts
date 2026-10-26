import { beforeEach, describe, expect, it, vi } from 'vitest'
import { balance } from '../prisma/seed/balance'
import { LINES } from '../prisma/seed/rules'
import { createState } from './game/engine'
import { introRequestSchema } from './game/intro'
import { makeRng } from './game/rng'
import { annualEconomy } from './game/random-economy'
import type { ThemeDef } from './game/types'

const scenario = vi.hoisted(() => ({ family: false, outcome: 'steady' as 'steady' | 'bankrupt', noRisks: true, shared: false, inflation: false }))
const db = vi.hoisted(() => {
  let sequence = 0
  return {
    room: { create: vi.fn(async () => ({ id: `room-${++sequence}` })), findUnique: vi.fn(async () => null), update: vi.fn(async () => ({})) },
    participant: { deleteMany: vi.fn(async () => ({})), upsert: vi.fn(async () => ({})) },
    answer: { createMany: vi.fn(async () => ({})) },
  }
})
vi.mock('./prisma', () => ({ prisma: db }))
vi.mock('./game/catalog', async () => {
  const { balance } = await import('../prisma/seed/balance')
  const { LINES } = await import('../prisma/seed/rules')
  return { catalog: () => ({ balance: { ...balance, yearEventChance: scenario.shared ? 2 : 0, inflationBase: scenario.inflation ? .02 : balance.inflationBase, classEventChance: scenario.shared ? 2 : 0, yearMaxEvents: 1, familyEventChance: scenario.family ? 2 : 0 }, lines: LINES, themeCount: 64, endings: [], traitCopy: [],
    familyEvents: scenario.family ? [{ id: 'retirement', trait: 'early_retirement', title: 'Nghỉ hưu sớm', body: '', weight: 1 }] : [],
    questions: [], events: [{ id:'shared-cash',title:'Hỗ trợ chung',body:'Cấp vốn',weight:1,scope:'team',good:true,icon:'coins',visual:'supply_shock',exposure:'any',durationSec:[1,1],outputMul:[1,1],priceMul:[1,1],inflationMul:[1,1],cash:[100,100],yearSpan:1,
      choice:{timeoutIndex:0,options:[{id:'cash-choice',text:'Nhận',patch:{visual:'none',title:'Lựa chọn nhận tiền',body:'Đã nhận',exposure:'any',durationSec:[1,1],outputMul:[1,1],priceMul:[1,1],inflationMul:[1,1],cash:[50,50]}}]} }], successionReasons: [],
    heirOutcomes: [{ id: 'heir', outcomeType: scenario.outcome, industryId: null, contextId: null, label: scenario.outcome, detail: '', weight: 1, multiplier: scenario.outcome === 'bankrupt' ? 0 : 1, sort: 1 }],
    successionPolicy: { baseChance: scenario.noRisks ? 0 : .01, stepPerYear: .0025, maxChance: .3, longevityChance: 0, illnessAdd: .1, traitRules: {} } }), pickFreshTheme: vi.fn() }

})
import { buildSnapshot, confirmIntro, createRoom, getRoom, investLine, joinRoom, advanceTeamYear, restartTeam, startLoop, answerPrompt, dismissPrompt, tick, acknowledgeTutorial, startRoom } from './runtime'
import { TUTORIAL_ACTIONS } from './game/tutorial'

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
    expect(a.team.state!.tutorial).toEqual({version:1,step:0,complete:false})
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
