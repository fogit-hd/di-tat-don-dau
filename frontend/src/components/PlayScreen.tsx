import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client.ts'
import type { CentennialNotice, Snapshot } from '../api/types.ts'
import { useClock, useRoom } from '../realtime/useRoom.ts'
import { beep } from '../lib/sound.ts'
import { clock, vnd } from '../lib/format.ts'
import { BudgetPanel } from './BudgetPanel.tsx'
import { CentennialReveal } from './CentennialReveal.tsx'
import { EndScreen } from './EndScreen.tsx'
import { EffectBadges, EventCardList, GameTabs, OngoingEvents } from './EventPanels.tsx'
import { EventQuizModal } from './EventQuizModal.tsx'
import { FactoryScene } from './FactoryScene.tsx'
import { GovernanceRiskCard } from './GovernanceRiskCard.tsx'
import { StatCards } from './StatCards.tsx'
import { ThemeIntro } from './ThemeIntro.tsx'
import { TopBar } from './TopBar.tsx'
import './gameplay.css'

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

  return (
    <main className={showGame ? 'wrap game-shell gameplay' : 'wrap'}>
      {offline && <div className="offline">Mất kết nối, đang nối lại…</div>}
      {!snap && <p className="lead">{error || 'Đang vào phòng…'}</p>}
      {snap && status === 'lobby' && (
        <section className="narrow">
          <h1>Phòng {snap.room.code}</h1>
          <p className="lead">
            Xin chào <b>{snap.you?.teamName}</b>. Đợi {snap.room.hostName} bắt đầu. Đồng hồ {Math.round(snap.room.durationSec / 60)} phút, vốn{' '}
            {snap.room.startingCapital.toLocaleString('vi-VN')} tỷ.
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
          <ThemeIntro theme={{ ...theme, factoryName: scene.factoryName }} busy={busy} onBegin={(factoryName) => void act('intro', { factoryName })} />
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
              <FactoryScene scene={scene} paused={snap.paused} />
              <section className="card current-event">
                <h2>Sự kiện năm nay</h2>
                <EventCardList events={(scene.eventLog ?? []).filter((event) => event.year === scene.cycles)} empty="Năm nay chưa có sự kiện." />
              </section>
              <OngoingEvents effects={scene.activeEffects ?? []} timed={scene.effects} events={scene.eventLog ?? []} now={youFinished ? snap.serverNow : now} />
            </div>
            <div className="game-workspace">
              <GameTabs
                enterprise={<><StatCards scene={scene} /><EffectBadges effects={[]} traits={scene.traits ?? []} centennial={Boolean(scene.centennial)} pulse={false} /></>}
                risk={<GovernanceRiskCard scene={scene} />}
                riskIncreasing={(scene.nextDeathChance ?? 0) > (scene.deathChance ?? 0) || (scene.nextSuccessionChance ?? 0) > (scene.successionChance ?? 0)}
                events={scene.eventLog ?? []}
                changes={scene.yearChanges ?? []}
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
                          onInvest={(line) => {
                            beep(660, 0.06, muted)
                            void act('invest', { line })
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
            <YearButton
              finished={youFinished}
              busy={busy || snap.paused || scene.cash <= 0}
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
            </div>
          </section>
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
  busy,
  now,
  nextYearAt,
  yearLockUntil,
  yearSeconds,
  onPress,
  onFinish,
}: {
  finished: boolean
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
  const total = Math.max(1, yearSeconds) * 1000
  const left = Math.max(0, nextYearAt - now)
  const ratio = Math.min(1, left / total)
  const radius = 46
  const circumference = 2 * Math.PI * radius
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
        aria-label={locked ? `Đang diễn, còn ${Math.ceil(lockLeft / 1000)} giây` : `Sang năm, còn ${seconds} giây`}
      >
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle className="year-ring-track" cx="60" cy="60" r={radius} />
          <circle
            className="year-ring"
            cx="60"
            cy="60"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - ratio)}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <span>
          {locked ? 'Đang diễn' : 'Sang năm'}
          <small>{locked ? Math.ceil(lockLeft / 1000) : seconds}s</small>
        </span>
      </button>
    </div>
  )
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
