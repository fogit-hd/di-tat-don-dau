import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './games/di-tat-don-dau/styles/index.css'
import './shared/ui/public-font.css'
import './games/di-tat-don-dau/styles/readable-ui.css'
import App from './App.tsx'
import { installImageDragGuard } from './shared/ui/image-drag.ts'

installImageDragGuard()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
