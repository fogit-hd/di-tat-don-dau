import { useState } from 'react'
import type { ThemeView } from '../api/types.ts'
import { factoryArt } from '../lib/art.ts'
import { FACTORY_NAME_MAX_LENGTH } from '../lib/form-limits.ts'

export function ThemeIntro({
  theme,
  busy,
  onBegin,
  error,
}: {
  theme: ThemeView
  busy: boolean
  onBegin: (factoryName: string) => void
  error?: string
}) {
  const [name, setName] = useState(() => theme.factoryName.trim().slice(0, FACTORY_NAME_MAX_LENGTH))
  return (
    <section id="sIntro">
      <form className="card" onSubmit={event => { event.preventDefault(); if (!busy) onBegin(name.trim()) }}>
        <img id="introImg" src={factoryArt(theme.industryId)} alt="" />
        <h2>{theme.industryName}</h2>
        <p className="meta">
          {theme.scaleName} · {theme.regionName} · {theme.contextName}
        </p>
        <div className="intro-copy">
          <p>
            <b>Bạn là:</b> {theme.role}
          </p>
          <p>
            <b>Bạn đang làm gì:</b> {theme.mission}
          </p>
          <p>
            <label htmlFor="intro-factory-name"><b>Nhà máy của bạn tên là:</b></label>
          </p>
          <input id="intro-factory-name" aria-describedby="intro-name-help" aria-invalid={Boolean(error)} value={name} maxLength={FACTORY_NAME_MAX_LENGTH} onChange={(event) => setName(event.target.value)} />
          <small id="intro-name-help">{name.length}/{FACTORY_NAME_MAX_LENGTH} ký tự</small>
          {error && <p className="warn" role="alert">{error}</p>}
        </div>
        <button type="submit" className="btn big" disabled={busy}>
          Bắt đầu
        </button>
      </form>
    </section>
  )
}
