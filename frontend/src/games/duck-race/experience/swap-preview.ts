import { createExperienceGame } from './createExperienceGame'
import type { RaceSnapshot, RacerView } from '../contracts'

// Dev-only fixture using the live renderer and original dressed duck frames.
if (import.meta.env.DEV) {
  const started = performance.now()
  const button = document.querySelector<HTMLButtonElement>('#swap')!
  const status = document.querySelector<HTMLDivElement>('#state')!
  const players: RacerView[] = [
    { id: 'a', name: 'Nhóm A', points: 1200, color: 'green', y: 2 },
    { id: 'b', name: 'Nhóm B', points: 800, color: 'purple', y: 4 },
  ].map((p, i) => ({ ...p, color: i ? 'purple' : 'green', rank: i + 1, model: 'duckee', scoreEvents: [], cosmetics: { glasses: 'brass', scarf: 'red' },
    progress:p.points,target:p.points,x:p.points*3.2,lateral:0,facingX:1,facingY:0,connected:true,correct:0,answered:0,
    speed:140,rolling:false,rollReadyAt:0,jumpUntil:0,crouching:false,attackingUntil:0,invulnerableUntil:0,
    stunnedUntil:0,shield:0,discount:0,tailwind:0 }))
  const snapshot: RaceSnapshot = {
    code: 'SWAPTEST', mode: 'quiz-v4', phase: 'racing', duration: 480000,
    serverTime: 0, startedAt: 0, endsAt: 480000, players, hazards: [], logs: [], questionCount: 30,
    experience: { elapsed: 0, paused: false, era: 0, capacity: 7 }, storage: 'memory',
  }
  createExperienceGame(document.querySelector<HTMLDivElement>('#race')!, 'race', () => ({
    snapshot, now: performance.now() - started, host: true, reduced: false,
  }), {
    ready: () => { button.disabled = false; status.textContent = 'Nhóm A 1.200 điểm · Nhóm B 800 điểm' },
    error: text => { status.textContent = text },
    chest: () => {},
  })
  button.onclick = () => {
    const [a, b] = players, at = performance.now() - started, swapId = crypto.randomUUID()
    const before = [a.points, b.points]
    const depths = [a.y, b.y]
    for (const [i, p] of players.entries()) {
      const after = before[1 - i]
      p.points = after
      p.y = depths[1 - i]
      p.scoreEvents = [{ seq: (p.scoreEvents?.at(-1)?.seq ?? 0) + 1, at, before: before[i], after,
        delta: after - before[i], reason: 'Hoán đổi vị trí', fx: 'swap', peerId: players[1 - i].id, swapId, fromY: depths[i], toY: p.y }]
    }
    snapshot.players = [...players].sort((x, y) => y.points - x.points)
    snapshot.players.forEach((p, i) => { p.rank = i + 1 })
    status.textContent = `Nhóm A ${a.points} điểm · Nhóm B ${b.points} điểm`
  }
  document.querySelector<HTMLButtonElement>('#reset')!.onclick = () => location.reload()
}
