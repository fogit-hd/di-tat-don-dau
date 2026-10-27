import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api/client.ts'
import '../public-pages.css'
import '../public-fields.css'
import '../public-home.css'
import { GoogleHostLogin, type GoogleIdentity } from './GoogleHostLogin'
import { PaintedArt as Art } from './ArtText'
import { PublicArtText as T } from './PublicArtText'
import { CreateRoomPanel } from './CreateRoomPanel'
import { CeoJoinPanel } from './SessionEntry'
const WikiPage = lazy(() => import('./WikiPage').then(module => ({default:module.WikiPage})))

function readCode(params: URLSearchParams) {
  return (params.get('code') ?? '').trim().toUpperCase().slice(0, 8)
}

export function StartScreen({ wiki = false }: { wiki?: boolean }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [hostName, setHostName] = useState('Nhóm trình chiếu')
  const [minutes, setMinutes] = useState(15)
  const [capital, setCapital] = useState(10000)
  const [cycle, setCycle] = useState(60)
  const [yearMin, setYearMin] = useState(5)
  const [hostOpen, setHostOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [hostSession, setHostSession] = useState(() => localStorage.getItem('host-session') || '')
  const loginIntent = useRef<'create' | 'login'>('create')
  const roomCodeInput = useRef<HTMLInputElement | null>(null)
  const [joinStep, setJoinStep] = useState<'code' | 'name'>('code')
  const codeFromUrl = readCode(searchParams)
  const [joinCode, setJoinCode] = useState(codeFromUrl)
  const [urlCode, setUrlCode] = useState(codeFromUrl)
  if (codeFromUrl !== urlCode) {
    setUrlCode(codeFromUrl)
    if (codeFromUrl) setJoinCode(codeFromUrl)
  }
  const [team, setTeam] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [server, setServer] = useState<'unknown' | 'up' | 'down'>('unknown')

  useEffect(() => {
    let stop = false
    const ping = () => {
      void fetch('/health')
        .then((res) => {
          if (!stop) setServer(res.ok ? 'up' : 'down')
        })
        .catch(() => {
          if (!stop) setServer('down')
        })
    }
    ping()
    const id = window.setInterval(ping, 3000)
    return () => {
      stop = true
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    const code = readCode(searchParams)
    if (!code) return
    setJoinCode(code)
    setJoinStep('code')
    void checkCode(code)
  }, [searchParams])

  useEffect(() => {
    void api<{ yearMinSeconds: number }>('/api/setup')
      .then((setup) => {
        setYearMin(setup.yearMinSeconds)
      })
      .catch(() => undefined)
  }, [])

  async function checkCode(code = joinCode) {
    const next = code.trim().toUpperCase()
    if (next.length < 4) {
      setError('Nhập đủ mã phòng')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api(`/api/rooms/${next}/exists`)
      setJoinCode(next)
      setJoinStep('name')
    } catch (err) {
      setJoinStep('code')
      setError(err instanceof ApiError ? err.message : 'Không thấy phòng này')
    } finally {
      setBusy(false)
    }
  }

  async function createRoom() {
    setBusy(true)
    setError('')
    try {
      const created = await api<{ code: string; hostToken: string }>('/api/rooms', {
        method: 'POST',
        hostSession,
        body: { hostName, durationMin: minutes, startingCapital: capital, cycleSeconds: cycle, yearMinSeconds: yearMin },
      })
      localStorage.setItem(`host:${created.code}`, created.hostToken)
      navigate(`/host/${created.code}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tạo được phòng')
    } finally {
      setBusy(false)
    }
  }

  async function join() {
    const code = joinCode.trim().toUpperCase()
    if (!code || !team.trim()) return
    setBusy(true)
    setError('')
    try {
      const result = await api<{ playerToken: string }>(`/api/rooms/${code}/join`, {
        method: 'POST',
        body: { teamName: team },
      })
      localStorage.setItem(`player:${code}`, result.playerToken)
      navigate(`/play/${code}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không vào được phòng')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`public-site ${wiki ? 'public-wiki-site' : 'public-home'}`} onContextMenu={event => { if(!(event.target instanceof Element) || !event.target.closest('input,textarea,select'))event.preventDefault() }} onDragStart={event => { if(event.target instanceof Element && event.target.closest('img,svg,.art-text'))event.preventDefault() }}>
      <a className="public-skip" href={wiki?'#wiki-main':'#join-title'}><T text={wiki?'Tới nội dung Wiki':'Tới phần vào phòng'}/></a>
      <header className="public-header public-wrap" id="dau-trang">
        <Link className="public-brand" to="/" aria-label="Đi Tắt Đón Đầu — Trang chủ"><Art src="/assets/landing-v2/brand-logo.webp" alt="Đi Tắt Đón Đầu" eager/></Link>
        <nav className="public-nav" aria-label="Mục lục">
          <Link to="/wiki?section=start"><T text="Cách chơi"/></Link>
          <Link to="/wiki?section=events"><T text="Sự kiện"/></Link>
          <Link to="/wiki" aria-current={wiki?'page':undefined}><T text="Wiki"/></Link>
        </nav>
        <div className="public-account">
          <button type="button" className="public-button" onClick={() => { setError(''); loginIntent.current='create'; hostSession ? setHostOpen(true) : setLoginOpen(true) }}><T text="Tạo phòng" bold/></button>
          <button type="button" className="public-button public-button-dark" onClick={() => {
            setError('')
            if(hostSession){localStorage.removeItem('host-session');setHostSession('');setHostOpen(false);(window as Window & {google?:GoogleIdentity}).google?.accounts.id.disableAutoSelect?.()}
            else {loginIntent.current='login';setLoginOpen(true)}
          }}><T text={hostSession?'Đăng xuất':'Đăng nhập'}/></button>
        </div>
      </header>
      {server==='down'&&<p className="public-server public-wrap" role="status"><T text="Máy chủ chưa sẵn sàng. Vui lòng thử lại sau."/></p>}
      {wiki?<Suspense fallback={<div className="public-loading public-wrap" role="status"><T text="Đang mở Wiki…"/></div>}><WikiPage/></Suspense>:<main className="public-wrap public-landing">
        <section className="public-hero painted-frame" data-painted-frame aria-labelledby="hero-title">
          <Art className="public-hero-art" src="/assets/landing-v2/hero-art.webp" alt="Nhân sự xây dựng doanh nghiệp bên cảng biển và nhà máy Việt Nam" eager/>
          <div className="public-hero-copy">
            <h1 id="hero-title"><span className="sr-only">Xây doanh nghiệp. Chốt vận mệnh.</span><Art src="/assets/landing-v2/hero-title.webp" className="public-title-art" eager/></h1>
            <p className="public-tagline"><T text="Trở thành CEO, đầu tư, vượt biến cố và đưa doanh nghiệp vươn lên dẫn đầu."/></p>
            <div className="public-join painted-frame" data-painted-frame id="join-title" aria-label="Vào phòng chơi">
              <form className="public-join-form" onSubmit={event=>{event.preventDefault();void checkCode()}}>
                <label><span className="sr-only">Mã phòng</span><input ref={roomCodeInput} value={joinCode} maxLength={8} autoCapitalize="characters" autoComplete="off" placeholder="Nhập mã phòng" onChange={event=>setJoinCode(event.target.value.toUpperCase())}/></label>
                <button type="submit" className="public-button" disabled={busy}><T text={busy?'Đang kiểm tra…':'Vào phòng'} bold/></button>
              </form>
              {error&&!loginOpen&&!hostOpen&&<p className="public-error" role="alert"><T text={error}/></p>}
            </div>
          </div>
        </section>
      </main>}
      {wiki&&<footer className="public-footer public-wrap"><T text="Trò chơi lớp học về nhà máy gia đình."/></footer>}
      {loginOpen&&<GoogleHostLogin intent={loginIntent.current} onClose={()=>setLoginOpen(false)} onSuccess={({token,user})=>{
        localStorage.setItem('host-session',token)
        setHostSession(token);setHostName(user.name||'Chủ phòng');setLoginOpen(false);setError('')
        if(loginIntent.current==='create')setHostOpen(true)
      }}/>}
      {joinStep==='name'&&<CeoJoinPanel code={joinCode} name={team} busy={busy} error={error} onCode={setJoinCode} onName={setTeam} onSubmit={()=>void join()} onClose={()=>{setError('');setJoinStep('code');requestAnimationFrame(()=>roomCodeInput.current?.focus())}}/>}
      {hostOpen && <CreateRoomPanel hostName={hostName} minutes={minutes} capital={capital} cycle={cycle} yearMin={yearMin} busy={busy} error={error} onHostName={setHostName} onMinutes={setMinutes} onCapital={setCapital} onCycle={setCycle} onYearMin={setYearMin} onSubmit={()=>void createRoom()} onClose={()=>setHostOpen(false)} onLogout={()=>{localStorage.removeItem('host-session');setHostSession('');setHostOpen(false);(window as Window & {google?:GoogleIdentity}).google?.accounts.id.disableAutoSelect?.()}}/>}
    </div>
  )
}
