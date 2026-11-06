import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { StaticArt as S } from '../StaticArt'
import { useGameSurfaceInput } from '../useGameSurfaceInput'
import { PhaserRaceView } from './PhaserRaceView'
import { PreviewSimulation } from './bridge/PreviewSimulation'
import { approvedCrawlCourse } from './world/crawlGate'
import type { HeldControl, InputController } from './bridge/InputController'
import './phaser-preview.css'
import '../game-surface-input.css'

const root = '/assets/duck-race/'
const clock = (ms: number) => `${Math.floor(Math.max(0, ms) / 60000)}:${String(Math.floor(Math.max(0, ms) / 1000) % 60).padStart(2, '0')}`
function Glyph({ kind }: { kind: 'coin' | 'flag' | 'cup' | 'close' | 'exit' | 'star' }) {
  const paths = {
    coin: <><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 4 16 4 16 0V6M4 12c0 4 16 4 16 0"/></>,
    flag: <><path d="m5 21 2-18M7 4c5-5 8 4 14-1l-1 10c-6 5-9-4-14 1"/></>,
    cup: <><path d="M7 3h10v6a5 5 0 0 1-10 0ZM7 5H3v3a4 4 0 0 0 5 4M17 5h4v3a4 4 0 0 1-5 4M12 14v6M7 21h10"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>, exit: <path d="M10 4H4v16h6M12 7l5 5-5 5M8 12h12"/>,
    star: <path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z"/>,
  }
  return <svg className="ph-glyph" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>
}
export function PhaserPreview() {
  const surfaceInput = useGameSurfaceInput()
  const [simulation] = useState(() => new PreviewSimulation(approvedCrawlCourse())), [, render] = useState(0), [open, setOpen] = useState(false)
  const input = useRef<InputController | undefined>(undefined), dialog = useRef<HTMLElement>(null), opener = useRef<HTMLButtonElement>(null)
  const me = simulation.me, question = simulation.question, answered = !!simulation.answeredAt
  useEffect(() => {
    const timer = setInterval(() => render(n => n + 1), 100), unsubscribe = simulation.subscribe(() => render(n => n + 1))
    return () => { clearInterval(timer); unsubscribe() }
  }, [simulation])
  useEffect(() => {
    input.current?.setEnabled(!open)
    if (open) dialog.current?.querySelector<HTMLButtonElement>('button')?.focus()
    else opener.current?.focus({ preventScroll: true })
  }, [open])
  useEffect(() => {
    const desktop = window.matchMedia('(min-width:1024px)')
    const changed = () => { if (desktop.matches) setOpen(false) }
    desktop.addEventListener('change', changed)
    return () => desktop.removeEventListener('change', changed)
  }, [])
  useEffect(() => {
    if (!open) return
    const key = (event: KeyboardEvent) => {
      if (event.code === 'Escape') { setOpen(false); return }
      if (event.code !== 'Tab') return
      const elements = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || [])
      const first = elements[0], last = elements.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key)
  }, [open])
  const hold = (control: HeldControl) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); input.current?.setHeld(`touch-${e.pointerId}`, control, true) },
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => input.current?.setHeld(`touch-${e.pointerId}`, control, false),
    onPointerCancel: (e: PointerEvent<HTMLButtonElement>) => input.current?.setHeld(`touch-${e.pointerId}`, control, false),
    onLostPointerCapture: (e: PointerEvent<HTMLButtonElement>) => input.current?.setHeld(`touch-${e.pointerId}`, control, false),
    onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); input.current?.setHeld(`key-button-${control}`, control, true) } },
    onKeyUp: () => input.current?.setHeld(`key-button-${control}`, control, false),
    onBlur: () => input.current?.setHeld(`key-button-${control}`, control, false),
  })
  return <main className="ph-preview" translate="no" {...surfaceInput}>
    <header className="ph-nav ph-hud" inert={open}>
      <Link to="/duck-race" aria-label="Quiz Duck Race"><img src={root + 'lettering-ai-v5/brand-title.svg'} width="150" height="64" alt="Quiz Duck Race" draggable="false"/></Link>
      <span className="ph-room">Bản thử Phaser · khe bò đã duyệt</span>
      <div><strong className="ph-clock">{clock(simulation.remaining)}</strong><Link className="ph-exit" to="/duck-race"><Glyph kind="exit"/><span><S text="Thoát"/></span></Link></div>
    </header>
    <div className="ph-layout">
      <section className="ph-stage" aria-label="Đường đua" inert={open}>
        <PhaserRaceView source={simulation} onInput={controller => { input.current = controller; controller?.setEnabled(!open) }}/>
        <div className="ph-player-hud ph-hud">
          <div className="ph-name"><span><S text="Vịt của bạn:"/></span><strong title={me.name}>{me.name}</strong></div>
          <div><Glyph kind="coin"/><strong>{me.points}</strong><small><S text="điểm"/></small></div>
          <div className="ph-progress"><Glyph kind="flag"/><strong>{me.progress.toFixed(1)}%</strong><progress value={me.progress} max="100" aria-label="Tiến trình"/></div>
          <div><Glyph kind="cup"/><strong>#{me.rank}</strong></div>
        </div>
        <button ref={opener} className="ph-question-launch ph-action" onClick={() => setOpen(true)}><S text="Trả lời câu hỏi" bold/><span>{clock(20000 - simulation.now + simulation.questionAt)}</span></button>
        <div className="ph-mobile-cards" aria-label="Ba ô thẻ may mắn trống">{[0, 1, 2].map(i => <div className="ph-card-back" key={i}><img src={root + 'portraits-v6/duckee/yellow.webp'} alt="" draggable="false"/></div>)}</div>
        <section className="ph-driving" aria-label="Điều khiển vịt">
          <div className="ph-dpad">{(['up', 'left', 'down', 'right'] as const).map((control, i) => <button className="ph-key" key={control} aria-label={['Đi lên W', 'Đi trái A', 'Đi xuống S', 'Đi phải D'][i]} {...hold(control)}><S text={['W', 'A', 'S', 'D'][i]} bold/></button>)}</div>
          <div className="ph-moves">
            <button className="ph-move" onClick={() => input.current?.action('jump')}><img src={root + 'native-v12/duckee/yellow/jump/0.png'} alt="" draggable="false"/><S text="Nhảy" bold/><kbd>Space</kbd></button>
            <button className="ph-move" {...hold('crouch')}><img src={root + 'duckee/yellow/crouch/0.png'} alt="" draggable="false"/><S text="Giữ cúi" bold/><kbd>Shift</kbd></button>
            <button className="ph-move" onClick={() => input.current?.action('attack')}><img src={root + 'duckee/yellow/attack_idle/2.png'} alt="" draggable="false"/><S text="Đánh" bold/><kbd>Chuột trái</kbd></button>
            <button className="ph-move" {...hold('guard')}><img src={root + 'duckee/yellow/guard/0.png'} alt="" draggable="false"/><S text="Đỡ đòn" bold/><kbd>Chuột phải</kbd></button>
            <button className="ph-move" disabled={me.points < 150} onClick={() => input.current?.action('roll')}><img src={root + 'native-v12/duckee/yellow/roll/1.png'} alt="" draggable="false"/><S text="Lăn" bold/><kbd>E · 150</kbd></button>
          </div>
        </section>
      </section>
      {open && <div className="ph-sheet-scrim" onClick={() => setOpen(false)} aria-hidden="true"/>}
      <aside className={`ph-sidebar ${open ? 'ph-open' : ''}`}>
        <section className="ph-question" ref={dialog} role={open ? 'dialog' : undefined} aria-modal={open || undefined} aria-labelledby="ph-question-title" onFocusCapture={() => input.current?.release()}>
          <div className="ph-question-heading"><strong><S text="Câu" bold/> {simulation.questionIndex + 1}</strong><span>{clock(20000 - simulation.now + simulation.questionAt)}</span><button className="ph-close ph-key" aria-label="Đóng câu hỏi" onClick={() => setOpen(false)}><Glyph kind="close"/></button></div>
          <progress className="ph-time" value={Math.max(0, 20000 - simulation.now + simulation.questionAt)} max="20000" aria-label="Thời gian trả lời"/>
          <h1 id="ph-question-title">{question.prompt}</h1>
          <div className="ph-options">{question.options.map((option, i) => <button key={i} disabled={answered || !simulation.remaining} className={`ph-answer ${answered && i === question.correct ? 'is-correct' : answered && i === simulation.selection ? 'is-wrong' : ''}`} onClick={() => simulation.answer(i)}><b><S text={'ABCD'[i]} bold/></b><span>{option}</span></button>)}</div>
          {answered ? <p className="ph-explanation" role="status">{simulation.selection === question.correct ? 'Chính xác! ' : 'Đáp án đúng đã được đánh dấu. '}{question.explanation}</p>
            : <button className="ph-star" disabled={simulation.starUsed || me.points < 100} onClick={() => simulation.armStar()}><Glyph kind="star"/>{simulation.star ? <S text="Đã cược 100 điểm"/> : <S text="Ngôi sao · cược 100 điểm"/>}</button>}
        </section>
        <section className="ph-boosts"><h2><S text="Chạy nhanh bằng điểm" bold/></h2><div><button className="ph-action" disabled={me.points < 50} onClick={() => input.current?.action('step')}><Glyph kind="flag"/><strong>50</strong> <S text="điểm"/></button><button className="ph-action" disabled={me.points < 150} onClick={() => input.current?.action('roll')}><Glyph kind="flag"/><strong>150</strong> <S text="điểm"/></button></div></section>
        <section className="ph-boosts" aria-label="Thử gió trong bản Phaser"><h2>Thử gió · bản Phaser</h2><div><button className="ph-action" onClick={()=>simulation.triggerWind(-1)}>← Gió ngược</button><button className="ph-action" onClick={()=>simulation.triggerWind(1)}>Gió xuôi →</button></div><p>{simulation.wind?(simulation.wind.direction===1?'Gió sang phải':'Gió sang trái'):'Gió tự đổi mỗi 30 giây'} · Khi nhảy, đi cùng chiều gió để bay xa hơn.</p></section>
      </aside>
    </div>
    {simulation.feedback && <div className="ph-feedback" role="status">{simulation.feedback}<button aria-label="Đóng thông báo" onClick={() => simulation.clearFeedback()}><Glyph kind="close"/></button></div>}
  </main>
}
