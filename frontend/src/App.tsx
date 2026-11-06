import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { GameHub } from './shared/GameHub.tsx'
const HostScreen = lazy(() => import('./games/di-tat-don-dau/components/HostScreen.tsx').then(m=>({default:m.HostScreen})))
const PlayScreen = lazy(() => import('./games/di-tat-don-dau/components/PlayScreen.tsx').then(m=>({default:m.PlayScreen})))
const StartScreen = lazy(() => import('./games/di-tat-don-dau/components/StartScreen.tsx').then(m=>({default:m.StartScreen})))
const DuckRace = lazy(() => import('./games/duck-race/experience/DuckExperience.tsx').then(m => ({ default: m.DuckExperience })))
const PhaserPreview = lazy(() => import('./games/duck-race/phaser/PhaserPreview.tsx').then(m => ({ default: m.PhaserPreview })))

function RoutePresentation() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = pathname.startsWith('/duck-race') ? 'Quiz Duck Race — Đua Vịt Chiến Thuật' : pathname === '/' || pathname === '/games' ? 'Chọn trò chơi' : 'Đi Tắt Đón Đầu'
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <RoutePresentation />
      <Suspense fallback={<p role="status">Đang mở trò chơi…</p>}>
      <Routes>
        <Route path="/games" element={<Suspense fallback={<p>Đang tải danh sách game…</p>}><GameHub /></Suspense>} />
        <Route path="/duck-race" element={<Suspense fallback={<p>Đang tải đường đua…</p>}><DuckRace /></Suspense>} />
        <Route path="/duck-race/join/:code" element={<DuckRace />} />
        <Route path="/duck-race/preview/phaser" element={<PhaserPreview />} />
        <Route path="/duck-race/host/:code" element={<Suspense fallback={<p>Đang tải đường đua…</p>}><DuckRace /></Suspense>} />
        <Route path="/duck-race/play/:code" element={<Suspense fallback={<p>Đang tải đường đua…</p>}><DuckRace /></Suspense>} />
        <Route path="/" element={<GameHub />} />
        <Route path="/di-tat-don-dau" element={<StartScreen />} />
        <Route path="/wiki" element={<StartScreen wiki />} />
        <Route path="/host/:code" element={<HostScreen />} />
        <Route path="/play/:code" element={<PlayScreen />} />
        <Route path="/join/:code" element={<PlayScreen />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
