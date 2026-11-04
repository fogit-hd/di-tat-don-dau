import { StaticArt as S } from './ui/StaticArt'
import { Link, Navigate, useLocation } from 'react-router-dom'
import './game-hub.css'

export function GameHub() {
  const location = useLocation()
  // Old projected QR codes used /?code=ABCDE. Preserve their entry flow.
  if (new URLSearchParams(location.search).get('code')) return <Navigate replace to={`/di-tat-don-dau${location.search}`} />
  return <main className="game-portal" translate="no">
    <header><h1><img className="dq-lettering-image" src="/assets/duck-race/lettering-v4/portal-title.svg" width="620" height="98" alt="Chọn trò chơi" draggable="false"/></h1><p><S text="Hai thế giới. Hai cách dẫn đầu."/></p></header>
    <div className="portal-games">
      <Link className="portal-game portal-factory" to="/di-tat-don-dau">
        <div className="portal-scene"><img className="portal-factory-art" src="/assets/landing-v2/hero-art.webp" alt="Thế giới doanh nghiệp Đi Tắt Đón Đầu" draggable="false"/><img className="portal-logo" src="/assets/landing-v2/brand-logo.webp" alt="Đi Tắt Đón Đầu" draggable="false"/></div>
        <div className="portal-description"><h2><S text="Đi Tắt Đón Đầu" bold/></h2><p><S text="Điều hành doanh nghiệp, đầu tư và vượt qua những biến cố để vươn lên dẫn đầu."/></p><span className="portal-tags"><S text="Quản lý doanh nghiệp · Chiến lược kinh tế"/></span><span className="portal-enter"><S text="Vào Đi Tắt Đón Đầu"/></span></div>
      </Link>
      <Link className="portal-game portal-duck" to="/duck-race">
        <div className="portal-scene"><img className="portal-race-art" src="/assets/duck-race/background-v3/terrain.webp" alt="Đường đua đất và cỏ Quiz Duck Race" draggable="false"/><div className="portal-ducks" aria-hidden="true">{['purple','yellow','aqua'].map((color,i)=><img key={color} style={{marginTop:`${i%2?30:0}px`}} src={`/assets/duck-race/duckee/${color}/walk_run/0.png`} alt="" draggable="false"/>)}</div></div>
        <div className="portal-description"><h2><S text="Quiz Duck Race" bold/></h2><p><S text="Trả lời kiếm vốn, lăn bứt tốc, né chướng ngại và tranh tài cùng những chú vịt."/></p><span className="portal-tags"><S text="10 phút · Đua vịt chiến thuật"/></span><span className="portal-enter"><S text="Vào Quiz Duck Race"/></span></div>
      </Link>
    </div>
    <footer><S text="Chọn một game để tạo phòng hoặc tham gia bằng mã phòng."/></footer>
  </main>
}
