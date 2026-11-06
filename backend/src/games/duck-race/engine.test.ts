import { roadPosition, trackPoint, STEP_PX, ROAD_Y, ROAD_HALF_WIDTH, WORLD, TERRAIN_ZONES, terrainAt } from './track'
import { DuckMotor, obstacleCollision, spawnObstacles } from './motor'
import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../../shared/questions/bank'
import { armStar, answerRace, attackRace, customizeRace, buyMove, createRace, finishRace, joinRace, jumpRace, playCard, RULES, snapshot, startRace, steerRace, tickRace } from './engine'

function fixture(count = 1) {
  const r = createRace(1000)
  for (let i = 0; i < count; i++) joinRace(r, `Người chơi ${i}`, 'yellow', 'duckee', 1000)
  startRace(r, 1000); tickRace(r, 4000)
  return { r, p: r.players[0], at: 4000 }
}
function correct(r: ReturnType<typeof createRace>, p: ReturnType<typeof joinRace>, at: number) {
  const view = snapshot(r, p.id, at), q = QUESTIONS.find(q => q.id === view.question!.id)!
  answerRace(r, p, q.id, q.correctOptionId, at)
}
describe('Quiz Duck Race authoritative economy', () => {
  it('keeps finite painted wet contours on the narrow horizontal strip',()=>{
    for(const z of TERRAIN_ZONES){const x=(z.start+z.end)/2;expect(z.height).toBeLessThan(ROAD_HALF_WIDTH*2);expect(terrainAt(x,z.centerY)).toBe(z.kind);expect(terrainAt(x,ROAD_Y-80)).toBe('ground');expect(terrainAt(x,ROAD_Y+80)).toBe('ground');expect(terrainAt(z.start+1,z.centerY-z.height/2+2)).toBe('ground')}
  })
  it('applies swim/mud speed only on the painted wet region, never on the dry bypass',()=>{
    for(const [kind,y,expected] of [['water',500,125],['mud',500,57.6],['water',580,96]] as const){const{r,p,at}=fixture();r.hazards=[];const z=TERRAIN_ZONES.find(z=>z.kind===kind)!;p.x=(z.start+z.end)/2;p.y=y;steerRace(r,p,1,0,at);tickRace(r,at+100);expect(p.mode).toBe(y===580?'ground':kind);expect(p.speed).toBeCloseTo(expected,4)}
  })
  it('isolates games and accepts duplicate names in different rooms', () => {
    const a = createRace(), b = createRace(); expect(a.code).not.toBe(b.code)
    const p = joinRace(a, 'CEO trùng tên', 'red', 'duckee'), q = joinRace(b, 'CEO trùng tên', 'red', 'duckee')
    expect(p.token).not.toBe(q.token); expect(a.players).toHaveLength(1)
  })
  it('caps 50 players, NFC name length, and prevents late joins', () => {
    const r = createRace(); for (let i = 0; i < 50; i++) joinRace(r, `P${i}`, 'yellow', 'duckee')
    expect(() => joinRace(r, 'P51', 'yellow', 'duckee')).toThrow('50')
    expect(() => joinRace(createRace(), 'a'.repeat(33), 'yellow', 'duckee')).toThrow('32')
    startRace(r); expect(() => joinRace(r, 'P51', 'yellow', 'duckee')).toThrow('bắt đầu')
  })
  it('starts at zero and correct answers add capital but never distance', () => {
    const { r, p, at } = fixture(); correct(r, p, at + 1000)
    expect(p.points).toBe(195); expect(p.progress).toBe(0); expect(p.target).toBe(0); expect(p.correct).toBe(1)
    expect(() => correct(r, p, at + 1100)).toThrow('đã được trả lời')
  })
  it('does not reveal answers, tokens, decks or other players questions', () => {
    const { r, p } = fixture(2), view = snapshot(r, p.id)
    expect(view.question).not.toHaveProperty('correctOptionId'); expect(view.players[0]).not.toHaveProperty('token')
    expect(view.players[0]).not.toHaveProperty('deck'); expect(snapshot(r).question).toBeUndefined()
  })
  it('rejects stale/invalid answers and only awards server-timed speed points', () => {
    const { r, p, at } = fixture(); expect(() => answerRace(r, p, 'fake', 'a', at)).toThrow('đã đổi')
    const q = snapshot(r, p.id).question!; expect(() => answerRace(r, p, q.id, 'fake', at)).toThrow('không hợp lệ')
    tickRace(r, at + 20_000); expect(p.points).toBe(0); expect(p.answer?.selected).toBeNull()
  })
  it('keeps exactly one question through timeout and advances only after feedback', () => {
    const { r, p, at } = fixture(); const initial = snapshot(r, p.id).question!.id
    tickRace(r, at + RULES.questionMs); expect(p.answered).toBe(1)
    tickRace(r, at + RULES.questionMs + 100); expect(p.answered).toBe(1); expect(snapshot(r, p.id).question!.id).toBe(initial)
    tickRace(r, at + RULES.questionMs + RULES.feedbackMs); expect(p.answer).toBeUndefined(); expect(snapshot(r, p.id).question!.id).not.toBe(initial)
  })
  it('charges exactly one bundle, queues movement, and rejects overdrafts', () => {
    const { r, p, at } = fixture(); expect(() => buyMove(r, p, 'step', at)).toThrow('Chưa đủ')
    p.points = 200; buyMove(r, p, 'boost', at); expect(p.points).toBe(50); expect(p.target).toBe(4); expect(p.progress).toBe(0)
    buyMove(r, p, 'step', at); expect(p.points).toBe(0); expect(p.target).toBe(5)
    expect(() => buyMove(r, p, 'step', at)).toThrow(); expect(() => buyMove(r, p, 'hack', at)).toThrow()
  })
  it('discount and tailwind each consume a use on purchase, not on render', () => {
    const { r, p, at } = fixture(); p.cards = ['discount', 'tailwind']; p.points = 500
    playCard(r, p, 0, at); playCard(r, p, 0, at); buyMove(r, p, 'boost', at)
    expect(p.points).toBe(380); expect(p.target).toBe(5); expect(p.discount).toBe(2); expect(p.tailwind).toBe(1)
    expect(snapshot(r, p.id).me?.discount).toBe(2)
  })
  it('uses star once, reserves the stake and pays double reward only for correct', () => {
    const { r, p, at } = fixture(); p.points = 150; armStar(r, p, at); expect(p.points).toBe(0)
    correct(r, p, at + 1000); expect(p.points).toBe(540); expect(p.starUsed).toBe(true)
    expect(() => armStar(r, p, at + 1001)).toThrow()
  })
  it('loses reserved stake on a wrong answer or timeout, never negative', () => {
    const { r, p, at } = fixture(); p.points = 500; armStar(r, p, at); expect(p.points).toBe(300)
    tickRace(r, at + 20_000); expect(p.points).toBe(300); expect(p.answer?.reward).toBe(0)
  })
  it('caps transfers and conserves points between players', () => {
    const { r, p, at } = fixture(2), other = r.players[1]; p.cards = ['steal']; other.points = 5000
    playCard(r, p, 0, at); expect(p.points).toBe(75); expect(other.points).toBe(4925)
    expect(other.logs[0].text).toContain('75'); expect(() => playCard(r, p, 0, at)).toThrow()
  })
  it('all eight cards have an explicit effect; card rewards respect capacity', () => {
    const { r, p, at } = fixture(); p.points = 400; p.cards = ['interest', 'refund', 'grant']
    playCard(r, p, 0, at); expect(p.points).toBe(480); playCard(r, p, 0, at); expect(p.shield).toBe(1)
    playCard(r, p, 0, at); expect(p.points).toBe(650); p.cards = ['boost']; playCard(r, p, 0, at); expect(p.target).toBe(3)
    p.cards = ['shield', 'shield', 'shield']; p.nextCard = 1; correct(r, p, at + 1000); expect(p.cards).toHaveLength(3); expect(p.points).toBe(895)
  })
  it('keeps the course permanent and only spawns temporary weather every 30 seconds', () => {
    const { r, at } = fixture(); const permanent=r.hazards.filter(h=>h.category==='obstacle').length;expect(permanent).toBeGreaterThan(50); tickRace(r, at + 30_000); expect(r.hazards).toHaveLength(permanent+4)
    // The previous two conflicting local winds are now one shared directional gust.
    expect(r.wind?.endsAt).toBe(at+40_000);expect([-1,1]).toContain(r.wind?.direction)
    expect(r.hazards.filter(h=>h.category==='environment').every(h => h.expiresAt === at + 40_000)).toBe(true)
    tickRace(r, at + 40_000); expect(r.hazards).toHaveLength(permanent);expect(r.wind).toBeUndefined()
  })
  it('only moves with directional input and stops on release or stale controls', () => {
    const { r, p, at } = fixture(); const start = { x: p.x, y: p.y }
    tickRace(r, at + 100); expect(p.x).toBe(start.x); expect(p.y).toBe(start.y);expect(p.points).toBe(0)
    steerRace(r, p, 1, 0, at + 100); tickRace(r, at + 200); expect(p.x).toBeGreaterThan(start.x)
    const x = p.x; steerRace(r, p, 0, 0, at + 200); tickRace(r, at + 300); expect(p.x).toBe(x)
    steerRace(r, p, 0, 1, at + 300); tickRace(r, at + 400); expect(p.y).toBeGreaterThan(start.y)
    expect(() => steerRace(r, p, 10, 0, at)).toThrow('không hợp lệ')
    const before = p.y; tickRace(r, at + 1000); expect(p.y).toBe(before)
  })
  it('keeps purchased boost while idle or dodging vertically, and spends it only while advancing', () => {
    const { r, p, at } = fixture(); p.points = 300; buyMove(r, p, 'boost', at)
    tickRace(r, at + 100); expect(p.rollRemaining).toBeCloseTo(4*STEP_PX); expect(p.progress).toBe(0);expect(p.rolling).toBe(false)
    steerRace(r, p, 1, 0, at + 100); tickRace(r, at + 200); expect(p.rollRemaining).toBeLessThan(4*STEP_PX); expect(p.rolling).toBe(true)
    for(let i=3;i<30;i++){steerRace(r,p,0,-1,at+i*100);tickRace(r,at+i*100)}
    expect(Math.abs(p.lateral)).toBeLessThanOrEqual(ROAD_HALF_WIDTH+.00001)
    expect(snapshot(r,p.id).players[0]).not.toHaveProperty('lane')
  })
  it('collision stalls once; jumping clears a hurdle and crouching clears a low gate', () => {
    for(const mode of ['hit','jump','crouch','shield']){
      const { r, p, at } = fixture(); const point = trackPoint(10)
      p.x=point.x-.2;p.y=point.y;p.progress=9.999
      r.hazards=[{id:'bar',position:10,offset:0,kind:mode==='crouch'?'gate':'hurdle',expiresAt:at+10000}]
      if(mode==='jump'){p.x=point.x-80;jumpRace(r,p,at)}
      if(mode==='shield')p.shield=1
      steerRace(r,p,1,0,at,mode==='crouch');tickRace(r,at+(mode==='jump'?250:100))
      if(mode==='hit'){expect(p.stunnedUntil).toBe(at+1600);expect(p.knockToX).toBeLessThan(point.x-60);expect(p.knockToX).toBeGreaterThan(point.x-150)}
      else expect(p.stunnedUntil).toBe(0)
      if(mode==='shield')expect(p.shield).toBe(0)
    }
  })
  it('allows two airborne jumps and buffers subsequent presses until landing', () => {
    const {r,p,at}=fixture();jumpRace(r,p,at);expect(p.jumpUntil).toBe(at+1100);expect(p.points).toBe(0)
    expect(()=>jumpRace(r,p,at+100)).not.toThrow();expect(p.jumpCount).toBe(2);expect(p.jumpFrom).toBeGreaterThan(0);jumpRace(r,p,at+200);expect(p.jumpQueued).toBe(true);tickRace(r,at+1100);expect(p.jumpUntil).toBe(at+2200);expect(p.jumpQueued).toBe(false)
  })
  it('combat hits only a close forward target and respects recovery immunity without a cooldown', () => {
    const {r,p,at}=fixture(3);const other=r.players[1],third=r.players[2]
    r.hazards=[]
    const point=trackPoint(10);p.x=point.x;p.y=point.y;p.progress=10;p.facingX=1;p.facingY=0
    other.x=p.x+30;other.y=p.y;other.progress=10;third.x=p.x-30;third.y=p.y;third.progress=10
    attackRace(r,p,at);expect(other.stunnedUntil).toBe(at+1500);expect(third.stunnedUntil).toBe(0)
    expect(other.invulnerableUntil).toBe(at+2700);expect(()=>attackRace(r,p,at+100)).not.toThrow();expect(other.stunnedUntil).toBe(at+1500)
    third.x=p.x;third.y=p.y;third.facingX=1;third.facingY=0;attackRace(r,third,at+100)
    expect(other.stunnedUntil).toBe(at+1500);expect(other.points+p.points+third.points).toBe(0)
  })
  it('shield blocks a push; out-of-range attacks do not hit',()=>{
    const {r,p,at}=fixture(2),q=r.players[1];r.hazards=[];q.x=p.x+30;q.y=p.y;q.shield=1;attackRace(r,p,at)
    expect(q.shield).toBe(0);expect(q.stunnedUntil).toBe(0)
    q.x=p.x+500;attackRace(r,p,at+3100);expect(q.stunnedUntil).toBe(0)
  })
  it('ends on first physical finish, not purchase; ranks timeouts by funds', () => {
    const { r, p, at } = fixture(2); const end=trackPoint(99.9999); p.x=end.x;p.y=end.y;p.progress=99.9999;p.target=100
    r.players[1].points = 999;steerRace(r,p,1,1,at);tickRace(r, at + 100); expect(r.phase).toBe('finished'); expect(r.winnerId).toBe(p.id)
    const second = fixture(2); second.p.progress = 80; second.p.points = 5; second.r.players[1].points = 100
    tickRace(second.r, second.r.endsAt); expect(second.r.winnerId).toBe(second.r.players[1].id)
  })
  it('uses a large straight horizontal map with permanent obstacles',()=>{expect(WORLD).toBe(60000);expect(trackPoint(0).y).toBe(trackPoint(100).y);expect(trackPoint(100).x-trackPoint(0).x).toBeGreaterThan(39000);const r=createRace();expect(r.hazards.every(h=>h.category==='obstacle'&&h.expiresAt>1e13)).toBe(true)})
  it('projects arbitrary coordinates to a bounded continuous road, not lanes',()=>{
    const mid=trackPoint(50);const p=roadPosition(mid.x,mid.y-2000);expect(Math.abs(p.offset)).toBeLessThanOrEqual(ROAD_HALF_WIDTH)
    const free=roadPosition(mid.x,mid.y+13.7);expect(Math.abs(free.offset)).toBeGreaterThan(1)
  })

  it('reflects a timely guard onto the attacker, but a late guard fails',()=>{
    for(const delay of [100,300]){
      const {r,p,at}=fixture(2),q=r.players[1];q.x=p.x+30;q.y=p.y;p.facingX=1;p.facingY=0
      r.hazards=[]
      steerRace(r,q,-1,0,at,false,true);attackRace(r,p,at+delay)
      expect((delay===100?p:q).stunnedUntil).toBe(at+delay+1500)
      expect((delay===100?q:p).stunnedUntil).toBe(0)
    }
  })
  it('retreats before the obstacle and clears held guard on stale input',()=>{
    const {r,p,at}=fixture();const point=trackPoint(2);p.x=point.x-1;p.y=point.y
    r.hazards=[{id:'log',position:2,offset:0,kind:'hurdle',expiresAt:1e14}]
    steerRace(r,p,1,0,at);tickRace(r,at+100);tickRace(r,at+500)
    expect(p.x).toBeLessThan(point.x-60);expect(p.x).toBeGreaterThan(point.x-150);expect(p.recoveryUntil).toBeGreaterThan(p.stunnedUntil)
    expect(p.target-p.progress).toBeCloseTo(p.rollRemaining/STEP_PX)
    const other=fixture();steerRace(other.r,other.p,0,0,at,false,true);tickRace(other.r,at+500);expect(other.p.guardHeld).toBe(false)
  })
  it('validates equipment slots, locks them after start, and applies a whole-number price',()=>{
    const r=createRace(1000),p=joinRace(r,'Ducky','yellow','ducky',1000)
    expect(()=>customizeRace(r,p,{color:'aqua',model:'ducky',gearHead:'boots'})).toThrow('đúng ô')
    customizeRace(r,p,{color:'aqua',model:'ducky',gearHead:'crown',gearBody:'feather'})
    startRace(r,1000);tickRace(r,4000);p.points=1000;buyMove(r,p,'step',4000);expect(p.points).toBe(940)
    expect(()=>customizeRace(r,p,{color:'red',model:'duckee'})).toThrow('sảnh chờ')
  })
  it('freezes final results and rejects postgame economic actions', () => {
    const { r, p, at } = fixture(); p.points = 1000; finishRace(r, 'host', at)
    expect(() => buyMove(r, p, 'boost', at + 1)).toThrow('kết thúc'); tickRace(r, at + 20_000); expect(p.points).toBe(1000)
  })
  it('starts at X=0, remains still without input, and allows continuous dodging between the lanes',()=>{
    const motor=new DuckMotor(),p={x:0,y:500,reserve:0,crouching:false,airborne:false}
    const straight=motor.advance(p,{x:0,y:0},.2),dodge=motor.advance(p,{x:0,y:.37},.2)
    expect(trackPoint(0).x).toBe(0);expect(straight.x).toBe(0);expect(dodge.x).toBe(0)
    expect(dodge.y).toBeCloseTo(509.62);expect(dodge.reserve).toBe(0)
    expect(motor.advance({...p,y:ROAD_Y+ROAD_HALF_WIDTH-1},{x:0,y:1},.2).y).toBe(ROAD_Y+ROAD_HALF_WIDTH)
  })
  it('uses the final fraction of a boost and then returns to the slow speed without overspending',()=>{
    const motor=new DuckMotor(),next=motor.advance({x:0,y:500,reserve:39,crouching:false,airborne:false},{x:1,y:0},.2)
    expect(motor.speedBoost).toBeGreaterThan(motor.speedSlow*3)
    expect(next.x).toBeCloseTo(39+9.6);expect(next.reserve).toBe(0)
  })
  it('spawns the same progress-based course for the same seed, within dodge bounds',()=>{
    const a=spawnObstacles(123),b=spawnObstacles(123),c=spawnObstacles(456)
    expect(a).toEqual(b);expect(a).not.toEqual(c);expect(a.length).toBeGreaterThan(50)
    expect(a.every(h=>h.position>0&&h.position<100&&Math.abs(h.offset)<ROAD_HALF_WIDTH)).toBe(true)
  })
  it('sweeps the complete movement segment: boost cannot tunnel through a rock',()=>{
    const h={id:'rock',position:10,offset:0,kind:'rock' as const,expiresAt:1e14},x=trackPoint(10).x
    expect(obstacleCollision({x:x-200,y:500},{x:x+200,y:500},h,5000,.25)).not.toBeNull()
    expect(obstacleCollision({x:x-200,y:555},{x:x+200,y:555},h,5000,.25)).toBeNull()
    // Crossing X at the wrong Y must not collide just because the final Y is near the rock.
    expect(obstacleCollision({x:x-200,y:556},{x:x+200,y:526},h,5000,.25)).toBeNull()
  })
  it('lets a continuous vertical dodge bypass a rock while the same X path collides at its height',()=>{
    for(const dodge of [false,true]){
      const{r,p,at}=fixture();const x=trackPoint(5).x;p.x=x-15;p.y=dodge?556:500;p.progress=5-15/STEP_PX
      r.hazards=[{id:'rock',position:5,offset:0,kind:'rock',category:'obstacle',expiresAt:1e14}]
      steerRace(r,p,1,0,at);tickRace(r,at+250)
      expect(p.stunnedUntil>at).toBe(!dodge)
    }
  })
})

