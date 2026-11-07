import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import type Phaser from 'phaser'
import type { RaceLog, RaceSnapshot } from '../../contracts'
import { awardPad, resultPlayers, type ResultPlayer } from './motion'
import type { AwardsFrame, AwardsInput } from './createAwardsGame'
import './results.css'
import { WardrobePortrait } from '../WardrobePortrait'
import { GroupName } from '../GroupName'

const captions = {
  intro: 'Chuẩn bị trao giải',
  third: 'Hạng 3 trượt ván đến cúp và nâng thẻ đồng số 3',
  second: 'Hạng 2 đu dây xuống cúp và nâng huy chương bạc',
  first: 'Nhà vô địch đáp dù xuống cúp',
  stow: 'Đã tiếp đất · gấp và cất dù',
  retrieve: 'Lấy vương miện từ phía sau',
  raise: 'Giơ cao vương miện',
  hold: 'Khoảnh khắc chiến thắng',
  wear: 'Đội vương miện lên đầu',
  final: 'Chúc mừng các nhóm dẫn đầu',
}
const points = (value: number) => value.toLocaleString('vi-VN') + ' điểm'

function Portrait({ player }: { player: ResultPlayer }) {
  return <WardrobePortrait player={player} />
}

function ResultsHistory({ logs, onClose }: { logs: RaceLog[]; onClose: () => void }) {
  const [page, setPage] = useState(0)
  const close = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    close.current?.focus()
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [onClose])

  function containFocus(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Tab') return
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
    const first = buttons[0]
    const last = buttons.at(-1)
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  return (
    <div className="q4-scrim" onClick={event => { if (event.currentTarget === event.target) onClose() }}>
      <section className="q4-awards-history q4-paper" role="dialog" aria-modal="true"
        aria-labelledby="q4-results-history-title" onKeyDown={containFocus}>
        <header>
          <h2 id="q4-results-history-title">Lịch sử sự kiện</h2>
          <button ref={close} className="q4-action q4-forest" onClick={onClose}>Đóng</button>
        </header>
        <ul>{logs.slice(page * 10, page * 10 + 10).map(log => <li key={log.id}>{log.text}</li>)}</ul>
        {!logs.length && <p>Chưa có sự kiện.</p>}
        {logs.length > 10 && (
          <nav className="q4-history-pages" aria-label="Trang lịch sử">
            <button disabled={!page} onClick={() => setPage(value => value - 1)}>Trước</button>
            <span>{page + 1}/{Math.ceil(logs.length / 10)}</span>
            <button disabled={(page + 1) * 10 >= logs.length} onClick={() => setPage(value => value + 1)}>Sau</button>
          </nav>
        )}
      </section>
    </div>
  )
}

export function HostResults({ snapshot, reduced }: { snapshot: RaceSnapshot; reduced: boolean }) {
  // Capture terminal standings once so socket heartbeats cannot restart the ceremony.
  const [players] = useState(() => resultPlayers(snapshot.players))
  const [history, setHistory] = useState(false)
  const [paused, setPaused] = useState(false)
  const [replay, setReplay] = useState(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [frame, setFrame] = useState<AwardsFrame | null>(null)
  const mount = useRef<HTMLDivElement>(null)
  const historyTrigger = useRef<HTMLButtonElement>(null)
  const current = useRef<AwardsInput>({ players, reduced, paused, replay })

  useEffect(() => {
    current.current = { players, reduced, paused: paused || history, replay }
  }, [players, reduced, paused, history, replay])

  useEffect(() => {
    let stopped = false
    let game: Phaser.Game | undefined
    let observer: ResizeObserver | undefined

    void import('./createAwardsGame').then(({ createAwardsGame }) => {
      if (stopped || !mount.current) return
      game = createAwardsGame(mount.current, () => current.current, {
        ready: () => { if (!stopped) setReady(true) },
        frame: state => { if (!stopped) setFrame(state) },
        error: message => { if (!stopped) setError(message) },
      })
      observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect
        if (game?.isBooted && width > 0 && height > 0) {
          game.scale.resize(Math.round(width), Math.round(height))
        }
      })
      observer.observe(mount.current)
    }).catch(() => {
      if (!stopped) setError('Không mở được lễ trao giải. Vui lòng thử lại.')
    })

    return () => {
      stopped = true
      observer?.disconnect()
      game?.destroy(true, false)
    }
  }, [attempt])

  const phase = frame?.phase ?? 'intro'
  const focusRank = phase === 'third' ? 3 : phase === 'second' ? 2 : 1
  const focus = players.find(player => player.rank === focusRank)
  const closeHistory = useCallback(() => {
    setHistory(false)
    historyTrigger.current?.focus()
  }, [])

  const showFocus = players.length > 0 && phase !== 'intro' && focus

  return (
    <section className="q4-host-results" aria-label="Tổng kết cuộc đua"
      data-results-phase={phase} data-results-ready={ready}>
      <div className="q4-awards-stage" data-award-phase={phase}>
        <div ref={mount} className="q4-awards-mount" />
        <div className="q4-awards-heading" role="status">
          <p>{players.length ? captions[phase] : 'Cuộc đua đã khép lại'}</p>
          {showFocus ? <>
            <h1><GroupName name={focus.name} /></h1>
            <div className="q4-awards-heading-score">{points(focus.points)}</div>
          </> : <h1>{players.length ? 'Một cuộc đua. Ba vị trí dẫn đầu.' : 'Chưa có nhóm tham gia'}</h1>}
        </div>
        {!ready && !error && <p className="q4-awards-loading" role="status">Đang mở lễ trao giải…</p>}
        {error && (
          <div className="q4-awards-error" role="alert">
            <p>{error}</p>
            <button className="q4-action q4-amber" onClick={() => {
              setError('')
              setReady(false)
              setFrame(null)
              setAttempt(value => value + 1)
            }}>Thử lại</button>
            <ol>{players.map(player => (
              <li key={player.id}>Hạng {player.rank} · {player.name} · {points(player.points)}</li>
            ))}</ol>
          </div>
        )}
        {frame && !error && players.filter(player => player.rank <= 3).map(player => {
          const pad = awardPad(player.rank, frame.layout)
          const visible = frame.revealed.includes(player.rank)
          return (
            <div key={player.id} className={`q4-awards-label ${visible ? 'is-visible' : ''}`}
              style={{ left: pad.x, top: pad.labelY, width: pad.labelWidth }} aria-hidden={!visible} inert={!visible}>
              <b>Hạng {player.rank}</b>
              <strong><GroupName name={player.name} /></strong>
              <span>{points(player.points)}</span>
            </div>
          )
        })}
      </div>
      <div className="q4-awards-remaining">
        <h2>Các nhóm còn lại</h2>
        <ol>{players.filter(player => player.rank > 3).map(player => (
          <li key={player.id}>
            <b>{player.rank}</b><Portrait player={player} />
            <div><strong><GroupName name={player.name} /></strong><span>{points(player.points)}</span></div>
          </li>
        ))}</ol>
        {!players.some(player => player.rank > 3) && <p>{players.length} nhóm tham gia</p>}
      </div>
      <div className="q4-awards-actions">
        <button className="q4-action q4-forest" disabled={!ready} onClick={() => {
          setPaused(false)
          setReplay(value => value + 1)
        }}>Phát lại trao giải</button>
        <button className="q4-back-link" disabled={!ready || reduced || frame?.done}
          onClick={() => setPaused(value => !value)}>{paused ? 'Tiếp tục' : 'Tạm dừng'}</button>
        <button ref={historyTrigger} className="q4-back-link" onClick={() => setHistory(true)}>Lịch sử sự kiện</button>
        <Link className="q4-action q4-amber" to="/duck-race">Về trang trò chơi</Link>
      </div>
      <ol className="q4-sr" aria-label="Kết quả đã chốt">{players.map(player => (
        <li key={player.id}>Hạng {player.rank}, {player.name}, {points(player.points)}</li>
      ))}</ol>
      {history && <ResultsHistory logs={snapshot.logs} onClose={closeHistory} />}
    </section>
  )
}
