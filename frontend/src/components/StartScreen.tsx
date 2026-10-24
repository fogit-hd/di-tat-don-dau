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
  const [prices, setPrices] = useState({ eng: 1000, mac: 1000, sup: 1000, inf: 1000, grn: 1000 })
  const [priceBase, setPriceBase] = useState(1000)
  const [formula, setFormula] = useState({ divisor: 10, round: 100, min: 500 })
  const [joinOpen, setJoinOpen] = useState(false)
  const [hostOpen, setHostOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [hostSession, setHostSession] = useState(() => localStorage.getItem('host-session') || '')
  const loginButton = useRef<HTMLDivElement | null>(null)
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
    setJoinOpen(true)
    setJoinCode(code)
    setJoinStep('code')
    void checkCode(code)
  }, [searchParams])

  useEffect(() => {
    void api<{ yearMinSeconds: number; stepDivisor: number; stepRound: number; stepMin: number; lines: { id: string; label: string }[] }>('/api/setup')
      .then((setup) => {
        setYearMin(setup.yearMinSeconds)
        setFormula({ divisor: setup.stepDivisor, round: setup.stepRound, min: setup.stepMin })
        const price = Math.max(setup.stepMin, Math.round(10000 / setup.stepDivisor / setup.stepRound) * setup.stepRound)
        setPriceBase(price)
        setPrices({ eng: price, mac: price, sup: price, inf: price, grn: price })
      })
      .catch(() => undefined)
  }, [])

  function priceFor(capitalValue: number) {
    return Math.max(formula.min, Math.round(capitalValue / formula.divisor / formula.round) * formula.round)
  }

  function changeCapital(value: number) {
    const nextDefault = priceFor(value)
    setPrices((current) => {
      const untouched = (Object.values(current) as number[]).every((price) => price === priceBase)
      return untouched ? { eng: nextDefault, mac: nextDefault, sup: nextDefault, inf: nextDefault, grn: nextDefault } : current
    })
    setPriceBase(nextDefault)
    setCapital(value)
  }

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
            <a href="#cach-choi">Cách chơi</a>
            <a href="#tinh-nang">Sự kiện</a>
            <a href="#chu-phong">Chủ phòng</a>
          </nav>
          <div className="land-actions">
            <button type="button" className="btn s" onClick={() => { setError(''); setHostOpen(false); setJoinStep('code'); setJoinOpen(true) }}>
              Vào chơi
            </button>
            <button type="button" className="btn land-cta" onClick={() => { setError(''); setJoinOpen(false); hostSession ? setHostOpen(true) : setLoginOpen(true) }}>
              Tạo phòng
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
              <h1 id="hero-title" className="sr-only">Xây doanh nghiệp. Chốt vận mệnh.</h1>
              <img className="hero-title-art" src="/assets/landing/hero-title.png" alt="Xây doanh nghiệp. Chốt vận mệnh." />
              <p className="tagline">Cùng đội của bạn đầu tư, vượt biến cố và đưa doanh nghiệp vươn lên dẫn đầu.</p>
              <div className="hero-actions">
                <button type="button" className="btn" onClick={() => { setError(''); setJoinOpen(false); hostSession ? setHostOpen(true) : setLoginOpen(true) }}>
                  Tạo phòng <span aria-hidden="true">→</span>
                </button>
                <button type="button" className="hero-ghost" onClick={() => { setError(''); setHostOpen(false); setJoinStep('code'); setJoinOpen(true) }}>
                  Vào phòng
                </button>
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
              <p className="deck">Mở trình duyệt trên điện thoại là chơi được. Không cần cài ứng dụng.</p>
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
              <p className="deck">Đây là 5 lựa chọn xuất hiện trong phiên chơi. Mỗi thẻ gắn với một hạng mục đầu tư và tác động khác nhau đến doanh nghiệp.</p>
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

        <section className="host-strip" id="chu-phong" aria-labelledby="host-strip-title">
          <div className="land-wrap host-strip-inner">
            <div>
              <h2 id="host-strip-title">Kết quả phiên chơi</h2>
              <p>Chủ phòng lưu báo cáo từng đội, xem lại quyết định và bảng xếp hạng của đúng lượt chơi đó.</p>
            </div>
            <button type="button" className="hero-ghost light" onClick={() => { setError(''); hostSession ? setHostOpen(true) : setLoginOpen(true) }}>
              Tạo phòng ngay
            </button>
          </div>
        </section>

      </main>
      <footer className="land-foot">
        <div className="land-wrap foot-inner">
          <p className="foot-copy">Trò chơi lớp học về nhà máy gia đình.</p>
        </div>
      </footer>
      {joinOpen && (
        <div className="modal on" role="dialog" aria-modal="true" aria-labelledby="join-title">
          <div className="card">
            <h2 id="join-title">Vào chơi</h2>
            {joinStep === 'code' ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void checkCode()
                }}
              >
                <p>Nhập mã phòng. Chỉ khi phòng tồn tại mới hỏi tên đội.</p>
                <label>
                  Mã phòng
                  <input
                    value={joinCode}
                    maxLength={8}
                    autoCapitalize="characters"
                    autoFocus
                    placeholder="Mã phòng"
                    onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  />
                </label>
                {error && (
                  <p className="warn" role="alert">
                    {error}
                  </p>
                )}
                <button type="submit" className="btn big" disabled={busy}>
                  {busy ? 'Đang kiểm tra…' : 'Kiểm tra mã'}
                </button>
              </form>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void join()
                }}
              >
                <p>
                  Phòng <b>{joinCode}</b> đang mở. Nhập tên đội để vào sảnh.
                </p>
                <label>
                  Tên đội
                  <input value={team} maxLength={24} autoFocus placeholder="Tên đội" onChange={(event) => setTeam(event.target.value)} />
                </label>
                {error && (
                  <p className="warn" role="alert">
                    {error}
                  </p>
                )}
                <button type="submit" className="btn big" disabled={busy || team.trim().length < 1}>
                  Vào sảnh
                </button>
                <button
                  type="button"
                  className="btn s"
                  onClick={() => {
                    setError('')
                    setJoinStep('code')
                  }}
                >
                  Đổi mã
                </button>
              </form>
            )}
            <button type="button" className="btn s" onClick={() => setJoinOpen(false)}>
              Đóng
            </button>
          </div>
        </div>
      )}
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
              </label>
              <div className="settings">
                <label>
                  Phút
                  <input type="number" min={1} max={45} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} />
                </label>
                <label>
                  Vốn (tỷ)
                  <input type="number" min={2000} max={100000} step={1000} value={capital} onChange={(event) => changeCapital(Number(event.target.value))} />
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
                <h3>Giá đầu tư mỗi lần bấm</h3>
                <p>Giá này áp dụng chung cho tất cả đội trong phòng.</p>
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
