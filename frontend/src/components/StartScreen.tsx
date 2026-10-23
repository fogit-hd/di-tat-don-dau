import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError, fetchGlobalBoard } from '../api/client.ts'
import type { GlobalRow } from '../api/types.ts'
import { vnd } from '../lib/format.ts'
import { HeroArt } from './HeroArt.tsx'
import '../landing.css'

const STEPS = [
  {
    title: 'Chiếu mã phòng',
    body: 'Chủ phòng tạo phòng và chiếu mã, hoặc QR, lên máy chiếu.',
  },
  {
    title: 'Vào bằng điện thoại',
    body: 'Mỗi đội nhập mã phòng và tên đội trên điện thoại của mình.',
  },
  {
    title: 'Đầu tư từng năm',
    body: 'Năm tự sang sau số giây đã chọn, hoặc ngay khi đội bấm nút. Sự kiện ập vào nhà máy và đội chọn cách đầu tư.',
  },
  {
    title: 'Kế nghiệp, rồi thắng',
    body: 'Chủ có thể qua đời, người thừa kế tiếp quản. Hết giờ, gia đình giàu nhất thắng.',
  },
] as const

const FEATURES = [
  {
    id: 'a',
    num: '64',
    title: 'Ngành sản xuất',
    body: 'Mỗi đội nhận một ngành riêng: gạo, cà phê, dệt may, chip bán dẫn và những ngành khác trong bộ 64.',
  },
  {
    id: 'b',
    num: '1.280',
    title: 'Sự kiện ngẫu nhiên',
    body: 'Thị trường, thời tiết, công nghệ, chính sách. Kho 1.280 tình huống ngẫu nhiên, nên mỗi trận mở ra khác nhau.',
  },
  {
    id: 'c',
    icon: 'phone',
    title: 'Thời gian thực trên điện thoại',
    body: 'Đội ra quyết định trên điện thoại. Máy chiếu cập nhật cùng lúc với cả phòng.',
  },
  {
    id: 'd',
    icon: 'sliders',
    title: 'Chủ phòng tùy chỉnh thời gian và vốn',
    body: 'Chọn phút của trận, vốn khởi điểm, giá từng khoản đầu tư, số giây mỗi năm và thời gian khóa nút.',
  },
  {
    id: 'e',
    icon: 'heir',
    title: 'Kế nghiệp gia đình',
    body: 'Chủ nhà máy có thể qua đời giữa chừng. Người thừa kế nhận xưởng và chơi tiếp đến hết giờ.',
  },
] as const

function readCode(params: URLSearchParams) {
  return (params.get('code') ?? '').trim().toUpperCase().slice(0, 8)
}

function FeatIcon({ name }: { name: 'phone' | 'sliders' | 'heir' }) {
  return (
    <svg className="feat-icon" viewBox="0 0 32 32" aria-hidden="true">
      {name === 'phone' && (
        <>
          <rect x="9" y="3" width="14" height="26" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M14 24.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {name === 'sliders' && (
        <>
          <path d="M5 9h22M5 16h22M5 23h22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="9" r="2.4" fill="#fbf3e4" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="20" cy="16" r="2.4" fill="#fbf3e4" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="11" cy="23" r="2.4" fill="#fbf3e4" stroke="currentColor" strokeWidth="1.8" />
        </>
      )}
      {name === 'heir' && (
        <>
          <circle cx="11" cy="9" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5.5 24c.8-5 4.2-7 5.5-7s4.7 2 5.5 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="21.5" cy="11" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16.5 25.5c.7-4.4 3.6-6.2 5-6.2s4.3 1.8 5 6.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
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
  const [board, setBoard] = useState(false)
  const [rows, setRows] = useState<GlobalRow[] | null>(null)
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
            Đi Tắt Đón Đầu
          </a>
          <nav className="land-nav" aria-label="Mục lục">
            <a href="#cach-choi">Cách chơi</a>
            <a href="#tinh-nang">Tính năng</a>
          </nav>
          <div className="land-actions">
            <button type="button" className="btn s" onClick={() => { setError(''); setHostOpen(false); setJoinStep('code'); setJoinOpen(true) }}>
              Vào chơi
            </button>
            <button type="button" className="btn land-cta" onClick={() => { setError(''); setJoinOpen(false); setHostOpen(true) }}>
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
            <div>
              <h1 id="hero-title">
                Đi Tắt
                <br />
                Đón Đầu
              </h1>
              <p className="tagline">Gây dựng nhà máy gia đình và truyền lại qua nhiều năm.</p>
              <p className="sub">Một lớp, một phòng: chủ phòng chiếu mã, mỗi đội chơi trên điện thoại.</p>
              <div className="hero-cta">
                <button type="button" className="btn" onClick={() => { setError(''); setHostOpen(false); setJoinStep('code'); setJoinOpen(true) }}>
                  Vào chơi
                </button>
                <button type="button" className="btn s" onClick={() => { setError(''); setJoinOpen(false); setHostOpen(true) }}>
                  Tạo phòng
                </button>
              </div>
            </div>
            <HeroArt />
          </div>
        </section>

        <section className="band" id="cach-choi" aria-labelledby="how-title">
          <div className="land-wrap how-grid">
            <div>
              <h2 className="section-title" id="how-title">
                Cách chơi
              </h2>
              <p className="deck">Mở trình duyệt trên điện thoại là chơi được. Không cần cài thêm ứng dụng.</p>
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
                Tính năng
              </h2>
              <p className="deck">Mỗi đội một nhà máy. Cả lớp một phòng.</p>
            </div>
            <div className="feat-grid">
              {FEATURES.map((feature) => (
                <article className={`card feat feat-${feature.id}`} key={feature.id}>
                  {'num' in feature ? (
                    <p className="feat-num">{feature.num}</p>
                  ) : (
                    <div className="feat-top">
                      <FeatIcon name={feature.icon} />
                      <h3>{feature.title}</h3>
                    </div>
                  )}
                  {'num' in feature && <h3>{feature.title}</h3>}
                  <p>{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

      </main>
      <footer className="land-foot">
        <div className="land-wrap foot-inner">
          <a className="wordmark" href="#dau-trang">
            Đi Tắt Đón Đầu
          </a>
          <p className="foot-copy">Trò chơi lớp học về nhà máy gia đình.</p>
          <button
            type="button"
            className="btn s foot-link"
            id="lbBtn"
            onClick={() => {
              setBoard(true)
              setRows(null)
              void fetchGlobalBoard()
                .then(setRows)
                .catch(() => setRows([]))
            }}
          >
            Bảng xếp hạng
          </button>
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
              <div className="settings price-grid">
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
      {board && (
        <div className="modal on" role="dialog" aria-modal="true" aria-labelledby="lb-title">
          <div className="card">
            <h2 id="lb-title">Bảng mọi phòng</h2>
            {rows == null ? (
              <p>
                <span className="lb-load" /> Đang tải bảng xếp hạng…
              </p>
            ) : rows.length === 0 ? (
              <p>Chưa có đội nào.</p>
            ) : (
              <table className="lb">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Đội</th>
                    <th>Ngành</th>
                    <th>Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.roomCode}-${row.teamName}-${index}`}>
                      <td>{index + 1}</td>
                      <td>{row.teamName}</td>
                      <td>{row.theme}</td>
                      <td>
                        <b>{vnd(row.score)}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button type="button" className="btn big" onClick={() => setBoard(false)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
