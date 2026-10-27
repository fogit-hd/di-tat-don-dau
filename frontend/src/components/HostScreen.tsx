import { RoomLoading } from './RoomLoading'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { api, ApiError } from '../api/client.ts'
import { useClock, useRoom } from '../realtime/useRoom.ts'
import { CentennialReveal } from './CentennialReveal.tsx'
import { HostLobby } from './HostLobby'
import { SessionSettings } from './SessionUI'
import { HostLive, HostResults } from './HostSessions'
import { SessionCountdown } from './SessionEntry'

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
  const [primed, setPrimed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [confirmEnd, setConfirmEnd] = useState(false)

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

  const joinUrl = `${window.location.origin}/?code=${upper}`
  const watched = snap?.teams[0]
  const centuryTeam = snap?.teams.find((team) => team.centennial)
  const centuryNotice =
    centennial ??
    (centuryTeam?.centennial ? { teamId: centuryTeam.id, ...centuryTeam.centennial, finished: true as const } : null)

  return (
    <main className="wrap host">
      {offline && <div className="offline">Mất kết nối, đang nối lại…</div>}
      {!snap && <RoomLoading code={upper} error={error||undefined} host/>}
      {snap && snap.room.status === 'lobby' && <HostLobby snap={snap} qr={qr} joinUrl={joinUrl} busy={busy} note={note}
        settings={<SessionSettings minutes={minutes} capital={capital} cycle={cycle} yearMin={yearMin} onMinutes={setMinutes} onCapital={setCapital} onCycle={setCycle} onYearMin={setYearMin}/>}
        onStart={()=>void(async()=>{setBusy(true);setNote('');try{await api(`/api/rooms/${upper}`,{method:'PATCH',hostToken:token,body:{durationMin:minutes,startingCapital:capital,cycleSeconds:cycle,yearMinSeconds:yearMin}});await api(`/api/rooms/${upper}/start`,{method:'POST',hostToken:token,body:{}})}catch(err){setNote(err instanceof ApiError?err.message:'Không bắt đầu được')}finally{setBusy(false)}})()}
      />}
      {snap && snap.room.status === 'countdown' && <SessionCountdown code={upper} ends={snap.room.countdownEndsAt} now={now} />}
      {snap && (snap.room.status === 'playing' || snap.room.status === 'paused') && <HostLive snap={snap} now={now} busy={busy} note={note} confirmEnd={confirmEnd}
        onPause={()=>void call(snap.paused?'resume':'pause')}
        onEnd={()=>{if(!confirmEnd){setConfirmEnd(true);return}void call('end')}}
        notice={centuryNotice && centurySeen !== `${centuryNotice.teamId}-${centuryNotice.year}` ? <CentennialReveal notice={centuryNotice} industryId={snap.teams.find(team=>team.id===centuryNotice.teamId)?.industryId||watched?.industryId||''} teamName={snap.teams.find(team=>team.id===centuryNotice.teamId)?.teamName||'Một CEO'} onDone={()=>setCenturySeen(`${centuryNotice.teamId}-${centuryNotice.year}`)}/> : undefined}
      />}
      {snap && snap.room.status === 'ended' && <HostResults snap={snap} />}
    </main>
  )
}
