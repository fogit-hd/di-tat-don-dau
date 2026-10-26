import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api/client.ts'
import '../public-pages.css'
import { googleClientId } from '../lib/endpoints.ts'
import { ArtText as T, PaintedArt as Art } from './ArtText'
const WikiPage = lazy(() => import('./WikiPage').then(module => ({default:module.WikiPage})))

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void
      disableAutoSelect?: () => void
    }
  }
}

const STEPS = [
  {
    title: 'Tạo phòng',
    body: 'Mời các đội bằng một mã phòng duy nhất.',
  },
  {
    title: 'Chọn ngành',
    body: 'Mỗi đội bắt đầu với một doanh nghiệp riêng.',
  },
  {
    title: 'Chốt năm',
    body: 'Đầu tư, vượt biến cố và dẫn đầu phiên chơi.',
  },
] as const

const FEATURES = [
  {
    id: 'eng',
    title: 'Tuyển công nhân',
    body: 'Nâng năng lực đội ngũ để mở khoá các phương án phát triển tiếp theo.',
  },
  {
    id: 'mac',
    title: 'Mở cụm sản xuất',
    body: 'Đầu tư máy móc để tăng năng lực tạo ra giá trị cho doanh nghiệp.',
  },
  {
    id: 'sup',
    title: 'Phụ trợ',
    body: 'Kết nối nhà cung ứng và logistics để chuỗi vận hành vững hơn.',
  },
  {
    id: 'inf',
    title: 'Hạ tầng',
    body: 'Củng cố điện, nước và giao thông — nền tảng để doanh nghiệp lớn lên.',
  },
  {
    id: 'grn',
    title: 'Công nghệ sạch',
    body: 'Tối ưu chi phí dài hạn và giảm áp lực từ các biến cố môi trường.',
  },
] as const

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
  const [prices, setPrices] = useState({ eng: 50, mac: 200, sup: 75, inf: 100, grn: 60 })
  const [hostOpen, setHostOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [hostSession, setHostSession] = useState(() => localStorage.getItem('host-session') || '')
  const loginButton = useRef<HTMLDivElement | null>(null)
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
    if (!loginOpen || !loginButton.current) return
    const clientId = googleClientId()
    if (!clientId) {
      setError('Máy chủ frontend chưa có GOOGLE_CLIENT_ID')
      return
    }
    const render = () => {
      const google = (window as Window & { google?: GoogleIdentity }).google
      if (!google || !loginButton.current) return
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          void api<{ token: string; user: { name: string } }>('/api/auth/google', { method: 'POST', body: { credential: response.credential } })
            .then(({ token, user }) => {
              localStorage.setItem('host-session', token)
              setHostSession(token)
              setHostName(user.name || 'Chủ phòng')
              setLoginOpen(false)
              if(loginIntent.current==='create')setHostOpen(true)
            })
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Không đăng nhập được Google'))
        },
      })
      loginButton.current.replaceChildren()
      google.accounts.id.renderButton(loginButton.current, { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', width: 280 })
    }
    const existing = document.querySelector('script[data-google-identity]')
    if (existing) {
      render()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = render
    document.head.appendChild(script)
  }, [loginOpen])

  useEffect(() => {
    const code = readCode(searchParams)
    if (!code) return
    setJoinCode(code)
    setJoinStep('code')
    void checkCode(code)
  }, [searchParams])

  useEffect(() => {
    void api<{ investmentBasePrices?: typeof prices; yearMinSeconds: number; stepDivisor: number; stepRound: number; stepMin: number; lines: { id: string; label: string }[] }>('/api/setup')
      .then((setup) => {
        setYearMin(setup.yearMinSeconds)
        if(setup.investmentBasePrices)setPrices(setup.investmentBasePrices)
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
        body: { hostName, durationMin: minutes, startingCapital: capital, cycleSeconds: cycle, yearMinSeconds: yearMin, linePrices: prices },
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
    <div className="public-site" onContextMenu={event => { if(!(event.target instanceof Element) || !event.target.closest('input,textarea,select'))event.preventDefault() }} onDragStart={event => { if(event.target instanceof Element && event.target.closest('img,svg,.art-text'))event.preventDefault() }}>
      <a className="public-skip" href={wiki?'#wiki-main':'#join-title'}><T text={wiki?'Tới nội dung Wiki':'Tới phần vào phòng'}/></a>
      <header className="public-header public-wrap" id="dau-trang">
        <Link className="public-brand" to="/" aria-label="Đi Tắt Đón Đầu — Trang chủ"><Art src="/assets/landing-v2/brand-logo.webp" alt="Đi Tắt Đón Đầu" eager/></Link>
        <nav className="public-nav" aria-label="Mục lục">
          <a href={wiki?'/#cach-choi':'#cach-choi'}><T text="Cách chơi"/></a>
          <a href={wiki?'/#tinh-nang':'#tinh-nang'}><T text="Sự kiện"/></a>
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
          <Art className="public-hero-art" src="/assets/landing-v2/hero-art.webp" alt="Đội ngũ xây dựng doanh nghiệp bên cảng biển và nhà máy Việt Nam" eager/>
          <div className="public-hero-copy">
            <h1 id="hero-title"><span className="sr-only">Xây doanh nghiệp. Chốt vận mệnh.</span><Art src="/assets/landing-v2/hero-title.webp" className="public-title-art" eager/></h1>
            <p className="public-tagline"><T text="Cùng đội của bạn đầu tư, vượt biến cố và đưa doanh nghiệp vươn lên dẫn đầu."/></p>
            <div className="public-join painted-frame" data-painted-frame id="join-title" aria-label="Vào phòng chơi">
              {joinStep==='code'?<form className="public-join-form" onSubmit={event=>{event.preventDefault();void checkCode()}}>
                <label><span className="sr-only">Mã phòng</span><input ref={roomCodeInput} value={joinCode} maxLength={8} autoCapitalize="characters" autoComplete="off" placeholder="Nhập mã phòng" onChange={event=>setJoinCode(event.target.value.toUpperCase())}/></label>
                <button type="submit" className="public-button" disabled={busy}><T text={busy?'Đang kiểm tra…':'Vào phòng'} bold/></button>
              </form>:<form className="public-join-form public-join-name" onSubmit={event=>{event.preventDefault();void join()}}>
                <p className="public-join-status"><T text={`Phòng ${joinCode} đã sẵn sàng.`}/></p>
                <label><span className="sr-only">Tên đội</span><input value={team} maxLength={24} autoFocus placeholder="Nhập tên đội" onChange={event=>setTeam(event.target.value)}/><small><T text={`${team.length}/24 ký tự`}/></small></label>
                <button type="submit" className="public-button" disabled={busy||team.trim().length<1}><T text="Vào sảnh" bold/></button>
                <button type="button" className="public-change" onClick={()=>{setError('');setJoinStep('code');window.requestAnimationFrame(()=>roomCodeInput.current?.focus())}}><T text="Đổi mã"/></button>
              </form>}
              {error&&!loginOpen&&!hostOpen&&<p className="public-error" role="alert"><T text={error}/></p>}
            </div>
          </div>
        </section>
        <section className="public-how painted-frame" data-painted-frame id="cach-choi" aria-labelledby="how-title">
          <h2 id="how-title" className="public-section-title"><T text="3 bước vào game" bold/></h2>
          <ol>{STEPS.map((step,index)=><li key={step.title}>
            <Art src={`/assets/landing-v2/step-${index+1}.webp`}/>
            <div><h3><span className="public-step-number"><T text={String(index+1)} bold/></span><T text={step.title} bold/></h3><p><T text={index===0?'Chủ phòng đăng nhập Google để tạo phòng và mời bạn chơi.':step.body}/></p></div>
          </li>)}</ol>
        </section>
        <section className="public-features painted-frame" data-painted-frame id="tinh-nang" aria-labelledby="features-title">
          <h2 className="public-section-title" id="features-title"><T text="Đầu tư. Ứng biến. Dẫn đầu." bold/></h2>
          <div className="public-investment-strip">{FEATURES.map(feature=><Link to={`/wiki?section=upgrades&industry=trai-cay-say`} key={feature.id} aria-label={`Tìm hiểu ${feature.title}`}><Art src={`/assets/investments/handdrawn-v1/${feature.id==='grn'?'common':'trai-cay-say'}/${feature.id}.webp`}/><T text={feature.title} bold/></Link>)}</div>
          <div className="public-wiki-link"><Link className="public-button public-button-dark" to="/wiki"><Art src="/assets/landing-v2/book.webp"/><T text="Khám phá Wiki" bold/></Link></div>
        </section>
      </main>}
      <footer className="public-footer public-wrap"><T text="Trò chơi lớp học về nhà máy gia đình."/></footer>
      {loginOpen && (
        <div className="modal on public-modal" role="dialog" aria-modal="true" aria-labelledby="google-login-title">
          <div className="card painted-frame" data-painted-frame>
            <h2 id="google-login-title"><T text={loginIntent.current==='create'?'Đăng nhập để tạo phòng':'Đăng nhập chủ phòng'} bold/></h2>
            <p><T text="Chỉ chủ phòng cần đăng nhập Google. Báo cáo từng lượt chơi sẽ được lưu vào tài khoản này."/></p>
            <div ref={loginButton} className="google-login" />
            {error && <p className="warn" role="alert">{error}</p>}
            <button type="button" className="btn s" onClick={() => setLoginOpen(false)}>Đóng</button>
          </div>
        </div>
      )}
      {hostOpen && (
        <div className="modal on public-modal" role="dialog" aria-modal="true" aria-labelledby="host-title">
          <div className="card painted-frame" data-painted-frame>
            <h2 id="host-title"><T text="Tạo phòng" bold/></h2>
            <p>Chủ phòng chiếu mã. Giá từng khoản đầu tư mặc định theo vốn, và có thể sửa trước khi mở phòng.</p>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void createRoom()
              }}
            >
              <label>
                Tên
                <input value={hostName} maxLength={40} onChange={(event) => setHostName(event.target.value)} />
                <small>{hostName.length}/40 ký tự</small>
              </label>
              <div className="settings">
                <label>
                  Phút
                  <input type="number" min={1} max={45} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} />
                </label>
                <label>
                  Vốn (triệu VNĐ)
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
              <div className="config-section">
                <h3>Điều chỉnh mức giá toàn phòng</h3>
                <p>Đây là giá tham chiếu để điều chỉnh toàn phòng. Mỗi ngành có giá riêng; giá mua tăng theo quy mô.</p>
              </div>
              <div className="settings price-grid" aria-label="Giá đầu tư">
                {(
                  [
                    ['eng', 'Tuyển công nhân'],
                    ['mac', 'Cụm sản xuất'],
                    ['sup', 'Phụ trợ'],
                    ['inf', 'Hạ tầng'],
                    ['grn', 'Công nghệ sạch'],
                  ] as const
                ).map(([id, label]) => (
                  <label key={id}>
                    Giá tham chiếu {label} (triệu VNĐ)
                    <input
                      type="number"
                      min={1}
                      max={100000}
                      value={prices[id]}
                      onChange={(event) => setPrices({ ...prices, [id]: Number(event.target.value) })}
                    />
                  </label>
                ))}
              </div>
              {error && (
                <p className="warn" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="btn big" disabled={busy || hostName.trim().length < 1}>
                Mở phòng
              </button>
            </form>
            <button type="button" className="btn s" onClick={() => setHostOpen(false)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
