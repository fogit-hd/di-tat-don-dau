import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError, fetchGlobalBoard } from '../api/client.ts'
import type { GlobalRow } from '../api/types.ts'
import { vnd } from '../lib/format.ts'

export function StartScreen() {
  const navigate = useNavigate()
  const [hostName, setHostName] = useState('Nhóm trình chiếu')
  const [minutes, setMinutes] = useState(15)
  const [capital, setCapital] = useState(10000)
  const [cycle, setCycle] = useState(60)
  const [yearMin, setYearMin] = useState(10)
  const [joinCode, setJoinCode] = useState('')
  const [team, setTeam] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [how, setHow] = useState(false)
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

  async function createRoom() {
    setBusy(true)
    setError('')
    try {
      const created = await api<{ code: string; hostToken: string }>('/api/rooms', {
        method: 'POST',
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
    <main className="wrap">
      <section className="start" id="sStart">
        <div className="hero">
          <img src="/assets/industries/chip-ban-dan/factory-1.webp" alt="Nhà máy sản xuất chip bán dẫn" />
        </div>
        <div>
          <h1>Đi Tắt Đón Đầu</h1>
          <p className="lead">
            Một lớp, một phòng. Nhóm trình chiếu mở mã trên máy chiếu. Mỗi đội chơi trên điện thoại: chọn cách đổ vốn, chịu rủi ro, và giữ người để làm chủ máy.
          </p>
          {server === 'down' && <p className="warn">Máy chủ chưa sẵn sàng. Nếu vừa bật Docker, hãy đợi thêm một chút.</p>}
          <h2>Tạo phòng</h2>
          <input value={hostName} maxLength={40} onChange={(event) => setHostName(event.target.value)} placeholder="Tên nhóm trình chiếu" />
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
          <button type="button" className="btn big" disabled={busy || hostName.trim().length < 1} onClick={() => void createRoom()}>
            Mở phòng
          </button>
          <h2>Vào phòng</h2>
          <input value={joinCode} maxLength={8} placeholder="Mã phòng" onChange={(event) => setJoinCode(event.target.value.toUpperCase())} />
          <input value={team} maxLength={24} placeholder="Tên đội" onChange={(event) => setTeam(event.target.value)} />
          {error && <p className="warn">{error}</p>}
          <button type="button" className="btn big" disabled={busy || joinCode.trim().length < 4 || team.trim().length < 1} onClick={() => void join()}>
            Vào sảnh
          </button>
          <button type="button" className="btn s" id="howBtn" onClick={() => setHow(true)}>
            Cách chơi
          </button>
          <button
            type="button"
            className="btn s"
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
      </section>
      {how && (
        <div className="modal on">
          <div className="card">
            <h2>Cách chơi</h2>
            <p>
              Hết giờ phòng là hết trận. Bấm nút để sang năm ngay. Không bấm thì năm tự sang sau số giây chủ phòng chọn, mặc định 60. Đầu tư sớm thì ăn nhiều năm hơn, nhưng máy không có kỹ sư sẽ nằm im. Giữ tiền thì an toàn, nhưng lạm phát làm vốn mỏng đi.
            </p>
            <p>
              Không phải năm nào cũng có sự kiện. Khoảng sáu năm trong mười có một việc xảy ra, và ít hơn thế có thêm việc thứ hai. Năm yên, nhà máy chỉ có mây. Nút sang năm khóa vài giây sau mỗi năm, mặc định 10, để cảnh kịp diễn. Càng nhiều năm, càng dễ chủ nhà máy qua đời và đội chốt kết quả sớm.
            </p>
            <p>Đúng câu ôn tập được thêm vốn và kỹ sư. Sự kiện đánh khác nhau tùy đội đã đổ tiền vào đâu. Kết cục dựa trên tỷ lệ kỹ sư với máy: nhảy vọt, phụ thuộc công nghệ, hoặc tụt hậu.</p>
            <button type="button" className="btn big" onClick={() => setHow(false)}>
              Đã hiểu
            </button>
          </div>
        </div>
      )}
      {board && (
        <div className="modal on">
          <div className="card">
            <h2>Bảng mọi phòng</h2>
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
    </main>
  )
}
