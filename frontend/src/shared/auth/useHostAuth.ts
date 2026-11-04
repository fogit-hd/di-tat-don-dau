import { useEffect, useState } from 'react'
import { api, ApiError } from '../http/client'
import type { GoogleIdentity } from './GoogleHostLogin'

const KEY = 'host-session', EVENT = 'host-session-change'
/** A single account across game routes, mounted screens and browser tabs. */
export function useHostAuth(options: { baseUrl?: string; pathPrefix?: string } = {}) {
  const [token, update] = useState(() => localStorage.getItem(KEY) || '')
  useEffect(() => {
    const sync = () => update(localStorage.getItem(KEY) || '')
    window.addEventListener('storage', sync); window.addEventListener(EVENT, sync)
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(EVENT, sync) }
  }, [])
  useEffect(()=>{
    if(!token)return
    let active=true
    void api(`${options.pathPrefix??'/api/auth'}/me`,{hostSession:token,baseUrl:options.baseUrl}).catch(error=>{
      if(active&&error instanceof ApiError&&error.status===401&&localStorage.getItem(KEY)===token){
        localStorage.removeItem(KEY);update('');window.dispatchEvent(new Event(EVENT))
      }
    })
    return()=>{active=false}
  },[token,options.baseUrl,options.pathPrefix])
  function setToken(value: string) {
    if (value) localStorage.setItem(KEY, value); else localStorage.removeItem(KEY)
    update(value); window.dispatchEvent(new Event(EVENT))
  }
  async function logout() {
    // Revoke before forgetting the credential; a failed network request is visible to the caller.
    if (token) await api(`${options.pathPrefix ?? '/api/auth'}/logout`, { body: {}, hostSession: token, baseUrl: options.baseUrl })
    setToken('')
    ;(window as Window & { google?: GoogleIdentity }).google?.accounts.id.disableAutoSelect?.()
  }
  return { token, setToken, logout }
}
