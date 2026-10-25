import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client.ts'
import type { CentennialNotice, Snapshot } from '../api/types.ts'
import { useClock, useRoom } from '../realtime/useRoom.ts'
import { beep } from '../lib/sound.ts'
import { clock, vnd } from '../lib/format.ts'
import { BudgetPanel } from './BudgetPanel.tsx'
import { CentennialReveal } from './CentennialReveal.tsx'
import { EndScreen } from './EndScreen.tsx'
import { EffectBadges, GameTabs, type GameTabsHandle } from './EventPanels.tsx'
import { EventOverview } from './EventOverview.tsx'
import { currentEventEntries, ongoingEventEntries } from '../lib/ongoing-events.ts'
import { EventQuizModal } from './EventQuizModal.tsx'
import { FactoryScene } from './FactoryScene.tsx'
import { GovernanceRiskCard } from './GovernanceRiskCard.tsx'
import { StatCards } from './StatCards.tsx'
import { ThemeIntro } from './ThemeIntro.tsx'
import { TopBar } from './TopBar.tsx'
import { specialStatuses } from '../lib/special-status.ts'
import { TraitNotice } from './TraitNotice.tsx'
import './gameplay.css'
import './responsive-gameplay.css'
import './painted-frames.css'
import './enterprise-canvas.css'

export function PlayScreen() {
  const { code = '' } = useParams()
  const upper = code.toUpperCase()
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(`player:${upper}`))
  const [name, setName] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [muted, setMuted] = useState(() => localStorage.getItem('muted') === '1')
  const [centuryDone, setCenturyDone] = useState(false)
  const [finishedSummary, setFinishedSummary] = useState(false)
  const gameTabs = useRef<GameTabsHandle>(null)
  const { snap, centennial, offline, error } = useRoom(upper, 'player', token)
  const now = useClock(snap)

  useEffect(() => {
    setToken(localStorage.getItem(`player:${upper}`))
  }, [upper])

  async function join() {
    setBusy(true)
    setFormError('')
    try {
      const result = await api<{ playerToken: string }>(`/api/rooms/${upper}/join`, {
        method: 'POST',
        body: { teamName: name },
      })
      localStorage.setItem(`player:${upper}`, result.playerToken)
      setToken(result.playerToken)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Không vào được phòng')
    } finally {
      setBusy(false)
    }
  }

  async function act(path: string, body?: unknown) {
    if (!token) return
    setBusy(true)
    setFormError('')
    try {
      await api(`/api/rooms/${upper}/${path}`, { method: 'POST', body: body ?? {}, playerToken: token })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Lỗi')
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <main className="wrap narrow">
        <h1>Vào phòng {upper}</h1>
        <p className="lead">Mỗi điện thoại là một đội. Không cần tài khoản.</p>
        <input value={name} maxLength={24} placeholder="Tên đội (ví dụ: Nhóm 3)" onChange={(event) => setName(event.target.value)} />
        <small>{name.length}/24 ký tự</small>
        {formError && <p className="warn">{formError}</p>}
        <button type="button" className="btn big" disabled={busy || name.trim().length < 1} onClick={() => void join()}>
          Vào sảnh
        </button>
        <Link to="/" className="textlink">
          Về trang chủ
        </Link>
      </main>
    )
  }

  const scene = snap?.you?.scene
  const theme = snap?.you?.theme
  const status = snap?.room.status
  const showGame = scene && theme && (status === 'playing' || status === 'paused') && scene.introDone
  const storedCentury = snap?.you?.centennial
  const centuryNotice: CentennialNotice | null =
    centennial ??
    (storedCentury && snap?.you ? { teamId: snap.you.id, ...storedCentury, finished: true } : null)
  const century = centuryNotice && centuryNotice.teamId === snap?.you?.id && !centuryDone ? centuryNotice : null
  const youFinished = Boolean(snap?.you?.finished)
  const statuses = scene ? specialStatuses(scene) : []
  const currentEvents = scene?.eventLog?.filter(event => event.year === scene.cycles) ?? []
  const ongoing = scene ? ongoingEventEntries({ effects: scene.activeEffects ?? [], timed: scene.effects, traits: statuses, events: scene.eventLog ?? [], now: youFinished ? snap?.serverNow ?? now : now }) : []

  return (
    <main className={showGame ? 'wrap game-shell gameplay gameplay-responsive' : 'wrap'}>
      {offline && <div className="offline">Mất kết nối, đang nối lại…</div>}
      {!snap && <p className="lead">{error || 'Đang vào phòng…'}</p>}
      {snap && status === 'lobby' && (
        <section className="narrow">
          <h1>Phòng {snap.room.code}</h1>
          <p className="lead">
            Xin chào <b>{snap.you?.teamName}</b>. Đợi {snap.room.hostName} bắt đầu. Đồng hồ {Math.round(snap.room.durationSec / 60)} phút, vốn{' '}
            {vnd(snap.room.startingCapital)}.
          </p>
          <ul className="waitlist">
            {snap.teams.map((team) => (
              <li key={team.id}>{team.teamName}</li>
            ))}
          </ul>
        </section>
      )}
      {snap && status === 'countdown' && <Countdown snapEnds={snap.room.countdownEndsAt} now={now} />}
      {snap && scene && theme && (status === 'playing' || status === 'paused') && !scene.introDone && (
        <>
          <p className="lead center">Đồng hồ đang chạy · ⏱ {clock(snap.paused ? (snap.room.remainingMs ?? 0) : (snap.room.endsAt ?? now) - now)}</p>
          <ThemeIntro key={`${upper}-${snap.you?.id}-${theme.id}`} theme={{ ...theme, factoryName: scene.factoryName }} busy={busy} error={formError} onBegin={(factoryName) => void act('intro', { factoryName })} />
        </>
      )}
      {snap && showGame && scene && (
        <>
          <TopBar
            snap={snap}
            scene={scene}
            now={now}
            rank={snap.you?.rank ?? 1}
            muted={muted}
            onMute={() => {
              const next = !muted
              setMuted(next)
              localStorage.setItem('muted', next ? '1' : '0')
            }}
          />
          {snap.paused && <p className="banner">Chủ phòng đang tạm dừng</p>}
          {formError && <p className="warn">{formError}</p>}
          <section className="game-content">
            <div className="game-stage">
              <TraitNotice traits={statuses} />
              <FactoryScene scene={scene} paused={snap.paused} />
              <EventOverview current={currentEventEntries(currentEvents)} ongoing={ongoing} onShowAll={group => gameTabs.current?.showEvents(group)} />
            </div>
            <div className="game-workspace">
              <GameTabs
                key={`${upper}-${youFinished ? 'finished' : 'playing'}`}
                ref={gameTabs}
                finished={youFinished}
                result={<InlineResult snap={snap} />}
                enterprise={<><StatCards scene={scene} /><EffectBadges effects={[]} traits={scene.traits ?? []} centennial={Boolean(scene.centennial)} pulse={false} /></>}
                risk={<GovernanceRiskCard scene={scene} />}
                riskIncreasing={(scene.nextDeathChance ?? 0) > (scene.deathChance ?? 0) || (scene.nextSuccessionChance ?? 0) > (scene.successionChance ?? 0)}
                events={scene.eventLog ?? []}
                currentEvents={currentEvents}
                ongoing={ongoing}
                changes={scene.yearChanges ?? []}
                investmentLines={scene.lines}
                industryId={scene.industryId}
                investment={
                  <>
                    {youFinished ? (
                      <p className="finish-note">Lượt chơi của đội đã được chốt. Xem lịch sử sự kiện ở các tab bên trên trước khi kết thúc.</p>
                    ) : (
                      <>
                        <p className="meta">Chọn một hướng đầu tư, rồi bấm Sang năm để sản xuất và chốt năm.</p>
                        <BudgetPanel
                          scene={scene}
                          step={snap.room.step}
                          prices={scene.linePrices ?? snap.room.linePrices}
                          busy={busy}
                          paused={snap.paused}
                          onInvest={(line, quantity) => {
                            beep(660, 0.06, muted)
                            void act('invest', { line, quantity })
                          }}
                          onRestart={() => {
                            beep(430, 0.08, muted)
                            void act('restart')
                          }}
                        />
                      </>
                    )}
                  </>
                }
              />
            </div>
          </section>
            <YearButton
              finished={youFinished}
              suspended={Boolean(scene.bankrupt)}
              busy={busy || snap.paused || Boolean(scene.bankrupt)}
              now={snap.paused && snap.frozenNow ? snap.frozenNow : now}
              nextYearAt={scene.nextYearAt}
              yearLockUntil={scene.yearLockUntil}
              yearSeconds={snap.room.cycleSeconds}
              onPress={() => {
                beep(520, 0.08, muted)
                void act('year')
              }}
              onFinish={() => setFinishedSummary(true)}
            />
        </>
      )}
      {snap && showGame && century && theme && (
        <CentennialReveal notice={century} industryId={theme.industryId} teamName={snap.you?.teamName ?? ''} onDone={() => setCenturyDone(true)} />
      )}
      {snap && showGame && finishedSummary && <FinishedSummary snap={snap} onClose={() => setFinishedSummary(false)} />}
      {snap && scene?.pending && status !== 'ended' && !youFinished && (
        <EventQuizModal
          pending={scene.pending}
          busy={busy}
          onAnswer={(optionId) => {
            beep(optionId ? 880 : 200, 0.12, muted)
            void act('answer', { optionId })
          }}
          onDismiss={() => void act('dismiss', {})}
        />
      )}
      {snap && status === 'ended' && <EndScreen snap={snap} />}
    </main>
  )
}

function YearButton({
  finished,
  suspended,
  busy,
  now,
  nextYearAt,
  yearLockUntil,
  yearSeconds,
  onPress,
  onFinish,
}: {
  finished: boolean
  suspended: boolean
  busy: boolean
  now: number
  nextYearAt: number
  yearLockUntil: number
  yearSeconds: number
  onPress: () => void
  onFinish: () => void
}) {
  if (finished) {
    return (
      <div className="year-dock">
        <button type="button" className="btn year-finish" onClick={onFinish}>
          Kết thúc trò chơi
          <small>Xem kết quả lượt chơi</small>
        </button>
      </div>
    )
  }
  if (suspended) return <div className="year-dock"><button type="button" className="btn year-finish" disabled>Chờ tái cơ cấu<small>Nhận vốn hỗ trợ trong tab Đầu tư</small></button></div>
  const total = Math.max(1, yearSeconds) * 1000
  const left = Math.max(0, nextYearAt - now)
  const ratio = Math.min(1, left / total)
  const seconds = Math.ceil(left / 1000)
  const lockLeft = Math.max(0, yearLockUntil - now)
  const locked = lockLeft > 0
  return (
    <div className="year-dock">
      <button
        type="button"
        className="year-btn"
        disabled={busy || locked}
        onClick={onPress}
        aria-label={`${locked ? 'Đang diễn' : 'Sang năm'}, tự chốt sau ${seconds} giây`}
      >
        <YearPerimeter ratio={ratio} />
        <span>
          {locked ? 'Đang diễn' : 'Sang năm'}
          <small>{seconds}s</small>
        </span>
      </button>
    </div>
  )
}

function YearPerimeter({ ratio }: { ratio: number }) {
  const frame = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const node = frame.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize(previous => previous.width === width && previous.height === height ? previous : { width, height })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  const width = Math.max(0, size.width - 10)
  const height = Math.max(0, size.height - 10)
  return <svg ref={frame} className="year-perimeter" aria-hidden="true" focusable="false">
    {width > 0 && height > 0 && <>
      <rect className="year-perimeter-track" x="5" y="5" width={width} height={height} rx="5" />
      <rect className="year-perimeter-progress" x="5" y="5" width={width} height={height} rx="5" pathLength="100" strokeDasharray="100 100" strokeDashoffset={100 * (1 - ratio)} opacity={ratio > 0 ? 1 : 0} />
    </>}
  </svg>
}

function InlineResult({ snap }: { snap: Snapshot }) {
  const scene = snap.you?.scene
  const succession = snap.you?.succession
  return <section className="inline-result" aria-label="Kết quả lượt chơi">
    <h3>{succession?.outcomeLabel || 'Đã kết thúc lượt chơi'}</h3>
    {succession && <p>{succession.causeText} · {succession.outcomeDetail}</p>}
    <p>Giá trị cuối <b>{vnd(scene?.value ?? 0)}</b> · Hạng {snap.you?.rank ?? '—'}</p>
  </section>
}

function FinishedSummary({ snap, onClose }: { snap: Snapshot; onClose: () => void }) {
  const you = snap.you
  const succession = you?.succession
  const value = snap.leaderboard.find((row) => row.teamId === you?.id)?.value ?? 0
  return (
    <div className="modal on" role="dialog" aria-modal="true" aria-label="Kết quả lượt chơi">
      <div className="card finished-summary">
        <h2>Đã kết thúc lượt chơi</h2>
        {succession ? (
          <>
            <p>{succession.causeText}</p>
            <p>
              <b>{succession.outcomeLabel}.</b> {succession.outcomeDetail}
            </p>
          </>
        ) : (
          <p>Đội đã chốt mốc đặc biệt của lượt chơi.</p>
        )}
        <p className="end-sum">
          Giá trị cuối <b>{vnd(value)}</b> · Hạng {you?.rank ?? '—'}
        </p>
        <div className="finished-actions">
          <button type="button" className="btn s" onClick={onClose}>
            Xem lại sự kiện
          </button>
          <Link className="btn" to="/">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}

function Countdown({ snapEnds, now }: { snapEnds: number | null; now: number }) {
  const left = snapEnds ? snapEnds - now : 3000
  const n = Math.max(1, Math.ceil(left / 1000))
  return (
    <div className="countdown">
      <b>{n}</b>
      <span>Cùng xuất phát</span>
    </div>
  )
}
