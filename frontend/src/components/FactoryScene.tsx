import { useState } from 'react'
import type { SceneView } from '../api/types.ts'
import { factoryArt } from '../lib/art.ts'

export function FactoryScene({ scene, paused, dim = false }: { scene: SceneView; paused: boolean; now?: number; dim?: boolean }) {
  const [photo, setPhoto] = useState(true)
  return (
    <section className={`card scene${paused ? ' is-paused' : ''}${dim || scene.finished ? ' is-dim' : ''}`}>
      {photo ? (
        <img src={factoryArt(scene.industryId)} alt={scene.factoryName} onError={() => setPhoto(false)} />
      ) : (
        <p className="scene-fallback">{scene.factoryName}</p>
      )}
    </section>
  )
}
