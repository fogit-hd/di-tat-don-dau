import { useHostAuth } from '../../shared/auth/useHostAuth'
import { useGameSurfaceInput } from './useGameSurfaceInput'
import { duckApiBase, duckSocketBase } from './endpoints'
import { GoogleHostLogin } from '../../shared/auth/GoogleHostLogin'
import { GameWebBar } from '../../shared/ui/GameWebBar'
import { FieldFocus } from './FieldFocus'
import { StaticArt as S } from './StaticArt'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Socket } from 'socket.io-client'
import { createGameSocket } from '../../shared/realtime'
import QRCode from 'qrcode'
import { CARDS, DUCK_COLORS, type CardKind, type DuckColor, type RaceSnapshot, type RacerView } from './contracts'
import { RaceTrack } from './RaceTrack'
import { EquipmentDrawer } from './EquipmentDrawer'
import { gearStats } from './contracts'
import { duckImage } from './assets'
import { trackPoint } from './track'
import { newIntent, recordIntent } from './motion'
import './duck-race.css'
import './gameplay-v8.css'

import './frames-v14.css'
import './game-surface-input.css'

type Session = { token: string; role: 'host' | 'player' }
const sessionKey = (code: string) => `quiz-duck-race:v1:${code}`
function readSession(code: string): Session | null { try { return JSON.parse(localStorage.getItem(sessionKey(code)) || 'null') } catch { return null } }
async function request<T>(path: string, body?: unknown, token?: string): Promise<T> {
  const r = await fetch(`${duckApiBase()}/api/duck-race${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'x-duck-token': token } : {}), ...(localStorage.getItem('host-session') ? { 'x-host-session': localStorage.getItem('host-session')! } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
  const json = await r.json().catch(() => ({})); if (!r.ok) throw new Error(json.error || 'Máy chủ chưa sẵn sàng. Vui lòng thử lại.'); return json
}
function Icon({ name }: { name: 'flag' | 'coin' | 'bolt' | 'star' | 'arrow' | 'card' | 'copy' | 'close' }) {
  return name === 'close' ? <span aria-hidden="true"><S text="Đóng"/></span> : null
}
const clock = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
const DEMO: RacerView[] = DUCK_COLORS.slice(0, 5).map((color, i) => ({ id: String(i), name: ['Vịt Nắng', 'Lá Xanh', 'Mỏ Cam', 'Tia Chớp', 'Mây Tím'][i], model: 'duckee', color, points: 0, progress: 7 - i * 1.5, target: 7 - i * 1.5, x: trackPoint(7 - i * 1.5, (i % 3 - 1) * 38).x, y: trackPoint(7 - i * 1.5, (i % 3 - 1) * 38).y, lateral: (i % 3 - 1) * 38, facingX: 1, facingY: 0, speed: 0, rolling: false, rollReadyAt: 0, jumpUntil: 0, crouching: false, attackingUntil: 0, invulnerableUntil: 0, rank: i + 1, connected: true, correct: 0, answered: 0, stunnedUntil: 0, shield: 0, discount: 0, tailwind: 0 }))

export function DuckRace() { const { code = '' } = useParams(); return <DuckRaceScreen key={code} /> }
function DuckRaceScreen() {
  const surfaceInput = useGameSurfaceInput()
  const { code: raw = '' } = useParams(), code = raw.toUpperCase(), navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(() => readSession(code)), [snap, setSnap] = useState<RaceSnapshot | null>(null)
  const [roomCode, setRoomCode] = useState(code), [name, setName] = useState(''), [color] = useState<DuckColor>('yellow'), [model] = useState<'duckee' | 'ducky'>('duckee')
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [connected, setConnected] = useState(false), [now, setNow] = useState(() => Date.now()), [rules, setRules] = useState(false), [page, setPage] = useState(0), [qr, setQr] = useState(''), [copied, setCopied] = useState(false), [equipment,setEquipment]=useState(false),[questionOpen,setQuestionOpen]=useState(false),[cameraMode, setCameraMode] = useState<'leader' | 'wealth'>('leader')
  const { token:hostSession, setToken:setHostSession, logout } = useHostAuth()
  const [loginOpen,setLoginOpen]=useState(false), [loginIntent,setLoginIntent]=useState<'create'|'login'>('login')
  const [guide,setGuide]=useState(true)
  useEffect(()=>{if(snap?.phase!=='racing')return;const timer=setTimeout(()=>setGuide(false),9000);return()=>clearTimeout(timer)},[snap?.phase])
  useEffect(()=>{if(!error)return;const timer=setTimeout(()=>setError(''),5000);return()=>clearTimeout(timer)},[error])
  const controls = useRef({ keys: new Set<string>(), socket: null as Socket | null, roll: () => {}, jump: () => {}, attack: () => {} })
  const sync = useRef({ server: 0, local: 0, revision: -1 })
  const motionIntent = useRef(newIntent()), pending = useRef(new Set<string>())
  const accept = (s: RaceSnapshot) => {
    if (s.revision !== undefined ? s.revision <= sync.current.revision : s.serverTime < sync.current.server) return
    sync.current = { server: s.serverTime, local: Date.now(), revision: s.revision ?? -1 }; setNow(s.serverTime); setSnap(s)
  }
  useEffect(() => {
    sync.current = { server: Date.now(), local: Date.now(), revision: -1 }
    const timer = window.setInterval(() => setNow(sync.current.server + Date.now() - sync.current.local), 100); return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    if (!code || !session) return
    let alive = true
    const socket = createGameSocket(`${duckSocketBase()}/duck-race`, { path: '/duck-socket', auth: { code, token: session.token }, transports: ['websocket', 'polling'] })
    const controller = controls.current
    controller.socket = socket
    socket.on('connect', () => { setConnected(true); setError('') }); socket.on('disconnect', () => setConnected(false))
    socket.on('race:snapshot', (s: RaceSnapshot) => { if (alive) accept(s) })
    socket.on('connect_error', (e: Error) => { if (alive) { setConnected(false); setError(e.message === 'websocket error' ? 'Mất kết nối máy chủ. Đang thử kết nối lại…' : e.message) } })
    void request<RaceSnapshot>(`/rooms/${code}`, undefined, session.token).then(s => { if (alive) accept(s) }).catch(e => { if (alive) setError(e.message) })
    return () => { alive = false; socket.disconnect(); controller.socket = null }
  }, [code, session])
  useEffect(() => {
    if (!code) return
    let active = true; void QRCode.toDataURL(`${location.origin}/duck-race/play/${code}`, { width: 240, margin: 2, color: { dark: '#153b38', light: '#fff8e7' } }).then(url => { if (active) setQr(url) })
    return () => { active = false }
  }, [code])
  async function create(verified=false) {
    if(!hostSession&&!verified){setLoginIntent('create');setLoginOpen(true);return}
    setBusy(true); setError('')
    try { const result = await request<{ code: string; token: string }>('/rooms', {}); localStorage.setItem(sessionKey(result.code), JSON.stringify({ token: result.token, role: 'host' })); navigate(`/duck-race/host/${result.code}`) }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  async function join(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const target = roomCode.trim().toUpperCase()
      if (!/^D[0-9A-F]{6}$/.test(target)) throw new Error('Nhập mã phòng gồm D và 6 ký tự, ví dụ D1A2B3C.')
      const result = await request<{ token: string }>(`/rooms/${target}/join`, { name, color, model })
      const value: Session = { token: result.token, role: 'player' }; localStorage.setItem(sessionKey(target), JSON.stringify(value)); setSession(value); navigate(`/duck-race/play/${target}`)
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  async function action(type: string, extra: Record<string, unknown> = {}) {
    if (!session) return
    const flow = type === 'start' || type === 'end'
    // Deduplicate a single answer/star submission, never lock movement or other controls.
    const once = flow || type === 'answer' || type === 'star'
    if (once && pending.current.has(type)) return
    if (once) pending.current.add(type)
    if (flow) setBusy(true)
    setError('')
    try { accept(await request<RaceSnapshot>(`/rooms/${code}/action`, { type, ...extra }, session.token)) }
    catch (e) { if (type === 'jump') motionIntent.current.jumpUntil = 0; setError((e as Error).message) }
    finally { if (once) pending.current.delete(type); if (flow) setBusy(false) }
  }
  useEffect(() => { controls.current.roll = () => { void action('buy', { kind: 'boost' }) }; controls.current.jump = () => { void action('jump') }; controls.current.attack = () => { void action('attack') } })
  function emitInputs() {
    const { keys, socket } = controls.current
    const input = { x: Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')), y: Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')), crouch: keys.has('ShiftLeft') || keys.has('ShiftRight'), guard: keys.has('MouseRight') }
    recordIntent(motionIntent.current, { ...input, at: sync.current.server + Date.now() - sync.current.local })
    socket?.emit('race:input', input)
  }
  useEffect(() => {
    if (snap?.phase !== 'racing' || snap?.me?.capturedAt || session?.role !== 'player' || rules || questionOpen) return
    const keys = controls.current.keys
    const blocked = (e: KeyboardEvent) => e.target instanceof HTMLElement && (e.target.matches('input,textarea,select') || e.target.isContentEditable)
    const down = (e: KeyboardEvent) => {
      if (blocked(e) || !['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyE', 'KeyF'].includes(e.code)) return
      e.preventDefault()
      if (['Space', 'KeyE', 'KeyF'].includes(e.code)) { if (!e.repeat) { if(e.code === 'Space') controls.current.jump(); else if(e.code === 'KeyF') controls.current.attack(); else controls.current.roll() }; return }
      keys.add(e.code)
      emitInputs()
    }
    const up = (e: KeyboardEvent) => { keys.delete(e.code); emitInputs() }
    const reset = () => { keys.clear(); recordIntent(motionIntent.current, { x: 0, y: 0, crouch: false, guard: false, at: sync.current.server + Date.now() - sync.current.local }); controls.current.socket?.emit('race:input', { x: 0, y: 0, crouch: false, guard: false }) }
    const pointerDown = (e: PointerEvent) => {
      if(!(e.target instanceof Element)||!e.target.closest('.dq-track')||e.pointerType!=='mouse')return
      if(e.button===0){e.preventDefault();controls.current.attack()}
      if(e.button===2){e.preventDefault();keys.add('MouseRight');emitInputs()}
    }
    const pointerUp = (e: PointerEvent) => { if(e.button===2){keys.delete('MouseRight');emitInputs()} }
    const contextMenu = (e: MouseEvent) => {if(e.target instanceof Element&&e.target.closest('.dq-track'))e.preventDefault()}
    const timer = setInterval(emitInputs, 80)
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', reset); document.addEventListener('visibilitychange', reset)
    window.addEventListener('pointerdown',pointerDown);window.addEventListener('pointerup',pointerUp);window.addEventListener('contextmenu',contextMenu)
    return () => { clearInterval(timer); reset(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', reset); document.removeEventListener('visibilitychange', reset);window.removeEventListener('pointerdown',pointerDown);window.removeEventListener('pointerup',pointerUp);window.removeEventListener('contextmenu',contextMenu) }
  }, [snap?.phase, snap?.me?.capturedAt, session?.role, rules, questionOpen])
  function controlButton(key: string) {
    const release = () => { controls.current.keys.delete(key); emitInputs() }
    return { onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); controls.current.keys.add(key); emitInputs() }, onPointerUp: release, onPointerCancel: release, onLostPointerCapture: release }
  }
  async function copy() { try { await navigator.clipboard.writeText(`${location.origin}/duck-race/play/${code}`); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { setError('Không sao chép tự động được. Bạn có thể dùng mã phòng phía trên.') } }
  const host = session?.role === 'host', me = snap?.me, racing = snap?.phase === 'racing', finished = snap?.phase === 'finished' || !!snap?.me?.capturedAt, question = snap?.question, answer = snap?.answer
  const canAct = racing && connected && !me?.capturedAt, stepPrice = Math.ceil((me?.discount ? 40 : 50)*gearStats(me||{}).price), boostPrice = Math.ceil((me?.discount ? 120 : 150)*gearStats(me||{}).price)
  return <main translate="no" {...surfaceInput} className={`dq-shell ${racing || finished ? 'dq-playing' : ''} ${host ? 'dq-host' : 'dq-player'}`}>
    {!code ? <GameWebBar theme="forest" logo="/assets/duck-race/lettering-ai-v5/brand-title.svg" home="/duck-race" title="Quiz Duck Race" signedIn={!!hostSession} busy={busy}
      links={[{label:'Chọn game',to:'/'},{label:'Cách chơi',onClick:()=>setRules(true)}]}
      onCreate={()=>void create()} onAccount={()=>{if(hostSession){void logout().catch(e=>setError(e.message))}else{setLoginIntent('login');setLoginOpen(true)}}}/> : <header className="dq-nav">
      <Link className="dq-brand" to="/duck-race"><img src="/assets/duck-race/duckee/yellow/idle/0.png" alt="" draggable="false" /><img className="dq-lettering-image" src="/assets/duck-race/lettering-ai-v5/brand-title.svg" width="260" height="128" alt="Quiz Duck Race" draggable="false"/></Link>
      <div className="dq-nav-center">{code ? <><span className={`dq-dot ${connected ? 'is-online' : ''}`} /><span><S text="Phòng"/> <strong>{code}</strong></span></> : <span><S text="Đua Vịt Chiến Thuật"/></span>}</div>
      <div className="dq-nav-actions">{racing ? <strong className="dq-clock">{clock(snap!.endsAt - now)}</strong> : <button className="dq-link" onClick={() => setRules(true)}><S text="Cách chơi" bold/></button>}<Link className="dq-link" to="/"><S text="Đổi game"/></Link></div>
    </header>}
    {loginOpen&&<GoogleHostLogin brand={{src:"/assets/duck-race/lettering-ai-v5/brand-title.svg",title:"Quiz Duck Race"}} intent={loginIntent} onClose={()=>setLoginOpen(false)} onSuccess={({token})=>{setHostSession(token);setLoginOpen(false);if(loginIntent==='create')void create(true)}}/>}
    {error && <div className="dq-toast" role="alert">{error}<button onClick={() => setError('')} aria-label="Đóng thông báo"><Icon name="close" /></button></div>}
    {!snap && (!session || !code) ? <div className="dq-home">
      <section className="dq-intro"><h1><img className="dq-lettering-image" src="/assets/duck-race/lettering-ai-v5/hero-title.svg" width="590" height="295" alt="Biết đáp án. Chọn thời điểm bứt phá." draggable="false"/></h1><p><S text="Trả lời để kiếm vốn. Đầu tư để lăn bứt tốc."/><br /><S text="Giữ quỹ hay dốc điểm về đích — bạn quyết định."/></p><button className="dq-primary" disabled={busy} onClick={()=>void create()}><Icon name="flag" /><S text="Tạo đường đua" bold/><Icon name="arrow" /></button><span className="dq-home-note"><S text="10 phút · Tối đa 50 người chơi"/></span></section>
      <section className="dq-join"><h2>{code ? <S text="Sẵn sàng vào đường đua?" bold/> : <S text="Tham gia đường đua" bold/>}</h2><form onSubmit={join}>
        <label><S text="Mã phòng" bold/><span className="dq-field-art"><FieldFocus/><input value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} placeholder="D1A2B3C" required maxLength={7} autoCapitalize="characters" autoComplete="off" />{!roomCode && <span className="dq-placeholder-art" aria-hidden="true"><S text="D1A2B3C"/></span>}</span></label>
        <label><S text="Tên người chơi" bold/><span className="dq-count">{[...name].length}<S text="/32" bold/></span><span className="dq-field-art"><FieldFocus/><input value={name} onChange={e => setName(e.target.value)} placeholder="Bạn tên là gì?" required maxLength={64} />{!name && <span className="dq-placeholder-art" aria-hidden="true"><S text="Bạn tên là gì?"/></span>}</span></label>

        <button className="dq-primary dq-wide" disabled={busy || !name.trim()} type="submit">{busy ? <S text="Đang vào…" bold/> : <S text="Vào đường đua" bold/>}<Icon name="arrow" /></button>
      </form></section>
      <div className="dq-home-track"><RaceTrack players={DEMO} hazards={[]} now={now} /><span><S text="Khúc xuất phát · Xem trước bản đồ"/></span></div>
    </div> : !snap ? <section className="dq-loading"><img src="/assets/duck-race/duckee/yellow/walk_run/0.png" alt="" /><h1><S text="Đang vào đường đua…" bold/></h1><p>{error ? <S text="Kiểm tra lại mã hoặc kết nối rồi thử lại."/> : <S text="Đang nhận trạng thái phòng từ máy chủ."/>}</p><Link to="/duck-race" className="dq-link"><S text="Về sảnh"/></Link></section> : <>
      {snap.phase === 'lobby' && <div className="dq-lobby">
        <section className="dq-lobby-invite"><h1>{host ? <S text="Mời cả lớp vào cuộc đua." bold/> : <><S text="Chào" bold/> {me?.name || <S text="bạn"/>}<S text="!"/></>}</h1><p>{host ? <S text="Chia sẻ mã hoặc quét QR. Khi mọi người đã sẵn sàng, bắt đầu ván 10 phút."/> : <S text="Vịt của bạn đã sẵn sàng. Chờ chủ phòng phát lệnh xuất phát."/>}</p>
          <div className="dq-room-code">{code}</div>{host && qr && <img className="dq-qr" src={qr} alt={`Mã QR vào phòng ${code}`} />}
          {!host && me && <img className="dq-my-duck" src={duckImage(me)} alt="Vịt bạn đã chọn" />}
          <button className="dq-secondary" onClick={copy}><Icon name="copy" />{copied ? <S text="Đã sao chép" bold/> : <S text="Sao chép liên kết" bold/>}</button>
          <p className="dq-lobby-rule"><S text="Trả lời đúng: 100–200 điểm."/><br /><S text="50 điểm = 1% bứt tốc · 150 điểm = 4% bứt tốc."/><br /><S text="Chạy hết đường đua để cán đích."/></p>
          {host && <button className="dq-primary dq-wide" disabled={busy || !connected || !snap.players.length} onClick={() => action('start')}><Icon name="flag" />{snap.players.length ? <S text="Bắt đầu cuộc đua" bold/> : <S text="Chờ người chơi" bold/>}</button>}
        </section>
        <section className="dq-roster">{!host&&me&&<button className="dq-secondary" onClick={()=>setEquipment(true)}><S text="Thay đổi nhận diện" bold/></button>}<div className="dq-section-heading"><h2><S text="Đã vào sân" bold/> <span>{snap.players.length}<S text="/50" bold/></span></h2><span><S text="10 phút / ván"/></span></div><div className="dq-roster-grid">{snap.players.map(p => <div className="dq-roster-person" key={p.id}><img src={duckImage(p)} alt="" /><strong title={p.name}>{p.name}</strong><span className={`dq-dot ${p.connected ? 'is-online' : ''}`} aria-label={p.connected ? 'Đã kết nối' : 'Mất kết nối'} /></div>)}</div>{!snap.players.length && <p className="dq-empty"><S text="Những chú vịt đầu tiên sẽ xuất hiện ở đây."/></p>}</section>
      </div>}
      {snap.phase === 'countdown' && <section className="dq-countdown"><RaceTrack players={snap.players} hazards={[]} now={now} /><div><span><S text="Chuẩn bị xuất phát"/></span><strong>{Math.max(1, Math.ceil((snap.startedAt - now) / 1000))}</strong><p><S text="Giữ hướng để di chuyển. Kiếm điểm để bứt tốc."/></p></div></section>}
      {(racing || finished) && <div className={`dq-race-layout ${finished ? 'is-finished' : ''}`}>
        <section className="dq-race-stage"><div className="dq-stage-title"><h1>{me?.capturedAt ? <S text="Lượt của bạn đã kết thúc" bold/> : finished ? <S text="Cuộc đua đã khép lại" bold/> : host ? <S text="Đường đua trực tiếp" bold/> : <><S text="Vịt của" bold/> {me?.name}</>}</h1><span>{finished ? snap.finishReason === 'finish' ? <S text="Đã có vịt cán đích"/> : <S text="Xếp hạng theo quỹ dự trữ"/> : <>{snap.players.length} <S text="vịt · Đua về đích"/></>}</span></div><RaceTrack players={snap.players} hazards={snap.hazards} wind={racing ? snap.wind : undefined} now={now} serverTime={snap.serverTime} running={racing} cameraMode={cameraMode} me={host ? undefined : me?.id} intent={host ? undefined : motionIntent} compact={!host} />
          {racing&&!host&&!me?.capturedAt&&<section className="dq-driving" aria-label="Điều khiển vịt"><div className="dq-dpad"><button aria-label="Đi lên W" {...controlButton('KeyW')}><S text="W" bold/></button><button aria-label="Đi trái A" {...controlButton('KeyA')}><S text="A" bold/></button><button aria-label="Đi xuống S" {...controlButton('KeyS')}><S text="S" bold/></button><button aria-label="Đi phải D" {...controlButton('KeyD')}><S text="D" bold/></button></div><div className="dq-arcade-actions"><button disabled={!canAct} onClick={() => action('jump')}><S text="Nhảy" bold/><kbd><S text="Space" bold/></kbd></button><button disabled={!racing || !connected} {...controlButton('ShiftLeft')}><S text="Giữ cúi" bold/><kbd><S text="Shift" bold/></kbd></button><button disabled={!canAct} onClick={() => action('attack')}><S text="Đánh" bold/><kbd><S text="Chuột trái" bold/></kbd></button><button disabled={!canAct} {...controlButton('MouseRight')}><S text="Đỡ đòn" bold/><kbd><S text="Chuột phải" bold/></kbd></button><button className="dq-roll-control" disabled={!canAct || (me?.points || 0) < boostPrice} onClick={() => action('buy', { kind: 'boost' })}><S text="Chạy nhanh ·" bold/> {boostPrice}<kbd><S text="E" bold/></kbd></button></div><p><S text="Vật cản ngẫu nhiên · Không có làn · Thả phím để đứng yên"/></p></section>}
          {racing&&!host&&!me?.capturedAt&&guide&&<aside className="dq-stage-guide"><p><S text="W A S D: di chuyển · Thả phím: dừng · Space: nhảy đôi · Shift: cúi"/></p><p><S text="Chuột trái: đánh · Giữ chuột phải: đỡ · E: chạy nhanh"/></p><p><S text="Bấm nút tương ứng trên màn hình khi chơi điện thoại."/></p><button onClick={()=>setGuide(false)}><S text="Đã hiểu" bold/></button></aside>}
          <div className="dq-stage-bottom">{host && <div className="dq-camera-switch" aria-label="Chế độ camera"><button className={cameraMode === 'leader' ? 'is-active' : ''} onClick={() => setCameraMode('leader')}><S text="Bám dẫn đầu" bold/></button><button className={cameraMode === 'wealth' ? 'is-active' : ''} onClick={() => setCameraMode('wealth')}><S text="Spotlight quỹ cao nhất" bold/></button></div>}<span><i className="dq-track-key" />{snap.hazards.filter(h => h.category === 'environment').length ? <S text="Chướng ngại: tránh va chạm hoặc dùng khiên."/> : <S text="Chướng ngại cố định phía trước · Môi trường thay đổi mỗi 30 giây"/>}</span>{host && racing && <button className="dq-link" onClick={() => { if (window.confirm('Kết thúc và chốt kết quả ngay?')) void action('end') }}><S text="Kết thúc sớm" bold/></button>}</div>
        </section>
        {finished ? <section className="dq-results"><h2>{me?.capturedAt ? <S text="Vịt đã bị bắt · Điểm đã chốt" bold/> : host ? <S text="Bảng tổng kết" bold/> : <><S text="Bạn đạt hạng" bold/> {me?.rank ?? '—'}</>}</h2><p>{me?.capturedAt ? snap.phase==='finished' ? <><S text="Điểm đã chốt khi bị bắt. Hạng cuối cùng:"/> {me.rank}</> : <S text="Lượt của bạn đã kết thúc. Các vịt khác vẫn tiếp tục đua; hạng cuối cùng được xác nhận khi hết trận."/> : snap.finishReason === 'finish' ? <S text="Vịt cán đích đầu tiên giành chiến thắng."/> : <S text="Quỹ dự trữ quyết định thứ hạng; bằng điểm xét quãng đường."/>}</p>
          {host ? <div className="dq-podium">{snap.players.slice(0, 3).map(p => <div key={p.id} className={`dq-winner rank-${p.rank}`}><img src={duckImage(p)} alt="" /><span><S text="HẠNG"/> {p.rank}</span><strong title={p.name}>{p.name}</strong><b>{p.points.toLocaleString('vi-VN')} <S text="điểm" bold/></b><small>{p.progress.toFixed(1)}<S text="% đường đua"/></small></div>)}</div> : me && <div className="dq-personal-result"><img src={duckImage(me)} alt="Vịt của bạn" /><h3>{me.name}</h3><strong>{me.points.toLocaleString('vi-VN')} <S text="điểm" bold/></strong><p>{me.progress.toFixed(1)} <S text="bước ·"/> {me.correct}<S text="/"/>{me.answered} <S text="câu đúng"/></p></div>}
          {host && <Ranking snap={snap} page={page} setPage={setPage} />}
          <h3><S text="Nhật ký" bold/> {host ? <S text="cuộc đua" bold/> : <S text="của bạn" bold/>}</h3><div className="dq-log">{snap.logs.slice(page * 10, page * 10 + 10).map(l => <p key={l.id}>{l.text}</p>)}</div>
          <Link to="/duck-race" className="dq-primary"><S text="Về sảnh đua"/><Icon name="arrow" /></Link>
        </section> : host ? <aside className="dq-rank-panel"><div className="dq-section-heading"><h2><S text="Đua top" bold/></h2><span><S text="Quãng đường"/></span></div><Ranking snap={snap} page={page} setPage={setPage} /><h3><S text="Vừa diễn ra" bold/></h3><div className="dq-live-log" aria-live="polite">{snap.logs.slice(0, 4).map(l => <p key={l.id}>{l.text}</p>)}</div></aside> : <section className="dq-controls">
          <div className="dq-wallet"><div><span><S text="Quỹ dự trữ"/></span><strong><Icon name="coin" />{me?.points.toLocaleString('vi-VN')}<small><S text="điểm" bold/></small></strong></div><div><span><S text="Tiến trình"/></span><strong>{me?.progress.toFixed(1)}<small><S text="% đường đua" bold/></small></strong></div><div><span><S text="Thứ hạng"/></span><strong><S text="#" bold/>{me?.rank}</strong></div></div>
          
          <button className="dq-question-toggle dq-primary" onClick={()=>setQuestionOpen(true)}><S text="Trả lời câu hỏi" bold/></button><div className={`dq-study-panel ${questionOpen?'is-open':''}`}><section className={`dq-question ${questionOpen?'is-open':''}`}><button className="dq-question-close" onClick={()=>setQuestionOpen(false)}><S text="Đóng"/></button><div className="dq-question-meta"><strong><S text="Câu" bold/> {question?.number}</strong><span>{answer ? answer.selected === answer.correct ? <S text="Chính xác!"/> : <S text="Cùng xem đáp án"/> : clock((question?.deadline || 0) - now)}</span></div><div className="dq-time-strip"><i style={{ width: `${Math.max(0, Math.min(100, ((question?.deadline || 0) - now) / 200))}%` }} /></div><h2>{question?.prompt}</h2><div className="dq-answers">{question?.options.map((o, i) => <button key={o.id} disabled={!canAct || !!answer} className={answer ? o.id === answer.correct ? 'is-correct' : o.id === answer.selected ? 'is-wrong' : '' : ''} onClick={() => {void action('answer', { questionId: question.id, choice: o.id })}}><b><S text={'ABCD'[i]} bold/></b><span>{o.text}</span></button>)}</div>
            {answer ? <div className="dq-answer-feedback" role="status"><strong>{answer.reward ? <>+{answer.reward} <S text="điểm" bold/></> : <S text="Không nhận điểm" bold/>}{answer.stake && !answer.reward ? <> <S text="· mất"/> {answer.stake} <S text="điểm cược"/></> : ''}</strong><p>{answer.explanation}</p><small><S text="Câu kế tiếp sau"/> {clock(answer.nextAt - now)}</small></div> : <button className={`dq-star ${snap.starArmed ? 'is-armed' : ''}`} disabled={!canAct || snap.starUsed || snap.starArmed || (me?.points || 0) < 100} onClick={() => action('star')}><Icon name="star" /><span>{snap.starArmed ? <><S text="Đã cược"/> {snap.stake} <S text="điểm · đúng nhận thưởng gấp đôi"/></> : snap.starUsed ? <S text="Đã dùng Ngôi sao" bold/> : <S text="Ngôi sao · cược tối đa 200 điểm" bold/>}<small><S text="Đúng: thưởng ×2 và hoàn cược. Sai: mất cược. Một lần/ván." bold/></small></span></button>}
          </section>
          <section className="dq-invest"><div className="dq-section-heading"><h2><S text="Chạy nhanh bằng điểm" bold/></h2><span>{me?.discount ? <><S text="Giảm 20% · còn"/> {me.discount} <S text="lượt"/></> : <S text="Giữ điểm hay bứt phá?"/>}</span></div><div className="dq-buy-row"><button className="dq-secondary" disabled={!canAct || (me?.points || 0) < stepPrice || (me?.target || 0) >= 100} onClick={() => action('buy', { kind: 'step' })}><Icon name="arrow" /><span><S text="Bứt tốc +" bold/>{me?.tailwind ? 2 : 1}<small>{stepPrice} <S text="điểm" bold/></small></span></button><button className="dq-primary" disabled={!canAct || (me?.points || 0) < boostPrice || (me?.target || 0) >= 100} onClick={() => action('buy', { kind: 'boost' })}><Icon name="bolt" /><span><S text="Chạy nhanh +" bold/>{me?.tailwind ? 5 : 4}<small>{boostPrice} <S text="điểm" bold/></small></span></button></div>{me && me.target > me.progress && <p className="dq-queued"><S text="Còn"/> {Math.max(0, me.target - me.progress).toFixed(1)} <S text="% bứt tốc ·"/> {me.stunnedUntil > now ? <S text="Đang khựng vì va chạm"/> : <S text="Giữ hướng tiến để sử dụng"/>}</p>}
          </section>
          <section className="dq-cards"><h2><Icon name="card" /><S text="Thẻ may mắn" bold/> <span>{snap.cards?.length || 0}<S text="/3" bold/></span>{!!me?.shield && <small><S text="Khiên bảo hộ:" bold/> {me.shield}</small>}</h2>{snap.cards?.length ? <div className="dq-card-list">{snap.cards.map((c: CardKind, i: number) => <button key={`${i}-${c}`} disabled={!canAct} onClick={() => action('card', { index: i })}><Icon name={c === 'shield' ? 'star' : c === 'boost' ? 'bolt' : 'card'} /><strong><S text={CARDS[c].title} bold/></strong><span><S text={CARDS[c].description}/></span><small><S text="Dùng thẻ" bold/><Icon name="arrow" /></small></button>)}</div> : <p><S text="Nhận thẻ ngẫu nhiên sau mỗi 3–5 câu đã trả lời."/></p>}</section>
        </div></section>}
      </div>}
    </>}
    {equipment&&me&&snap?.phase==='lobby'&&<EquipmentDrawer me={me} onClose={()=>setEquipment(false)} onSave={async data=>{try{accept(await request<RaceSnapshot>(`/rooms/${code}/action`,{type:'customize',...data},session!.token))}catch(e){setError((e as Error).message);throw e}}}/> }
    {rules && <div className="dq-modal-backdrop" onClick={() => setRules(false)}><section className="dq-rules" role="dialog" aria-modal="true" aria-labelledby="dq-rules-title" onClick={e => e.stopPropagation()}><button className="dq-modal-close" autoFocus onClick={() => setRules(false)} aria-label="Đóng cách chơi"><Icon name="close" /></button><h2 id="dq-rules-title"><S text="Kiếm vốn. Chạy chiến thuật." bold/></h2><ol><li><strong><S text="Trả lời trong 20 giây." bold/></strong> <S text="Đúng được 100–200 điểm, càng nhanh càng nhiều. Sai không có điểm."/></li><li><strong><S text="Di chuyển bằng phím, chủ động né tránh." bold/></strong> <S text="WASD hoặc phím mũi tên để di chuyển, thả phím đứng yên. Vật cản cố định theo X, có vị trí và chiều dài ngẫu nhiên theo Y. Tường kín cần đi vòng; rào thấp cần nhảy; ụ cao cần nhảy đôi; thanh treo cần cúi hoặc lăn. Space nhảy đôi; Shift cúi. E mua bứt tốc, giữ hướng tiến để dùng quãng đường đã mua. Va chạm vẫn áp dụng khi chạy nhanh."/></li><li><strong><S text="Thẻ sau 3–5 câu." bold/></strong> <S text="Túi giữ tối đa 3 thẻ. Đá và lốc bụi có thể né; rào ngang cần nhảy, thanh thấp cần cúi. Chuột trái để đánh; giữ chuột phải để đỡ. Đỡ trong 0,26 giây đầu sẽ phản đòn. Bên trúng đòn bị văng và choáng 1,5 giây."/></li><li><strong><S text="Ngôi sao dùng một lần." bold/></strong> <S text="Cược 100–200 điểm trước khi trả lời: đúng nhận gấp đôi thưởng và hoàn cược; sai mất cược."/></li><li><strong><S text="Chạy hết đường đua." bold/></strong> <S text="Vịt cán đích đầu tiên thắng. Hết 10 phút chưa ai về đích: ai giữ nhiều điểm nhất thắng, bằng điểm xét quãng đường."/></li></ol><button className="dq-primary" onClick={() => setRules(false)}><S text="Đã hiểu" bold/><Icon name="arrow" /></button></section></div>}
  </main>
}
function Ranking({ snap, page, setPage }: { snap: RaceSnapshot; page: number; setPage: (n: number) => void }) {
  const pages = Math.max(1, Math.ceil(snap.players.length / 10))
  return <><ol className="dq-ranking">{snap.players.slice(page * 10, page * 10 + 10).map(p => <li key={p.id}><span>{p.rank}</span><img src={duckImage(p)} alt="" /><div><strong title={p.name}>{p.name}</strong><small>{p.points.toLocaleString('vi-VN')} <S text="điểm"/></small></div><b>{p.progress.toFixed(1)}<small><S text="% đường đua" bold/></small></b></li>)}</ol>{pages > 1 && <nav className="dq-pagination" aria-label="Trang bảng xếp hạng"><button disabled={!page} onClick={() => setPage(page - 1)}><S text="Trước" bold/></button><span>{page + 1}<S text="/"/>{pages}</span><button disabled={page >= pages - 1} onClick={() => setPage(page + 1)}><S text="Sau" bold/></button></nav>}</>
}



