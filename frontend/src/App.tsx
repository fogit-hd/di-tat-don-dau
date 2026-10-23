import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HostScreen } from './components/HostScreen.tsx'
import { PlayScreen } from './components/PlayScreen.tsx'
import { StartScreen } from './components/StartScreen.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartScreen />} />
        <Route path="/host/:code" element={<HostScreen />} />
        <Route path="/play/:code" element={<PlayScreen />} />
        <Route path="/join/:code" element={<PlayScreen />} />
      </Routes>
    </BrowserRouter>
  )
}
