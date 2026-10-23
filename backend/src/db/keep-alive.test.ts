import { describe, expect, it, vi } from 'vitest'
import { keepAliveEnabled, keepAliveIntervalMs, startDbKeepAlive } from './keep-alive'

describe('keepAliveEnabled', () => {
  it('is on unless turned off', () => {
    expect(keepAliveEnabled(undefined)).toBe(true)
    expect(keepAliveEnabled('')).toBe(true)
    expect(keepAliveEnabled('1')).toBe(true)
    expect(keepAliveEnabled('0')).toBe(false)
    expect(keepAliveEnabled('false')).toBe(false)
    expect(keepAliveEnabled('off')).toBe(false)
  })
})

describe('keepAliveIntervalMs', () => {
  it('defaults to 18 hours and stays inside 12–24', () => {
    expect(keepAliveIntervalMs(undefined)).toEqual({ ms: 18 * 60 * 60 * 1000, hours: 18, clamped: false })
    expect(keepAliveIntervalMs('12').hours).toBe(12)
    expect(keepAliveIntervalMs('24').hours).toBe(24)
    expect(keepAliveIntervalMs('6')).toMatchObject({ hours: 12, clamped: true })
    expect(keepAliveIntervalMs('48')).toMatchObject({ hours: 24, clamped: true })
    expect(keepAliveIntervalMs('nope').hours).toBe(18)
  })
})

describe('startDbKeepAlive', () => {
  it('does not schedule when disabled', () => {
    const schedule = vi.fn()
    const stop = startDbKeepAlive({ enabled: false, schedule })
    expect(schedule).not.toHaveBeenCalled()
    stop()
  })

  it('pings on the given interval and can be stopped', async () => {
    const ping = vi.fn(async () => undefined)
    let tick: (() => void) | undefined
    const stop = startDbKeepAlive({
      enabled: true,
      intervalMs: 1000,
      ping,
      schedule: (fn) => {
        tick = fn
        return { unref() {} }
      },
    })
    tick?.()
    await vi.waitFor(() => expect(ping).toHaveBeenCalledOnce())
    stop()
  })
})
