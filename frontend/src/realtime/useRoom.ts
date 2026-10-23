import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import type { CentennialNotice, LongevityNotice, Snapshot, SuccessionNotice } from '../api/types.ts'
import { socketBase } from '../lib/endpoints.ts'

export function useRoom(code: string, role: 'host' | 'player', token: string | null) {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [succession, setSuccession] = useState<SuccessionNotice | null>(null)
  const [centennial, setCentennial] = useState<CentennialNotice | null>(null)
  const [longevity, setLongevity] = useState<LongevityNotice | null>(null)
  const [offline, setOffline] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || !code) return
    const socket = io(socketBase() || undefined, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
    })
    const hello = () => socket.emit('hello', { code: code.toUpperCase(), role, token })
    socket.on('connect', hello)
    socket.on('snapshot', (payload: Snapshot) => {
      setSnap(payload)
      setOffline(false)
      setError('')
    })
    socket.on('team:succession', (payload: SuccessionNotice) => setSuccession(payload))
    socket.on('team:centennial', (payload: CentennialNotice) => setCentennial(payload))
    socket.on('team:longevity', (payload: LongevityNotice) => setLongevity(payload))
    socket.on('problem', (payload: { error?: string }) => setError(payload.error || 'Không vào được phòng'))
    socket.on('disconnect', () => setOffline(true))
    const onVisible = () => {
      if (document.visibilityState === 'visible') hello()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      socket.close()
    }
  }, [code, role, token])

  return { snap, succession, centennial, longevity, offline, error }
}

export function useClock(snap: Snapshot | null) {
  const offset = useRef(0)
  const stamp = useRef(0)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 200)
    return () => window.clearInterval(id)
  }, [])
  if (snap && stamp.current !== snap.serverNow) {
    stamp.current = snap.serverNow
    offset.current = snap.serverNow - Date.now()
  }
  void tick
  if (!snap) return Date.now()
  if (snap.paused && snap.frozenNow) return snap.frozenNow
  return Date.now() + offset.current
}
