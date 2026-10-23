let ctx: AudioContext | null = null

export function beep(freq: number, duration = 0.12, muted = false) {
  if (muted) return
  try {
    ctx = ctx ?? new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = freq
    osc.type = 'triangle'
    gain.gain.value = 0.08
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.stop(ctx.currentTime + duration)
  } catch {
    /* trình duyệt chặn âm thanh cho đến khi có thao tác */
  }
}
