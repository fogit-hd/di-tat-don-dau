import { randomBytes, randomInt, randomUUID } from 'node:crypto'
import { CARDS, DUCK_COLORS, EQUIPMENT, gearStats, flightHeight, type GearId, type CardKind, type DuckColor, type HazardView, type RaceLog, type RacePhase, type RaceSnapshot, type AnswerView } from './contracts'
import { QUESTIONS } from '../../shared/questions/bank'
import { roadPosition, trackPoint, STEP_PX, ROAD_Y, ROAD_HALF_WIDTH, WORLD, terrainAt, obstaclePoint } from './track'
import { DuckMotor, spawnObstacles, obstacleCollision, clearsObstacle } from './motor'

export const RULES = { duration: 600_000, questionMs: 20_000, feedbackMs: 3_500, track: 100, capacity: 50, tickMs: 50, walkSpeed: 96, rollSpeed: 390, inputTimeout: 400, jumpMs: 1100, jumpCooldown: 0 }
export class RaceError extends Error { constructor(message: string, public status = 400) { super(message) } }
export type Racer = {
  id: string; token: string; name: string; color: DuckColor; model: 'duckee' | 'ducky'; points: number;
  progress: number; target: number; connected: boolean; correct: number; answered: number;
  stunnedUntil: number; shield: number; discount: number; tailwind: number; finishedAt?: number; capturedAt?:number; capturedBy?:string;
  deck: number[]; cursor: number; questionAt: number; answer?: AnswerView; starUsed: boolean; starArmed: boolean; stake: number;
  cards: CardKind[]; nextCard: number; hit: string[]; logs: RaceLog[];
  lateral: number; inputX: number; inputY: number; inputUntil: number; speed: number; rolling: boolean; rollReadyAt: number;
  x: number; y: number; facingX: number; facingY: number; rollRemaining: number; crouching: boolean; jumpUntil: number; jumpReadyAt: number;
  gearHead?:GearId;gearBody?:GearId;mode?:'ground'|'water'|'mud';jumpCount?:number;jumpStartedAt?:number;jumpDuration?:number;jumpFrom?:number;firstJumpAt?:number;airSpeed?:number;guardHeld?:boolean;guardUntil?:number;parryUntil?:number;attackStyle?:'idle'|'run'|'air';recoveryUntil?:number;knockUntil?:number;knockStart?:number;knockFromX?:number;knockFromY?:number;knockToX?:number;knockToY?:number;
  attackingUntil: number; attackReadyAt: number; invulnerableUntil: number; jumpQueued?: boolean;
}
export type RaceRoom = {
  code: string; hostToken: string; phase: RacePhase; createdAt: number; startedAt: number; endsAt: number;
  duration: number; lastTick: number; lastSpawn: number; players: Racer[]; hazards: HazardView[]; courseVersion?:number;
  logs: RaceLog[]; winnerId?: string; finishReason?: 'finish' | 'time' | 'host'; storage: 'memory' | 'redis'; revision?: number
}
const bank = QUESTIONS.filter(q => q.options.length === 4)
const motor = new DuckMotor()
const token = () => randomBytes(24).toString('hex')
const shuffle = () => { const deck = bank.map((_, i) => i); for (let i = deck.length - 1; i > 0; i--) { const j = randomInt(i + 1); [deck[i], deck[j]] = [deck[j], deck[i]] } return deck }
function log(room: RaceRoom, player: Racer | null, text: string, kind: RaceLog['kind'], now: number) {
  const item = { id: randomUUID(), at: now, text, kind }; room.logs.unshift(item); room.logs.length = Math.min(room.logs.length, 100)
  if (player) { player.logs.unshift(item); player.logs.length = Math.min(player.logs.length, 300) }
}
export function createRace(now = Date.now()): RaceRoom {
  const code = `D${randomBytes(3).toString('hex').toUpperCase()}`
  const hazards = spawnObstacles(parseInt(code.slice(1),16) || 1)
  return { code, hostToken: token(), phase: 'lobby', createdAt: now,
    startedAt: 0, endsAt: 0, duration: RULES.duration, lastTick: now, lastSpawn: now, players: [], hazards, courseVersion:3, logs: [], storage: 'memory' }
}
/** Upgrade persisted courses without changing player funds, progress or room identity. */
export function ensureObstacleCourse(room:RaceRoom){
  if(room.courseVersion===3||room.phase==='finished')return
  room.hazards=spawnObstacles(parseInt(room.code.slice(1),16)||1)
  room.courseVersion=3
}
export function joinRace(room: RaceRoom, name: string, color: string, model: string, now = Date.now()) {
  if (room.phase !== 'lobby') throw new RaceError('Ván đua đã bắt đầu. Hãy tham gia phòng mới.')
  name = name.normalize('NFC').trim()
  if (!name || [...name].length > 32) throw new RaceError('Tên cần từ 1 đến 32 ký tự.')
  if (room.players.length >= RULES.capacity) throw new RaceError('Phòng đã đủ 50 người chơi.')
  const start = trackPoint(0, (room.players.length*37%140)-70)
  const p: Racer = { id: randomUUID(), token: token(), name, color: DUCK_COLORS.includes(color as DuckColor) ? color as DuckColor : 'yellow', model: model === 'ducky' ? 'ducky' : 'duckee', points: 0,
    progress: 0, target: 0, connected: true, correct: 0, answered: 0, stunnedUntil: 0, shield: 0, discount: 0, tailwind: 0,
    deck: shuffle(), cursor: 0, questionAt: 0, starUsed: false, starArmed: false, stake: 0, cards: [], nextCard: randomInt(3, 6), hit: [], logs: [],
    lateral: start.y - trackPoint(0).y, inputX: 0, inputY: 0, inputUntil: 0, speed: 0, rolling: false, rollReadyAt: 0,
    x: start.x, y: start.y, facingX: 1, facingY: 0, rollRemaining: 0, crouching: false, jumpUntil: 0, jumpReadyAt: 0,
    attackingUntil: 0, attackReadyAt: 0, invulnerableUntil: 0 }
  room.players.push(p); log(room, p, `${name} đã vào đường đua.`, 'system', now); return p
}
export function startRace(room: RaceRoom, now = Date.now()) {
  if (room.phase !== 'lobby') throw new RaceError('Phòng không còn ở sảnh chờ.')
  if (!room.players.length) throw new RaceError('Cần ít nhất một người chơi.')
  room.phase = 'countdown'; room.startedAt = now + 3000; room.endsAt = room.startedAt + room.duration; room.lastTick = now
  room.lastSpawn = room.startedAt; for (const p of room.players) p.questionAt = room.startedAt
}
export function ranking(room: RaceRoom) {
  return [...room.players].sort((a, b) => {
    if (a.finishedAt || b.finishedAt) return (a.finishedAt ?? Infinity) - (b.finishedAt ?? Infinity)
    if (room.phase === 'finished') return b.points - a.points || b.progress - a.progress || b.correct - a.correct || a.id.localeCompare(b.id)
    return b.progress - a.progress || b.points - a.points || a.id.localeCompare(b.id)
  })
}
export function finishRace(room: RaceRoom, reason: RaceRoom['finishReason'], now = Date.now()) {
  if (room.phase === 'finished') return
  room.phase = 'finished'; room.finishReason = reason; room.winnerId = ranking(room)[0]?.id
  log(room, null, reason === 'finish' ? 'Đã có vịt cán đích!' : reason === 'time' ? 'Hết 10 phút. Chốt quỹ dự trữ.' : 'Chủ phòng đã kết thúc ván đua.', 'system', now)
}
function ensureRacing(room: RaceRoom, now: number) { tickRace(room, now); if (room.phase !== 'racing') throw new RaceError('Ván đua chưa bắt đầu hoặc đã kết thúc.') }
function ensureActive(p:Racer){if(p.capturedAt)throw new RaceError('Vịt đã bị bắt. Điểm đã chốt; bạn có thể xem cuộc đua tiếp tục.')}
function question(p: Racer) { return bank[p.deck[p.cursor % p.deck.length]] }
export function armStar(room: RaceRoom, p: Racer, now = Date.now()) {
  ensureRacing(room, now); ensureActive(p)
  if (p.answer || p.starUsed || p.starArmed) throw new RaceError('Ngôi sao chỉ dùng một lần, trước khi trả lời.')
  if (p.points < 100) throw new RaceError('Cần ít nhất 100 điểm để đặt cược.')
  p.stake = Math.min(p.points, 200); p.points -= p.stake; p.starArmed = true; p.starUsed = true
  log(room, p, `${p.name} đặt cược ${p.stake} điểm với Ngôi sao.`, 'system', now)
}
export function answerRace(room: RaceRoom, p: Racer, questionId: string, choice: string | null, now = Date.now(), timeout = false) {
  if (!timeout) ensureRacing(room, now); ensureActive(p)
  if (p.answer) throw new RaceError('Câu hỏi này đã được trả lời.')
  const q = question(p)
  if (q.id !== questionId) throw new RaceError('Câu hỏi đã đổi. Vui lòng xem câu hiện tại.')
  if (choice !== null && !q.options.some(o => o.id === choice)) throw new RaceError('Đáp án không hợp lệ.')
  const deadline = p.questionAt + RULES.questionMs
  if (!timeout && now >= deadline) throw new RaceError('Đã hết thời gian trả lời.')
  const correct = choice === q.correctOptionId && now < deadline
  const base = correct ? 100 + Math.floor(100 * Math.max(0, 1 - (now - p.questionAt) / RULES.questionMs)) : 0
  const adjusted = Math.floor(base * gearStats(p).reward)
  const reward = p.starArmed ? correct ? adjusted * 2 + p.stake : 0 : adjusted
  p.points += reward; p.answered++; if (correct) p.correct++
  p.answer = { selected: choice, correct: q.correctOptionId, explanation: q.explanation, reward, stake: p.stake, nextAt: now + RULES.feedbackMs }
  log(room, p, `${p.name}: ${correct ? `đúng, +${reward} điểm` : p.starArmed ? `sai, mất ${p.stake} điểm cược` : choice === null ? 'hết giờ' : 'chưa đúng'}.`, 'answer', now)
  p.starArmed = false; p.stake = 0
  if (p.answered >= p.nextCard) {
    p.nextCard = p.answered + randomInt(3, 6)
    const kind = (Object.keys(CARDS) as CardKind[])[randomInt(Object.keys(CARDS).length)]
    if (p.cards.length < 3) { p.cards.push(kind); log(room, p, `${p.name} nhận thẻ ${CARDS[kind].title}.`, 'card', now) }
    else { p.points += 50; log(room, p, `${p.name}: túi thẻ đầy, đổi thẻ mới thành 50 điểm.`, 'card', now) }
  }
  return p.answer
}
export function buyMove(room: RaceRoom, p: Racer, kind: string, now = Date.now()) {
  ensureRacing(room, now); ensureActive(p)
  if (kind !== 'step' && kind !== 'boost') throw new RaceError('Gói di chuyển không hợp lệ.')
  if (p.target >= RULES.track) throw new RaceError('Đã đủ quãng đường đến đích.')
  const cost = Math.ceil((kind === 'boost' ? 150 : 50) * (p.discount > 0 ? .8 : 1) * gearStats(p).price)
  if (p.points < cost) throw new RaceError('Chưa đủ điểm. Trả lời đúng để tích lũy thêm.')
  p.points -= cost; if (p.discount > 0) p.discount--
  p.rollReadyAt = 0
  const steps = (kind === 'boost' ? 4 : 1) + (p.tailwind > 0 ? 1 : 0); if (p.tailwind > 0) p.tailwind--
  p.rollRemaining += steps * STEP_PX
  p.target = Math.min(RULES.track, p.progress + p.rollRemaining / STEP_PX)
  log(room, p, `${p.name} đầu tư ${cost} điểm → chạy nhanh thêm ${steps * STEP_PX} px. Giữ hướng tiến để sử dụng.`, 'move', now)
}
export function steerRace(room: RaceRoom, p: Racer, x: number, y: number, now = Date.now(), crouch = false, guard = false) {
  if (room.phase !== 'racing'||p.capturedAt) return
  if (![x, y].every(v => Number.isInteger(v) && v >= -1 && v <= 1)) throw new RaceError('Hướng điều khiển không hợp lệ.')
  if(guard&&!p.guardHeld)p.guardUntil=now+260
  p.guardHeld=guard
  if(x)p.facingX=Math.sign(x)
  p.inputX = x; p.inputY = y; p.inputUntil = now + RULES.inputTimeout; p.crouching = !guard && crouch && p.jumpUntil <= now
}
export function customizeRace(room:RaceRoom,p:Racer,data:{color:string;model:string;gearHead?:string;gearBody?:string}){
 if(room.phase!=='lobby')throw new RaceError('Chỉ đổi trang bị trong sảnh chờ.')
 if(!DUCK_COLORS.includes(data.color as DuckColor))throw new RaceError('Màu vịt không hợp lệ.')
 for(const [slot,value] of [['head',data.gearHead],['body',data.gearBody]] as const)if(value&&(!EQUIPMENT[value as GearId]||EQUIPMENT[value as GearId].slot!==slot))throw new RaceError('Trang sức không đúng ô.')
 p.color=data.color as DuckColor;p.model=data.model==='ducky'?'ducky':'duckee';p.gearHead=data.gearHead as GearId||undefined;p.gearBody=data.gearBody as GearId||undefined
}
export function jumpRace(room: RaceRoom, p: Racer, now = Date.now()) {
 ensureRacing(room,now);ensureActive(p)
 if(p.guardHeld)return
 if(p.stunnedUntil>now){p.jumpQueued=true;return}
 const airborne=p.jumpUntil>now
 if(airborne&&(p.jumpCount||1)>=2){p.jumpQueued=true;return}
 const stats=gearStats(p)
 if(!airborne){p.firstJumpAt=now;p.jumpCount=1;p.jumpFrom=0;p.jumpDuration=1100;p.airSpeed=(p.rollRemaining>0?stats.roll:p.mode==='water'?stats.swim:stats.walk)*stats.jump}
 else {p.jumpFrom=flightHeight(p,now);p.jumpCount=2;p.jumpDuration=Math.max(300,Math.min(800,1600-(now-(p.firstJumpAt||now))));p.airSpeed=(p.airSpeed||stats.walk)*stats.double}
 p.jumpStartedAt=now;p.jumpUntil=now+(p.jumpDuration||1100);p.crouching=false;p.jumpQueued=false
}
function knock(p:Racer,x:number,y:number,now:number,obstacle=false){
 const target=roadPosition(x,y);p.knockFromX=p.x;p.knockFromY=p.y;p.knockToX=target.x;p.knockToY=target.y;p.knockStart=now+100;p.knockUntil=now+380
 p.stunnedUntil=now+(obstacle?gearStats(p).obstacleStun:1500);p.recoveryUntil=p.stunnedUntil+1200;p.invulnerableUntil=p.recoveryUntil;p.speed=0;p.rolling=false;p.jumpUntil=0;p.jumpCount=0;p.jumpQueued=false;p.guardHeld=false
}
export function attackRace(room: RaceRoom, p: Racer, now = Date.now()) {
 ensureRacing(room,now);ensureActive(p);if(p.stunnedUntil>now||p.guardHeld)return
  p.attackStyle=p.jumpUntil>now?'air':p.speed>.1?'run':'idle';p.attackingUntil=now+400
 const other=room.players.filter(q=>q.id!==p.id&&!q.finishedAt&&!q.capturedAt&&q.invulnerableUntil<=now&&Math.hypot(q.x-p.x,q.y-p.y)<=80).filter(q=>{const dx=q.x-p.x,dy=q.y-p.y;return dx*p.facingX+dy*p.facingY>=-2}).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]
 if(!other)return
 const len=Math.hypot(other.x-p.x,other.y-p.y)||1,dx=(other.x-p.x)/len||p.facingX,dy=(other.y-p.y)/len
 const facingAttacker=(p.x-other.x)*other.facingX>=-2
 if(other.guardHeld&&other.inputUntil>now&&facingAttacker&&(other.guardUntil||0)>=now){other.parryUntil=now+320;knock(p,p.x-dx*110,p.y-dy*110,now);log(room,p,`${other.name} đỡ đúng nhịp: ${p.name} bị phản đòn, choáng 1,5 giây.`,'collision',now);log(room,other,'Đỡ đúng nhịp! Phản đòn thành công.','collision',now);return}
 if(other.shield){other.shield--;other.invulnerableUntil=now+500;return}
 knock(other,other.x+dx*110,other.y+dy*110,now);log(room,p,`${p.name} đánh trúng ${other.name}: văng ra và choáng 1,5 giây.`,'collision',now);log(room,other,`${p.name} đánh trúng: choáng 1,5 giây.`,'collision',now)
}
export function playCard(room: RaceRoom, p: Racer, index: number, now = Date.now()) {
  ensureRacing(room, now); ensureActive(p)
  if (!Number.isInteger(index) || !p.cards[index]) throw new RaceError('Thẻ không còn trong túi.')
  const [card] = p.cards.splice(index, 1); let detail = CARDS[card].description
  switch (card) {
    case 'discount': p.discount += 3; break
    case 'shield': p.shield++; break
    case 'boost': p.rollRemaining += STEP_PX * 3; p.target = Math.min(RULES.track, p.progress + p.rollRemaining / STEP_PX); break
    case 'grant': p.points += 120; break
    case 'interest': { const value = Math.min(100, Math.floor(p.points * .2)); p.points += value; detail = `Nhận ${value} điểm tiền lãi.`; break }
    case 'tailwind': p.tailwind += 2; break
    case 'refund': p.points += 50; p.shield++; break
    case 'steal': {
      const other = [...room.players].filter(x => x.id !== p.id&&!x.capturedAt).sort((a, b) => b.points - a.points)[0]
      const amount = other ? Math.min(75, Math.floor(other.points * .1)) : 0
      if (other) { other.points -= amount; log(room, other, `${other.name} trả ${amount} điểm phí trạm cho ${p.name}.`, 'card', now) }
      p.points += amount; detail = other ? `Thu ${amount} điểm từ ${other.name}.` : 'Không có đối tác để thu phí.'; break
    }
  }
  log(room, p, `${p.name} dùng ${CARDS[card].title}: ${detail}`, 'card', now)
}
export function tickRace(room: RaceRoom, now = Date.now()) {
  ensureObstacleCourse(room)
  if (room.phase === 'countdown' && now >= room.startedAt) room.phase = 'racing'
  if (room.phase !== 'racing') { room.lastTick = now; return }
  if (now >= room.endsAt) { finishRace(room, 'time', now); return }
  const dt = Math.min(.25, Math.max(0, (now - Math.max(room.lastTick, room.startedAt)) / 1000)); room.lastTick = now
  room.hazards = room.hazards.filter(h => h.expiresAt > now)
  if (now - room.lastSpawn >= 30_000) {
    room.lastSpawn = now
    const course=room.hazards.filter(h=>h.category==='obstacle')
    for (let i=0;i<6;i++){
      const kind=(['whirlwind','rain','tailwind','headwind'] as const)[i%4]
      // Damaging weather stays on an already blocked footprint, preserving its walk-around gap.
      const anchor=kind==='whirlwind'&&course.length?course[randomInt(course.length)]:undefined
      const worldX=anchor?.worldX??randomInt(900,WORLD-1000)
      const worldY=anchor?.worldY??ROAD_Y+randomInt(-60,61)
      room.hazards.push({id:randomUUID(),worldX,worldY,spanY:Math.min(24,anchor?.spanY??24),thicknessX:24,rowId:anchor?.rowId,
        position:worldX/STEP_PX,offset:worldY-trackPoint(0).y,category:'environment',kind,expiresAt:now+10000})
    }
    log(room, null, 'Môi trường thay đổi: gió, mưa và lốc bụi trong 10 giây.', 'system', now)
  }
  for (let i = 0; i < room.players.length; i++) {
    const p = room.players[i]
    if(p.capturedAt){p.speed=0;p.rolling=false;continue}
    if (p.jumpQueued && p.jumpUntil <= now && p.stunnedUntil <= now) {
      p.jumpQueued=false;p.jumpCount=1;p.firstJumpAt=now;p.jumpStartedAt=now;p.jumpFrom=0;p.jumpDuration=1100;p.jumpUntil=now+1100;p.airSpeed=gearStats(p).walk;p.crouching=false
    }
    if (!p.answer && now >= p.questionAt + RULES.questionMs) answerRace(room, p, question(p).id, null, now, true)
    else if (p.answer && now >= p.answer.nextAt) { p.cursor++; if (p.cursor % p.deck.length === 0) p.deck = shuffle(); p.answer = undefined; p.questionAt = now }
    p.speed = 0; p.rolling = false
    if(p.stunnedUntil>now){
      if(p.knockUntil&&p.knockToX!==undefined){
        const started=p.knockStart??now
        const t=Math.max(0,Math.min(1,(now-started)/Math.max(1,p.knockUntil-started)))
        const eased=1-(1-t)**3,fromX=p.knockFromX??p.x,fromY=p.knockFromY??p.y
        const next=roadPosition(fromX+((p.knockToX??p.x)-fromX)*eased,fromY+((p.knockToY??p.y)-fromY)*eased)
        p.x=next.x;p.y=next.y;p.progress=next.progress;p.lateral=next.offset
        p.target=Math.min(100,p.progress+p.rollRemaining/STEP_PX)
      }
      continue
    }
    if(p.finishedAt)continue
    p.hit=[];if(p.jumpUntil<=now)p.jumpCount=0;p.mode=terrainAt(p.x,p.y)
    const from = {x:p.x,y:p.y}, input = p.inputUntil > now
    if(!input){p.crouching=false;p.guardHeld=false}
    if(input&&p.inputX)p.facingX=Math.sign(p.inputX)
    p.facingY = 0
    const airborne=p.jumpUntil>now
    const weather=room.hazards.find(h=>h.category==='environment'&&Math.abs(h.position-p.progress)<2)
    const wind=weather?.kind==='tailwind'?1.15:weather?.kind==='headwind'?.85:1
    const next = motor.advance({...p,reserve:p.rollRemaining,airborne},{x:input?p.inputX:0,y:input?p.inputY:0},dt,wind)
    p.x=next.x;p.y=next.y;p.progress=next.progress;p.lateral=next.offset;p.speed=next.speed;p.rolling=next.boosting;p.rollRemaining=next.reserve
    p.target = Math.min(100, p.progress + p.rollRemaining / STEP_PX)
    if((p.recoveryUntil||0)<=now)for(const h of room.hazards){
      if(['rain','tailwind','headwind'].includes(h.kind))continue
      if(h.caughtRacerId)continue
      const hp=obstaclePoint(h,now)
      if(h.kind==='catcher'&&Math.abs(hp.x-p.x)<260&&Math.abs(hp.y-p.y)<(h.spanY??40)/2+25&&!h.alertedAt)h.alertedAt=now
      const contact=obstacleCollision(from,p,h,now,dt)
      const avoids=clearsObstacle(p,h,now-dt*1000+(contact??1)*dt*1000)
      if(contact!==null&&!avoids&&h.kind==='catcher'&&!p.shield){
        p.capturedAt=now;p.capturedBy=h.id;h.caughtRacerId=p.id;h.caughtAt=now
        p.x=hp.x;p.y=hp.y;p.progress=p.x/STEP_PX;p.target=p.progress;p.speed=0;p.rolling=false;p.rollRemaining=0
        p.inputX=p.inputY=p.inputUntil=p.jumpUntil=0;p.guardHeld=false;p.jumpQueued=false;p.starArmed=false;p.stake=0
        log(room,p,'Bị người bắt vịt tóm trong lưới. Chốt '+p.points+' điểm; kết thúc lượt của bạn.','collision',now)
        break
      }
      if(contact!==null&&!avoids){if(p.shield){p.shield--;p.recoveryUntil=now+500}else{const back=p.facingX<0?1:-1;knock(p,hp.x+back*260,p.y,now,true);log(room,p,'Va chạm: ngất rồi lùi lại trước vật cản.','collision',now)}break}
    }
    if (p.progress >= RULES.track) p.finishedAt = now
  }
  if (room.players.some(p => p.finishedAt)) finishRace(room, 'finish', now)
}
export function snapshot(room: RaceRoom, playerId?: string, now = Date.now()): RaceSnapshot {
  const players = ranking(room).map((p, i) => ({ id: p.id, name: p.name, color: p.color, model: p.model, points: p.points,
    progress: p.progress, target: p.target, rank: i + 1, connected: p.connected, correct: p.correct, answered: p.answered,
    stunnedUntil: p.stunnedUntil, shield: p.shield, discount: p.discount, tailwind: p.tailwind, finishedAt: p.finishedAt, capturedAt:p.capturedAt,capturedBy:p.capturedBy,
    x: p.x, y: p.y, lateral: p.lateral, facingX: p.facingX, facingY: p.facingY, speed: p.speed, rolling: p.rolling, rollReadyAt: p.rollReadyAt,
    gearHead:p.gearHead,gearBody:p.gearBody,mode:p.mode,jumpCount:p.jumpCount,jumpStartedAt:p.jumpStartedAt,jumpDuration:p.jumpDuration,jumpFrom:p.jumpFrom,airSpeed:p.airSpeed,guardHeld:p.guardHeld,guardUntil:p.guardUntil,parryUntil:p.parryUntil,attackStyle:p.attackStyle,recoveryUntil:p.recoveryUntil,knockUntil:p.knockUntil,
    jumpUntil: p.jumpUntil, crouching: p.crouching, attackingUntil: p.attackingUntil, invulnerableUntil: p.invulnerableUntil }))
  const p = room.players.find(p => p.id === playerId), q = p && question(p)
  return { code: room.code, phase: room.phase, serverTime: now, revision: room.revision || 0, startedAt: room.startedAt, endsAt: room.endsAt, duration: room.duration,
    players, hazards: room.hazards, me: players.find(x => x.id === playerId),
    question: p && !p.capturedAt && q && room.phase === 'racing' ? { id: q.id, prompt: q.prompt, options: q.options, deadline: p.questionAt + RULES.questionMs, number: p.answered + (p.answer ? 0 : 1) } : undefined,
    answer: p?.answer, starArmed: p?.starArmed, starUsed: p?.starUsed, stake: p?.stake,
    logs: (p ? p.logs : room.logs).slice(0, 50), cards: p?.cards, questionCount: bank.length, winnerId: room.winnerId, finishReason: room.finishReason, storage: room.storage }
}
