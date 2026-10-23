import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { api, ApiError } from '../api/client.ts'
import type { Snapshot } from '../api/types.ts'
import { clock, vnd } from '../lib/format.ts'
import { useClock, useRoom } from '../realtime/useRoom.ts'
import { CentennialReveal } from './CentennialReveal.tsx'
import { FactoryScene } from './FactoryScene.tsx'
import { Leaderboard } from './Leaderboard.tsx'

export function HostScreen() {
  const { code = '' } = useParams()
  const upper = code.toUpperCase()
  const [token] = useState<string | null>(() => localStorage.getItem(`host:${upper}`))
  const { snap, centennial, offline, error } = useRoom(upper, 'host', token)
  const [centurySeen, setCenturySeen] = useState<string | null>(null)
  const now = useClock(snap)
  const [qr, setQr] = useState('')
  const [minutes, setMinutes] = useState(15)
  const [capital, setCapital] = useState(10000)
  const [cycle, setCycle] = useState(60)
  const [yearMin, setYearMin] = useState(5)
  const [prices, setPrices] = useState<Record<'eng' | 'mac' | 'sup' | 'inf' | 'grn', number>>({
    eng: 1000,
    mac: 1000,
    sup: 1000,
    inf: 1000,
    grn: 1000,
  })
  const [primed, setPrimed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [watch, setWatch] = useState<string | null>(null)

  useEffect(() => {
    const url = `${window.location.origin}/?code=${upper}`
    void QRCode.toDataURL(url, { margin: 1, width: 320, color: { dark: '#3b2a22', light: '#fff8ec' } }).then(setQr)
  }, [upper])

  useEffect(() => {
    if (!snap || primed) return
    setMinutes(Math.round(snap.room.durationSec / 60))
    setCapital(snap.room.startingCapital)
    setCycle(snap.room.cycleSeconds)
    setYearMin(snap.room.yearMinSeconds)
    if (snap.room.linePrices) setPrices(snap.room.linePrices)
    setPrimed(true)
  }, [snap, primed])

  async function call(path: string, body?: unknown) {
    if (!token) return
    setBusy(true)
    setNote('')
    try {
      await api(`/api/rooms/${upper}/${path}`, { method: 'POST', body: body ?? {}, hostToken: token })
    } catch (err) {
      setNote(err instanceof ApiError ? err.message : 'Lỗi')
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <main className="wrap narrow">
        <h1>Không thấy quyền chủ phòng</h1>
        <p className="lead">Hãy tạo phòng mới trên máy này. Mã chủ phòng chỉ lưu trên trình duyệt vừa tạo.</p>
        <Link className="btn big" to="/">
          Tạo phòng
        </Link>
      </main>
    )
  }

  const joinUrl = `${window.location.origin}/play/${upper}`
  const watched = snap?.teams.find((team) => team.id === watch) ?? snap?.teams[0]
  const centuryTeam = snap?.teams.find((team) => team.centennial)
  const centuryNotice =
    centennial ??
    (centuryTeam?.centennial ? { teamId: centuryTeam.id, ...centuryTeam.centennial, finished: true as const } : null)

  return (
    <main className="wrap host">
      {offline && <div className="offline">Mất kết nối, đang nối lại…</div>}
      {!snap && <p className="lead">{error || 'Đang mở phòng…'}</p>}
      {snap && snap.room.status === 'lobby' && (
        <section className="host-lobby">
          <div>
            <p className="eyebrow">Đi Tắt Đón Đầu · {snap.room.hostName}</p>
            <h1 className="code">{snap.room.code}</h1>
            <p className="lead">Chiếu mã này. Các đội mở liên kết hoặc quét QR. Nếu điện thoại không vào được localhost, hãy mở trang bằng địa chỉ IP của máy.</p>
            <p className="join-url">{joinUrl}</p>
            <div className="settings">
              <label>
                Phút
                <input type="number" min={1} max={45} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} />
              </label>
              <label>
                Vốn (tỷ)
                <input type="number" min={2000} max={100000} step={1000} value={capital} onChange={(event) => setCapital(Number(event.target.value))} />
              </label>
              <label>
                Giây mỗi năm
                <input type="number" min={10} max={180} value={cycle} onChange={(event) => setCycle(Number(event.target.value))} />
              </label>
              <label>
                Khóa nút (giây)
                <input type="number" min={0} max={120} value={yearMin} onChange={(event) => setYearMin(Number(event.target.value))} />
              </label>
            </div>
            <div className="config-section host-config-section">
              <h2>Giá đầu tư mỗi lần bấm</h2>
              <p>Áp dụng chung cho mọi đội. Có thể chỉnh trước khi bắt đầu.</p>
            </div>
            <div className="settings price-grid" aria-label="Giá đầu tư">
              {(
                [
                  ['eng', 'Đào tạo'],
                  ['mac', 'Dây chuyền'],
                  ['sup', 'Phụ trợ'],
                  ['inf', 'Hạ tầng'],
                  ['grn', 'Công nghệ sạch'],
                ] as const
              ).map(([id, label]) => (
                <label key={id}>
                  Giá {label}
                  <input
                    type="number"
                    min={100}
                    max={100000}
                    value={prices[id]}
                    onChange={(event) => setPrices({ ...prices, [id]: Number(event.target.value) })}
                  />
                </label>
              ))}
            </div>
            {note && <p className="warn">{note}</p>}
            <button
              type="button"
              className="btn big"
              disabled={busy || snap.teams.length === 0}
              onClick={() =>
                void (async () => {
                  setBusy(true)
                  setNote('')
                  try {
                    await api(`/api/rooms/${upper}`, {
                      method: 'PATCH',
                      hostToken: token,
                      body: { durationMin: minutes, startingCapital: capital, cycleSeconds: cycle, yearMinSeconds: yearMin, linePrices: prices },
                    })
                    await api(`/api/rooms/${upper}/start`, { method: 'POST', hostToken: token, body: {} })
                  } catch (err) {
                    setNote(err instanceof ApiError ? err.message : 'Không bắt đầu được')
                  } finally {
                    setBusy(false)
                  }
                })()
              }
            >
              {snap.teams.length ? 'Bắt đầu' : 'Chờ ít nhất một đội'}
            </button>
            <ul className="waitlist">
              {snap.teams.map((team) => (
                <li key={team.id}>{team.teamName}</li>
              ))}
              {snap.teams.length === 0 && <li>Chưa có đội nào.</li>}
            </ul>
          </div>
          <div className="qr-wrap">{qr && <img src={qr} alt={`Mã QR vào phòng ${upper}`} />}</div>
        </section>
      )}
      {snap && snap.room.status === 'countdown' && <Countdown ends={snap.room.countdownEndsAt} now={now} />}
      {snap && (snap.room.status === 'playing' || snap.room.status === 'paused') && (
        <section>
          <header className="host-bar">
            <div>
              <span className="eyebrow">Đi Tắt Đón Đầu · Phòng {snap.room.code}</span>
              <b className="big-time">⏱ {clock(snap.paused ? (snap.room.remainingMs ?? 0) : (snap.room.endsAt ?? now) - now)}</b>
            </div>
            <div className="host-actions">
              {snap.paused ? (
                <button type="button" className="btn" disabled={busy} onClick={() => void call('resume')}>
                  Tiếp tục
                </button>
              ) : (
                <button type="button" className="btn s" disabled={busy} onClick={() => void call('pause')}>
                  Tạm dừng
                </button>
              )}
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => {
                  if (!confirmEnd) {
                    setConfirmEnd(true)
                    return
                  }
                  void call('end')
                }}
              >
                {confirmEnd ? 'Chốt kết thúc' : 'Kết thúc sớm'}
              </button>
            </div>
          </header>
          {note && <p className="warn">{note}</p>}
          {centuryNotice && centurySeen !== `${centuryNotice.teamId}-${centuryNotice.year}` && (
            <CentennialReveal
              notice={centuryNotice}
              industryId={snap.teams.find((team) => team.id === centuryNotice.teamId)?.industryId || watched?.industryId || ''}
              teamName={snap.teams.find((team) => team.id === centuryNotice.teamId)?.teamName || 'Một đội'}
              onDone={() => setCenturySeen(`${centuryNotice.teamId}-${centuryNotice.year}`)}
            />
          )}
          <div className="host-grid">
            <Leaderboard rows={snap.leaderboard} />
            <div>
              {watched?.scene && <FactoryScene scene={watched.scene} paused={snap.paused} now={now} dim={watched.finished} />}
              <div className="team-grid">
                {snap.teams.map((team) => (
                  <button type="button" key={team.id} className={`team-card${team.id === watched?.id ? ' on' : ''}`} onClick={() => setWatch(team.id)}>
                    <b>
                      {team.teamName}
                      {team.centennial ? ' · Bách niên' : ''}
                    </b>
                    <span>{team.themeName || 'Đang nhận ngành'}</span>
                    {team.finished ? (
                      <span>
                        Đã chuyển giao · {team.succession?.outcomeLabel ?? team.endingTitle} · {vnd(team.value)} · {team.cycles} năm
                      </span>
                    ) : (
                      <>
                        <span>Năm {team.cycles} · vốn {team.cash == null ? '—' : vnd(team.cash)}</span>
                        <span>Giá trị {vnd(team.value)}</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
      {snap && snap.room.status === 'ended' && <HostEnd snap={snap} />}
    </main>
  )
}

function Countdown({ ends, now }: { ends: number | null; now: number }) {
  const n = Math.max(1, Math.ceil(((ends ?? now) - now) / 1000))
  return (
    <div className="countdown">
      <b>{n}</b>
      <span>Cùng xuất phát</span>
    </div>
  )
}

function HostEnd({ snap }: { snap: Snapshot }) {
  return (
    <section className="card host-end">
      <h2>Kết quả phòng {snap.room.code}</h2>
      <Leaderboard rows={snap.leaderboard} />
      <div className="team-grid">
        {snap.teams.map((team) => (
          <article key={team.id} className="team-card">
            <b>{team.teamName}</b>
            <span>
              {team.finished
                ? `Đã chuyển giao · ${team.succession?.outcomeLabel ?? team.endingTitle ?? ''} · ${team.cycles} năm`
                : team.endingTitle || 'Chưa chốt'}
            </span>
            <span>{team.themeName}</span>
            <span>{vnd(team.value)}</span>
          </article>
        ))}
      </div>
      <h2>Câu hỏi</h2>
      {snap.room.questionStats.length === 0 ? (
        <p>Chưa có câu hỏi nào được trả lời.</p>
      ) : (
        <ul className="qstats">
          {snap.room.questionStats.map((row) => (
            <li key={row.questionId}>
              {row.prompt} — <b>{Math.round((100 * row.correct) / Math.max(1, row.total))}%</b> đúng ({row.correct}/{row.total})
            </li>
          ))}
        </ul>
      )}
      <Link className="btn big" to="/">
        Phòng mới
      </Link>
    </section>
  )
}
