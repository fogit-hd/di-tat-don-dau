import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api/client.ts'
import '../landing.css'
import { googleClientId } from '../lib/endpoints.ts'

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void
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
    title: 'Đào tạo nhân lực',
    body: 'Nâng năng lực đội ngũ để mở khoá các phương án phát triển tiếp theo.',
  },
  {
    id: 'mac',
    title: 'Dây chuyền sản xuất',
    body: 'Đầu tư máy móc để tăng năng lực tạo ra giá trị cho doanh nghiệp.',
  },
  {
    id: 'sup',
    title: 'Hệ sinh thái phụ trợ',
    body: 'Kết nối nhà cung ứng và logistics để chuỗi vận hành vững hơn.',
  },
  {
    id: 'inf',
    title: 'Hạ tầng vận hành',
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

export function StartScreen() {
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
              setHostOpen(true)
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
    <div className="landing">
      <a className="skip" href="#cach-choi">
        Tới cách chơi
      </a>
      <header className="land-bar" id="dau-trang">
        <div className="land-wrap bar-inner">
          <a className="wordmark" href="#dau-trang">
            <img src="/assets/landing/game-logo-header.png" alt="Đi Tắt Đón Đầu" />
          </a>
          <nav className="land-nav" aria-label="Mục lục">
            <a href="#cach-choi" aria-label="Cách chơi">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 7h10c2 0 3 2 3.5 4l1 6c.4 2-1.7 3-3 1.5L16 16H8l-2.5 2.5c-1.3 1.5-3.4.5-3-1.5l1-6C4 9 5 7 7 7ZM7 10v5m-2.5-2.5h5" /><circle cx="16" cy="11" r=".6" /><circle cx="18" cy="14" r=".6" /></svg>
              <span>Cách chơi</span>
            </a>
            <a href="#tinh-nang" aria-label="Sự kiện">
              <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18m-9 3 .9 2.1 2.3.2-1.8 1.5.6 2.2-2-1.2-2 1.2.6-2.2-1.8-1.5 2.3-.2L12 13Z" /></svg>
              <span>Sự kiện</span>
            </a>
          </nav>
          <div className="land-actions">
            <button type="button" className="btn land-cta" onClick={() => { setError(''); hostSession ? setHostOpen(true) : setLoginOpen(true) }}>
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Tạo phòng
            </button>
            <button type="button" className="nav-join" aria-label="Vào phòng" onClick={() => { setJoinStep('code'); window.scrollTo({ top: 0, behavior: 'smooth' }); window.requestAnimationFrame(() => roomCodeInput.current?.focus({ preventScroll: true })) }}>
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M14 4h6v16h-6M3 12h12m-5-5 5 5-5 5" /></svg><span>Vào phòng</span>
            </button>
          </div>
        </div>
      </header>
      {server === 'down' && (
        <p className="server-banner land-wrap" role="status">
          Máy chủ chưa sẵn sàng. Nếu vừa bật Docker, hãy đợi thêm một chút.
        </p>
      )}
      <main>
        <section className="hero-sec" aria-labelledby="hero-title">
          <div className="land-wrap hero-grid">
            <img className="hero-game-art" src="/assets/landing/game-world-canvas.png" alt="Thành phố công nghiệp, nông nghiệp, logistics và cảng biển trong trò chơi" />
            <div className="hero-copy">
              <h1 id="hero-title" className="hero-heading">
                <span className="sr-only">Xây doanh nghiệp. Chốt vận mệnh.</span>
                <picture>
                  <source srcSet="/assets/landing/hero-title.webp" type="image/webp" />
                  <img className="hero-lettering" src="/assets/landing/hero-title.png" alt="" aria-hidden="true" width="1600" height="669" decoding="async" />
                </picture>
              </h1>
              <p className="tagline">Cùng đội của bạn đầu tư, vượt biến cố và đưa doanh nghiệp vươn lên dẫn đầu.</p>
          <div className="hero-join" id="join-title" aria-label="Vào phòng">
            <div className="hero-cta-row">
            {joinStep === 'code' ? (
              <form
                className="join-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void checkCode()
                }}
              >
                <svg className="join-enter" aria-hidden="true" viewBox="0 0 24 24"><path d="M14 4h6v16h-6M3 12h12m-5-5 5 5-5 5" /></svg>
                <label>
                  <span className="sr-only">Mã phòng</span>
                  <input ref={roomCodeInput} value={joinCode} maxLength={8} autoCapitalize="characters" placeholder="Nhập mã phòng" onChange={(event) => setJoinCode(event.target.value.toUpperCase())} />
                </label>
                <button type="submit" className="btn" disabled={busy}>{busy ? 'Đang kiểm tra…' : 'Vào phòng'}</button>
              </form>
            ) : (
              <form
                className="join-form join-name-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void join()
                }}
              >
                <p className="join-room">Phòng <b>{joinCode}</b> đã sẵn sàng.</p>
                <label>
                  <span className="sr-only">Tên đội</span>
                  <input value={team} maxLength={24} autoFocus placeholder="Nhập tên đội" onChange={(event) => setTeam(event.target.value)} />
                  <small>{team.length}/24 ký tự</small>
                </label>
                <button type="submit" className="btn" disabled={busy || team.trim().length < 1}>Vào sảnh</button>
                <button type="button" className="join-change" onClick={() => { setError(''); setJoinStep('code') }}>Đổi mã</button>
              </form>
            )}
            </div>
            {error && <p className="join-error" role="alert">{error}</p>}
          </div>
            </div>
          </div>
        </section>

        <section className="band" id="cach-choi" aria-labelledby="how-title">
          <div className="land-wrap how-grid">
            <div>
              <h2 className="section-title" id="how-title">
                Cách chơi
              </h2>
            </div>
            <ol className="steps">
              {STEPS.map((step, index) => (
                <li className="step" key={step.title}>
                  <span className="step-num" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="feat-sec" id="tinh-nang" aria-labelledby="feat-title">
          <div className="land-wrap">
            <div className="section-head">
              <h2 className="section-title" id="feat-title">
                5 thẻ đầu tư quyết định hướng đi
              </h2>
            </div>
            <div className="feat-grid">
              {FEATURES.map((feature) => (
                <article className={`card feat feat-${feature.id}`} key={feature.id}>
                  <img className="investment-card-art" src={`/assets/investments/${feature.id}.png`} alt="" />
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

      </main>
      <footer className="land-foot">
        <div className="land-wrap foot-inner">
          <p className="foot-copy">Trò chơi lớp học về nhà máy gia đình.</p>
        </div>
      </footer>
      {loginOpen && (
        <div className="modal on" role="dialog" aria-modal="true" aria-labelledby="google-login-title">
          <div className="card">
            <h2 id="google-login-title">Đăng nhập để tạo phòng</h2>
            <p>Chỉ chủ phòng cần đăng nhập Google. Báo cáo từng lượt chơi sẽ được lưu vào tài khoản này.</p>
            <div ref={loginButton} className="google-login" />
            {error && <p className="warn" role="alert">{error}</p>}
            <button type="button" className="btn s" onClick={() => setLoginOpen(false)}>Đóng</button>
          </div>
        </div>
      )}
      {hostOpen && (
        <div className="modal on" role="dialog" aria-modal="true" aria-labelledby="host-title">
          <div className="card">
            <h2 id="host-title">Tạo phòng</h2>
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
