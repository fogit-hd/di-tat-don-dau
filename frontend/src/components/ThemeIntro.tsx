import { useState } from 'react'
import type { ThemeView } from '../api/types.ts'
import { factoryArt } from '../lib/art.ts'

export function ThemeIntro({
  theme,
  busy,
  onBegin,
}: {
  theme: ThemeView
  busy: boolean
  onBegin: (factoryName: string) => void
}) {
  const [name, setName] = useState(theme.factoryName)
  return (
    <section id="sIntro">
      <div className="card">
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
            <b>Nhà máy của bạn tên là:</b>
          </p>
          <input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
        </div>
        <button type="button" className="btn big" disabled={busy} onClick={() => onBegin(name)}>
          Bắt đầu
        </button>
      </div>
    </section>
  )
}
