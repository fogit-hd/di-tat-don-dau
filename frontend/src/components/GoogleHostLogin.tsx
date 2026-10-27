import { useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../api/client'
import { googleClientId } from '../lib/endpoints'
import { PaintedArt as Art } from './ArtText'
import { PublicArtText as T } from './PublicArtText'
import './google-host-login.css'

export type GoogleIdentity = { accounts: { id: {
  initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void
  renderButton: (element: HTMLElement, options: Record<string, unknown>) => void
  disableAutoSelect?: () => void
} } }
type LoginResult = { token: string; user: { name: string } }

/** Keep the genuine Google Identity control and verify its credential on our server. */
export function GoogleHostLogin({ intent, onSuccess, onClose }: {
  intent: 'create' | 'login'; onSuccess: (result: LoginResult) => void; onClose: () => void
}) {
  const panel = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLDivElement>(null)
  const callbacks = useRef({ onSuccess, onClose })
  const [status, setStatus] = useState<'loading' | 'ready' | 'verifying' | 'error'>('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => { callbacks.current = { onSuccess, onClose } }, [onSuccess, onClose])

  useEffect(() => {
    const previous = document.activeElement, overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); callbacks.current.onClose(); return }
      if (event.key !== 'Tab') return
      const nodes = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],iframe,[tabindex="0"]') ?? [])
        .filter(node => node.getClientRects().length > 0 && node.getAttribute('aria-hidden') !== 'true')
      const first = nodes[0], last = nodes.at(-1)
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => {
      document.removeEventListener('keydown', keydown); document.body.style.overflow = overflow
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [])

  useEffect(() => {
    let closed = false, inFlight = false, rendered = false
    const container = button.current
    const clientId = googleClientId()
    const fail = (message: string) => { if (!closed) { setError(message); setStatus('error') } }
    if (!clientId) { fail('Đăng nhập Google chưa sẵn sàng. Vui lòng thử lại sau.'); return }
    const render = () => {
      const google = (window as Window & { google?: GoogleIdentity }).google
      if (closed || rendered || !google || !container) return
      rendered = true
      google.accounts.id.initialize({ client_id: clientId, callback: response => {
        if (closed || inFlight) return
        inFlight = true; setError(''); setStatus('verifying')
        void api<LoginResult>('/api/auth/google', { method: 'POST', body: { credential: response.credential } })
          .then(result => { if (!closed) callbacks.current.onSuccess(result) })
          .catch(err => fail(err instanceof ApiError ? err.message : 'Không đăng nhập được Google. Vui lòng thử lại.'))
          .finally(() => { inFlight = false })
      } })
      container.replaceChildren()
      google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', text: 'signin_with', shape: 'rectangular', locale: 'vi', width: Math.max(200, Math.min(360, Math.floor(container.clientWidth))) })
      setStatus('ready')
    }
    let script = document.querySelector<HTMLScriptElement>('script[data-google-identity]')
    if (!script) {
      script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'
      script.async = true; script.defer = true; script.dataset.googleIdentity = 'true'
      document.head.appendChild(script)
    }
    const loaded = () => { render(); if (!rendered) failed() }
    const failed = () => { if (!closed) { script?.remove(); fail('Không tải được đăng nhập Google. Kiểm tra kết nối rồi thử lại.') } }
    script.addEventListener('load', loaded); script.addEventListener('error', failed)
    render()
    const timeout = window.setTimeout(() => { if (!rendered) failed() }, 15000)
    return () => { closed = true; window.clearTimeout(timeout); script?.removeEventListener('load', loaded); script?.removeEventListener('error', failed) }
  }, [attempt])

  return <div className="host-login-overlay" onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div ref={panel} className="host-login-panel painted-frame" data-painted-frame role="dialog" aria-modal="true" aria-labelledby="google-login-title" aria-describedby="google-login-description" tabIndex={-1}>
      <button type="button" className="host-login-close" aria-label="Đóng đăng nhập" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
      <Art src="/assets/landing-v2/brand-logo.webp" alt="Đi Tắt Đón Đầu" className="host-login-brand"/>
      <h2 id="google-login-title"><T text={intent === 'create' ? 'Đăng nhập để tạo phòng' : 'Đăng nhập chủ phòng'} bold/></h2>
      <p id="google-login-description"><T text="Chỉ chủ phòng cần đăng nhập Google. Báo cáo từng lượt chơi sẽ được lưu vào tài khoản này."/></p>
      <div className="host-login-provider" aria-busy={status === 'loading' || status === 'verifying'}>
        <div ref={button} className="google-login" inert={status === 'verifying'}/>
        {(status === 'loading' || status === 'verifying') && <p role="status"><T text={status === 'loading' ? 'Đang tải đăng nhập Google…' : 'Đang xác nhận đăng nhập…'}/></p>}
      </div>
      {error && <div className="host-login-error"><p role="alert"><T text={error}/></p><button type="button" className="public-button public-button-dark" onClick={() => { setError(''); setStatus('loading'); setAttempt(value => value + 1) }}><T text="Thử lại"/></button></div>}
      <div className="host-login-actions"><button type="button" className="public-button public-button-dark" onClick={onClose}><T text="Đóng"/></button></div>
    </div>
  </div>
}
