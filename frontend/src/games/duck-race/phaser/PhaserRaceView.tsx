import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import type { InputController } from './bridge/InputController'
import { SimulationBridge, type RaceSource } from './bridge/SimulationBridge'

export function PhaserRaceView({ source, onInput }: { source: RaceSource; onInput: (input?: InputController) => void }) {
  const mount = useRef<HTMLDivElement>(null), callback = useRef(onInput)
  useEffect(() => { callback.current = onInput }, [onInput])
  const [status, setStatus] = useState({ progress: 0, ready: false, error: '' }), [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false, game: Phaser.Game | undefined, observer: ResizeObserver | undefined
    const bridge = new SimulationBridge(source)
    void import('./createGameConfig').then(({ createRaceGame }) => {
      if (cancelled || !mount.current) return
      game = createRaceGame(mount.current, bridge, {
        progress: progress => { if (!cancelled) setStatus(s => ({ ...s, progress, ready: false })) },
        error: error => { if (!cancelled) setStatus(s => ({ ...s, error })) },
        ready: input => {
          if (cancelled) return
          game!.canvas.setAttribute('aria-hidden', 'true')
          setStatus(s => ({ ...s, ready: true })); callback.current(input)
        },
      })
      observer = new ResizeObserver(([entry]) => {
        if (game?.isBooted && entry.contentRect.width && entry.contentRect.height)
          game.scale.resize(Math.round(entry.contentRect.width), Math.round(entry.contentRect.height))
      })
      observer.observe(mount.current)
    }).catch(() => { if (!cancelled) setStatus(s => ({ ...s, error: 'Không mở được đường đua. Vui lòng thử lại.' })) })
    return () => {
      cancelled = true; observer?.disconnect(); callback.current(undefined); bridge.release()
      // noReturn must remain false: React StrictMode/remount needs a fresh Phaser instance.
      game?.destroy(true, false)
    }
  }, [source, attempt])
  return <div className="ph-race-view" ref={mount} role="group" aria-label="Đường đua ngang Phaser. WASD di chuyển, Space nhảy đôi, Shift cúi, E lăn.">
    {!status.ready && <div className="ph-loading" role="status">
      <img src="/assets/duck-race/portraits-v6/duckee/yellow.webp" alt="" />
      <p>{status.error || `Đang mở đường đua… ${Math.round(status.progress * 100)}%`}</p>
      {status.error && <button className="ph-action" onClick={() => { setStatus({ progress: 0, ready: false, error: '' }); setAttempt(a => a + 1) }}>Thử lại</button>}
    </div>}
  </div>
}
