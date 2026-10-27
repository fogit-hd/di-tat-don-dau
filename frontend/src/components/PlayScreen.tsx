import { RoomLoading } from './RoomLoading'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client.ts'
import type { CentennialNotice, Snapshot } from '../api/types.ts'
import { useClock, useRoom } from '../realtime/useRoom.ts'
import { beep } from '../lib/sound.ts'
import { vnd } from '../lib/format.ts'
import { BudgetPanel } from './BudgetPanel.tsx'
import { CentennialReveal } from './CentennialReveal.tsx'
import { EndScreen } from './EndScreen.tsx'
import { EffectBadges, GameTabs, type GameTabsHandle } from './EventPanels.tsx'
import { EventAttention } from './EventAttention.tsx'
import { EventOverview } from './EventOverview.tsx'
import { currentEventEntries, ongoingEventEntries } from '../lib/ongoing-events.ts'
import { EventQuizModal } from './EventQuizModal.tsx'
import { FactoryScene } from './FactoryScene.tsx'
import { GovernanceRiskCard } from './GovernanceRiskCard.tsx'
import { StatCards } from './StatCards.tsx'
import { ThemeIntro } from './ThemeIntro.tsx'
import { CeoJoinPanel, SessionCountdown } from './SessionEntry'
import { CeoLobby } from './CeoLobby'
import { PlayerResults } from './PlayerResults'
import type { AvatarConfig } from '../lib/avatar'
import { TopBar } from './TopBar.tsx'
import { specialStatuses } from '../lib/special-status.ts'
import { TraitNotice } from './TraitNotice.tsx'
import { FirstYearAdvisor } from './FirstYearAdvisor.tsx'
import { preloadAdvisor } from '../lib/advisor-assets.ts'
import { guideActive, guideDisplayedTab, guideStep } from '../lib/first-year-guide.ts'
import './gameplay.css'
import './responsive-gameplay.css'
import './painted-frames.css'
import './enterprise-canvas.css'
import './transparency-canvas.css'

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
  const preloadRequested=Boolean(snap?.you?.scene?.tutorial&&!snap.you.scene.introDone)
  useEffect(()=>{if(preloadRequested)void preloadAdvisor().catch(()=>{})},[preloadRequested])

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
      return true
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Lỗi')
      return false
    } finally {
      setBusy(false)
    }
  }

  if (!token) return <CeoJoinPanel code={upper} name={name} busy={busy} error={formError} onName={setName} onSubmit={()=>void join()}/>

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
  const tutorial = scene && showGame && guideActive(scene) ? guideStep(scene,{ceoName:snap?.you?.teamName,industryName:theme?.industryName,rank:snap?.you?.rank,durationSec:snap?.room.durationSec}) : null
  async function acknowledge(action:string) { if(busy||snap?.paused||offline)return false;return Boolean(await act('tutorial',{action})) }

  return (
    <EventAttention events={scene?.eventLog ?? []} scope={`${upper}:${snap?.you?.id ?? 'loading'}`} available={Boolean(scene)}><main data-economy-model={scene?.economyVersion} className={showGame ? 'wrap game-shell gameplay gameplay-responsive' : 'wrap'}>
      {offline && <div className="offline">Mất kết nối, đang nối lại…</div>}
      {!snap && <RoomLoading code={upper} error={error||undefined}/>}
      {snap && status === 'lobby' && <CeoLobby key={snap.you?.id} snap={snap} onSave={avatar=>api<{avatar:AvatarConfig}>(`/api/rooms/${upper}/avatar`,{method:'POST',playerToken:token,body:avatar})}/>}
      {snap && status === 'countdown' && <SessionCountdown code={upper} ends={snap.room.countdownEndsAt} now={now} name={snap.you?.teamName} avatar={snap.you?.avatar}/>}
      {snap && scene && theme && (status === 'playing' || status === 'paused') && !scene.introDone && (
        <>
          <ThemeIntro key={`${upper}-${snap.you?.id}-${theme.id}`} theme={{ ...theme, factoryName: scene.factoryName }} crewRequired={scene.economyVersion===3?scene.crewRequired:undefined} cash={scene.cash} workers={scene.engineers} clusters={scene.machines} ceoName={snap.you?.teamName} avatar={snap.you?.avatar} remainingMs={snap.paused?(snap.room.remainingMs??0):(snap.room.endsAt??now)-now} busy={busy} error={formError} onBegin={(factoryName) => void act('intro', { factoryName })} />
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
            guideAction={tutorial?.action}
            onGuideAction={action=>{if(tutorial?.action===action)void acknowledge(action)}}
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
              <FactoryScene scene={scene} paused={snap.paused} onShowEffects={() => gameTabs.current?.showEvents('ongoing')} />
              <EventOverview current={currentEventEntries(currentEvents)} ongoing={ongoing} onShowAll={group => gameTabs.current?.showEvents(group)} />
            </div>
            <div className="game-workspace">
              <GameTabs
                key={`${upper}-${youFinished ? 'finished' : 'playing'}`}
                ref={gameTabs}
                finished={youFinished}
                tutorialTarget={tutorial?(busy?null:tutorial.tab??null):undefined}
                initialTab={tutorial?guideDisplayedTab(scene.tutorial!.step,scene.tutorial!.version):'investment'}
                onVisit={tab=>{if(tutorial?.action==='investment'&&tab==='investment')void acknowledge(tutorial.action)}}
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
                      <p className="finish-note">Lượt chơi của CEO đã được chốt. Xem lịch sử sự kiện ở các tab bên trên trước khi kết thúc.</p>
                    ) : (
                      <>
                        <p className="meta">Chọn một hướng đầu tư, rồi bấm Sang năm để sản xuất và chốt năm.</p>
                        <BudgetPanel
                          scene={scene}
                          step={snap.room.step}
                          prices={scene.linePrices ?? snap.room.linePrices}
                          busy={busy}
                          paused={snap.paused}
                          tutorialAction={tutorial?.action}
                          onInvest={(line, quantity) => {
                            beep(660, 0.06, muted)
                            return act('invest', { line, quantity }).then(Boolean)
                          }}
                          onUpgrade={(upgrade)=>act('company-upgrade',{upgrade}).then(Boolean)}
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
              year={scene.cycles}
              suspended={Boolean(scene.bankrupt)}
              busy={busy || snap.paused || Boolean(scene.bankrupt) || Boolean(scene.pending)}
              now={scene.promptYearPausedAt ?? (snap.paused && snap.frozenNow ? snap.frozenNow : now)}
              nextYearAt={scene.nextYearAt}
              yearLockUntil={scene.yearLockUntil}
              yearSeconds={snap.room.cycleSeconds}
              guided={Boolean(tutorial)}
              guideCanPress={tutorial?.action==='year'}
              onPress={() => {
                beep(520, 0.08, muted)
                void act('year')
              }}
              onFinish={() => setFinishedSummary(true)}
            />
            {tutorial&&!scene.pending&&<FirstYearAdvisor key={`${upper}:${snap.you?.id}`} step={tutorial} stepIndex={scene.tutorial!.step} paused={snap.paused||offline} busy={busy} error={formError} onAcknowledge={acknowledge} />}
        </>
      )}
      {snap && showGame && century && theme && (
        <CentennialReveal notice={century} industryId={theme.industryId} teamName={snap.you?.teamName ?? ''} onDone={() => setCenturyDone(true)} />
      )}
      {snap && showGame && finishedSummary && <PlayerResults snap={snap} provisional onClose={() => setFinishedSummary(false)} />}
      {snap && scene?.pending && status !== 'ended' && !youFinished && (
        <EventQuizModal
          key={scene.pending.id}
          pending={scene.pending}
          busy={busy || snap.paused}
          now={snap.paused && snap.frozenNow ? snap.frozenNow : now}
          onAnswer={(optionId) => {
            beep(optionId ? 880 : 200, 0.12, muted)
            void act('answer', { optionId, pendingId: scene.pending?.id })
          }}
          onDismiss={() => void act('dismiss', {})}
        />
      )}
      {snap && status === 'ended' && <EndScreen snap={snap} />}
    </main></EventAttention>
  )
}

function YearButton({
  finished,
  year,
  suspended,
  busy,
  now,
  nextYearAt,
  yearLockUntil,
  yearSeconds,
  onPress,
  onFinish,
  guided=false,
  guideCanPress=false,
}: {
  finished: boolean
  year: number
  suspended: boolean
  busy: boolean
  now: number
  nextYearAt: number
  yearLockUntil: number
  yearSeconds: number
  onPress: () => void
  onFinish: () => void
  guided?:boolean
  guideCanPress?:boolean
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
  const locked = !guided && lockLeft > 0
  return (
    <div className="year-dock">
      <button
        type="button"
        data-guide="year"
        className={`year-btn${guided?' guide-year':''}`}
        disabled={busy || locked || guided&&!guideCanPress}
        onClick={onPress}
        aria-label={guided?'Sang năm · Hướng dẫn năm đầu, không có thời gian chờ':`${locked ? 'Đang diễn' : 'Sang năm'}, tự chốt sau ${seconds} giây`}
      >
        {!guided&&<YearPerimeter ratio={ratio} />}
        {year > 0 && <span key={year} className="year-settlement-note">Năm {year} · Đã chốt</span>}
        <span>
          {locked ? 'Đang diễn' : 'Sang năm'}
          <small>{guided?'Chưa đếm ngược':`${seconds}s`}</small>
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
