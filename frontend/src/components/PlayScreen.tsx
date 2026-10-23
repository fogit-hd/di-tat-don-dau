import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client.ts'
import { useClock, useRoom } from '../realtime/useRoom.ts'
import { beep } from '../lib/sound.ts'
import { clock } from '../lib/format.ts'
import { BudgetPanel } from './BudgetPanel.tsx'
import { EndScreen } from './EndScreen.tsx'
import { EventQuizModal } from './EventQuizModal.tsx'
import { FactoryScene } from './FactoryScene.tsx'
import { StatCards } from './StatCards.tsx'
import { ThemeIntro } from './ThemeIntro.tsx'
import { TopBar } from './TopBar.tsx'
import { SuccessionLock } from './SuccessionLock.tsx'
import { SuccessionReveal } from './SuccessionReveal.tsx'
import { YearLog } from './YearLog.tsx'

export function PlayScreen() {
  const { code = '' } = useParams()
  const upper = code.toUpperCase()
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(`player:${upper}`))
  const [name, setName] = useState('')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [muted, setMuted] = useState(() => localStorage.getItem('muted') === '1')
  const [revealDone, setRevealDone] = useState(false)
  const { snap, succession, offline, error } = useRoom(upper, 'player', token)
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
  const reveal = succession && succession.teamId === snap?.you?.id && !revealDone ? succession : null
  const youFinished = Boolean(snap?.you?.finished)

  return (
    <main className="wrap">
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
      {snap && showGame && scene && !youFinished && !reveal && (
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
          <div className="grid">
            <FactoryScene scene={scene} paused={snap.paused} now={now} />
            <div className="card panel">
              <h2>Đầu tư ngay</h2>
              <BudgetPanel
                scene={scene}
                step={snap.room.step}
                busy={busy}
                paused={snap.paused}
                onInvest={(line) => {
                  beep(660, 0.06, muted)
                  void act('invest', { line })
                }}
              />
              <StatCards scene={scene} />
              <YearLog scene={scene} />
            </div>
          </div>
          <YearButton
            busy={busy || snap.paused}
            now={snap.paused && snap.frozenNow ? snap.frozenNow : now}
            nextYearAt={scene.nextYearAt}
            yearLockUntil={scene.yearLockUntil}
            yearSeconds={snap.room.cycleSeconds}
            onPress={() => {
              beep(520, 0.08, muted)
              void act('year')
            }}
          />
        </>
      )}
      {snap && showGame && reveal && theme && (
        <SuccessionReveal
          notice={reveal}
          industryId={theme.industryId}
          label={snap.you?.succession?.outcome === reveal.outcome ? snap.you.succession.outcomeLabel : ''}
          detail={snap.you?.succession?.outcome === reveal.outcome ? snap.you.succession.outcomeDetail : ''}
          onDone={() => setRevealDone(true)}
        />
      )}
      {snap && showGame && youFinished && !reveal && <SuccessionLock snap={snap} />}
      {snap && scene?.pending && status !== 'ended' && !youFinished && !reveal && (
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
  busy,
  now,
  nextYearAt,
  yearLockUntil,
  yearSeconds,
  onPress,
}: {
  busy: boolean
  now: number
  nextYearAt: number
  yearLockUntil: number
  yearSeconds: number
  onPress: () => void
}) {
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
