import { useEffect, useState } from 'react'
import type { EffectView, SceneView } from '../api/types.ts'
import { factoryArt } from '../lib/art.ts'
import { clamp } from '../lib/format.ts'
import { YearWeather } from './YearWeather.tsx'

export function FactoryScene({ scene, paused, now, dim = false }: { scene: SceneView; paused: boolean; now: number; dim?: boolean }) {
  const [photo, setPhoto] = useState(false)
  const [inspect, setInspect] = useState<{ title: string; body: string } | null>(null)
  useEffect(() => {
    let dead = false
    setPhoto(false)
    const img = new Image()
    img.onload = () => {
      if (!dead) setPhoto(true)
    }
    img.onerror = () => {
      if (!dead) setPhoto(false)
    }
    img.src = factoryArt(scene.industryId)
    return () => {
      dead = true
    }
  }, [scene.industryId])

  const outage = strongest(scene.effects, 'power_outage', now)
  const crisis = strongest(scene.effects, 'crisis', now)
  const brain = strongest(scene.effects, 'brain_drain', now)
  const fdi = strongest(scene.effects, 'fdi', now)
  const smogEvent = strongest(scene.effects, 'smog', now)
  const supply = strongest(scene.effects, 'supply_shock', now)
  const breakthrough = strongest(scene.effects, 'breakthrough', now)
  const policy = strongest(scene.effects, 'policy', now)
  const workers = clamp(scene.engineers > 60 ? Math.round(scene.engineers / 450) : 0, scene.engineers > 60 ? 1 : 0, 8)
  const halls = clamp(Math.round(scene.machines), 1, 4)
  const chimneys = clamp(Math.round(scene.machines), 0, 4)
  const lit = outage ? 0 : scene.util
  const smog = clamp(scene.pollution / 130 + (smogEvent?.intensity ?? 0) * 0.55, 0, 0.72)
  const skyDull = clamp(scene.pollution / 220 + (crisis?.intensity ?? 0) * 0.35 + (outage ? 0.25 : 0), 0, 0.7)
  const bright = scene.cash > scene.value * 0.55 ? 1 : 0.45
  const quake = Boolean(strongest(scene.effects, 'earthquake', now))

  return (
    <section id="scene" className={`card scene${paused ? ' is-paused' : ''}${dim || scene.finished ? ' is-dim' : ''}${quake ? ' quake' : ''}`}>
      <svg viewBox="0 0 1600 900" role="img" aria-label={scene.factoryName}>
        {photo && (
          <image
            href={factoryArt(scene.industryId)}
            x="0"
            y="0"
            width="1600"
            height="900"
            preserveAspectRatio="xMidYMid slice"
            opacity={outage ? 0.72 : 1}
          />
        )}
        {!photo && (
        <>
        <g id="sky">
          <rect width="1600" height="900" fill={outage ? '#3a2a33' : '#f6e2c4'} />
          <rect width="1600" height="900" fill="#5a2236" opacity={skyDull} />
          <circle cx="1280" cy="150" r="70" fill="#ffe2a4" opacity={outage ? 0.05 : 0.9 - skyDull} />
        </g>
        <g id="weather" opacity={crisis?.intensity ?? 0}>
          <ellipse cx="360" cy="150" rx="180" ry="54" fill="#4d4450" />
          <ellipse cx="760" cy="120" rx="230" ry="64" fill="#3c3340" />
          <ellipse cx="1180" cy="160" rx="200" ry="50" fill="#4a404c" />
          {Array.from({ length: 14 }, (_, i) => (
            <line key={i} x1={80 + i * 110} y1={180} x2={60 + i * 110} y2={320} stroke="#d7e4ef" strokeWidth="3" className="rain" opacity="0.8" />
          ))}
        </g>
        <g id="ground">
          <path d="M0 560 C200 540 400 580 700 555 C1000 530 1300 575 1600 548 L1600 900 L0 900 Z" fill="#e7d3ae" />
          <path d="M0 700 H1600" stroke="#c9b18a" strokeWidth="8" />
          {scene.trajectory === 'lag' && scene.cycles >= 2 && <path d="M180 640 h90 M420 655 h70 M980 648 h80" stroke="#8a5a3a" strokeWidth="6" />}
        </g>
        <g id="river">
          <path d="M0 790 C300 760 600 820 900 780 C1200 750 1400 810 1600 790 L1600 900 L0 900 Z" fill={scene.pollution > 45 ? '#7e8a62' : '#7eb8b2'} />
        </g>
        <g id="trees" opacity={clamp(0.25 + scene.green * 0.35 - scene.pollution / 200, 0.15, 1)}>
          <Tree x={120} wilt={scene.pollution > 50} />
          <Tree x={230} wilt={scene.pollution > 60} />
          <Tree x={1460} wilt={scene.pollution > 50} />
        </g>
        <g id="buildings">
          {photo ? (
            <image
              href={factoryArt(scene.industryId)}
              x="180"
              y="150"
              width="1100"
              height="470"
              preserveAspectRatio="xMidYMax meet"
              opacity={outage ? 0.55 : 1}
            />
          ) : (
            <Procedural art={scene.art} halls={halls} leap={scene.trajectory === 'leap'} />
          )}
          {(scene.green > 0.8 || scene.trajectory === 'leap') && (
            <g id="solar">
              <rect x="1080" y="430" width="70" height="36" fill="#3f8f86" stroke="#4a3328" strokeWidth="3" transform="skewY(-12)" />
              <rect x="1160" y="418" width="70" height="36" fill="#3f8f86" stroke="#4a3328" strokeWidth="3" transform="skewY(-12)" />
            </g>
          )}
        </g>
        <g id="chimneys">
          {Array.from({ length: chimneys }, (_, i) => (
            <g key={i} transform={`translate(${480 + i * 150} 250)`}>
              {!photo && <rect x="0" y="40" width="28" height="90" fill="#8d7468" stroke="#4a3328" strokeWidth="3" />}
              {scene.operating > 0.3 && !outage && (
                <g className="smoke">
                  <circle cx="14" cy="20" r="12" fill="#d9cbb8" />
                  <circle cx="28" cy="0" r="16" fill="#e6d8c6" />
                </g>
              )}
            </g>
          ))}
        </g>
        <g id="windows">
          {!photo &&
            Array.from({ length: halls * 3 }, (_, i) => (
              <rect
                key={i}
                x={430 + (i % 6) * 78}
                y={390 + Math.floor(i / 6) * 48}
                width="28"
                height="18"
                rx="2"
                fill={lit > 0.4 && i % 3 !== 2 ? '#ffe1a3' : '#6d625c'}
                opacity={outage ? 0.35 : 1}
              />
            ))}
        </g>
        <g id="lines">
          {scene.machines > 0.4 && (
            <g transform="translate(500 560)">
              <rect width={160 + halls * 40} height="16" rx="3" fill={scene.idle > scene.operating ? '#9a918a' : '#c9b9a6'} stroke="#4a3328" strokeWidth="3" />
              <rect className={scene.operating > 0.4 && !outage ? 'belt' : ''} x="8" y="4" width="40" height="8" fill="#9fc6bf" />
            </g>
          )}
        </g>
        <g id="infrastructure">
          {scene.infra >= 1 && <path d="M80 700 H1520" stroke="#fbf3e4" strokeWidth="10" />}
          {scene.infra >= 1.4 && <path d="M200 300 H1200" stroke="#4a3328" strokeWidth="3" />}
          {scene.support >= 1 && (
            <g transform="translate(180 500)">
              <path d="M0 80 L20 40 H90 L110 80 Z" fill="#d7c3a6" stroke="#4a3328" strokeWidth="3" />
            </g>
          )}
        </g>
        <g id="workers">
          {Array.from({ length: workers }, (_, i) => (
            <Worker key={i} x={560 + (i % 4) * 70} y={650 + Math.floor(i / 4) * 8} />
          ))}
          {brain &&
            Array.from({ length: 3 }, (_, i) => (
              <g key={i} opacity={brain.intensity} transform={`translate(${brain.t * 260 + i * 36} 0)`}>
                <Worker x={700} y={640} leaving suitcase />
              </g>
            ))}
        </g>
        <g id="trucks">
          {(scene.output > 20 || scene.support > 0.5) && <Truck x={980 + (supply ? 0 : 40)} empty={Boolean(supply)} mark={Boolean(supply)} />}
          {scene.output > 80 && <Truck x={1180} />}
        </g>
        <g id="rnd">
          {(scene.engineers > 700 || breakthrough) && (
            <g transform="translate(1120 430)" opacity={breakthrough ? 0.7 + breakthrough.intensity * 0.3 : 1}>
              <path d="M0 110 L20 50 H130 L150 110 Z" fill="#f7efe2" stroke="#4a3328" strokeWidth="3" />
              <path d="M20 50 L75 16 L130 50" fill="none" stroke="#e7a93b" strokeWidth="4" />
              {breakthrough && <circle cx="75" cy="20" r={10 + breakthrough.intensity * 16} fill="#ffe7a8" opacity={breakthrough.intensity} />}
            </g>
          )}
        </g>
        <g id="banners" opacity={bright}>
          <rect x="250" y="250" width="18" height="70" fill="#e8503f" stroke="#4a3328" strokeWidth="3" />
          <path d="M268 250 h70 l-12 16 12 16 h-70 z" fill={scene.trajectory === 'depend' ? '#2f5f9e' : '#e7a93b'} stroke="#4a3328" strokeWidth="3" />
          {policy && (
            <g opacity={policy.intensity}>
              <rect x="860" y="300" width="16" height="80" fill="#3f8f86" stroke="#4a3328" strokeWidth="3" />
              <path d="M876 300 h64 l-10 14 10 14 h-64 z" fill="#e8503f" stroke="#4a3328" strokeWidth="3" />
            </g>
          )}
          {scene.trajectory === 'depend' && scene.cycles >= 2 && (
            <g transform="translate(760 560)">
              <rect width="54" height="34" fill="#f4f7fb" stroke="#4a3328" strokeWidth="3" />
              <path d="M0 17 H54 M27 0 V34" stroke="#2f5f9e" strokeWidth="4" />
            </g>
          )}
        </g>
        <g id="overlay-event">
          <rect width="1600" height="520" fill="#9aa0a6" opacity={smog} pointerEvents="none" />
          <Hit
            show={crisis}
            x={640}
            y={80}
            w={280}
            h={120}
            onPick={() => crisis && setInspect({ title: crisis.effect.title, body: crisis.effect.body })}
          />
          {fdi && (
            <g opacity={Math.max(0.35, fdi.intensity)} transform="translate(980 360)">
              <rect x="70" y={80 - fdi.t * 70} width="120" height={20 + fdi.t * 70} fill="#efe2cf" stroke="#4a3328" strokeWidth="3" />
              <path d="M20 90 V10 H40" stroke="#4a3328" strokeWidth="6" fill="none" />
              <path d="M40 18 H110" stroke="#e7a93b" strokeWidth="4" />
            </g>
          )}
          <Hit show={fdi} x={980} y={340} w={220} h={180} onPick={() => fdi && setInspect({ title: fdi.effect.title, body: fdi.effect.body })} />
          <Hit show={outage} x={400} y={300} w={600} h={220} onPick={() => outage && setInspect({ title: outage.effect.title, body: outage.effect.body })} />
          <Hit show={brain} x={700} y={560} w={360} h={120} onPick={() => brain && setInspect({ title: brain.effect.title, body: brain.effect.body })} />
          <Hit show={supply} x={960} y={600} w={200} h={80} onPick={() => supply && setInspect({ title: supply.effect.title, body: supply.effect.body })} />
          <Hit show={smogEvent} x={200} y={80} w={1000} h={160} onPick={() => smogEvent && setInspect({ title: smogEvent.effect.title, body: smogEvent.effect.body })} />
          <Hit show={breakthrough} x={1120} y={400} w={180} h={140} onPick={() => breakthrough && setInspect({ title: breakthrough.effect.title, body: breakthrough.effect.body })} />
        </g>
        </>
        )}
        <YearWeather effects={scene.effects} anchors={scene.anchors} onInspect={setInspect} />
      </svg>
      {inspect && (
        <button type="button" className="inspect" onClick={() => setInspect(null)}>
          <b>{inspect.title}</b>
          <span>{inspect.body}</span>
        </button>
      )}
    </section>
  )
}

function strongest(effects: EffectView[], visual: string, now: number) {
  let best: { intensity: number; t: number; effect: EffectView } | null = null
  for (const effect of effects) {
    if (effect.visual !== visual) continue
    const span = Math.max(1, effect.endsAt - effect.startedAt)
    const t = clamp((now - effect.startedAt) / span, 0, 1)
    const intensity = Math.min(clamp(t / 0.18, 0, 1), clamp((1 - t) / 0.28, 0, 1))
    if (!best || intensity > best.intensity) best = { intensity, t, effect }
  }
  return best && best.intensity > 0.02 ? best : null
}

function Hit({
  show,
  x,
  y,
  w,
  h,
  onPick,
}: {
  show: { intensity: number } | null
  x: number
  y: number
  w: number
  h: number
  onPick: () => void
}) {
  if (!show) return null
  return <rect x={x} y={y} width={w} height={h} fill="transparent" onClick={onPick} style={{ cursor: 'pointer' }} />
}

function Tree({ x, wilt }: { x: number; wilt: boolean }) {
  return (
    <g transform={`translate(${x} 560)`}>
      <rect x="-4" y="20" width="8" height="36" fill="#6b4a32" />
      <circle cy="10" r="26" fill={wilt ? '#9a8b55' : '#6f9a62'} stroke="#4a3328" strokeWidth="3" />
    </g>
  )
}

function Worker({ x, y, leaving = false, suitcase = false }: { x: number; y: number; leaving?: boolean; suitcase?: boolean }) {
  return (
    <g className={leaving ? 'leaver' : 'walker'} transform={`translate(${x} ${y})`}>
      <circle cx="0" cy="-28" r="7" fill="#f2d3b3" stroke="#4a3328" strokeWidth="2" />
      <path d="M-8 -18 Q0 -6 8 -18 L9 2 H-9 Z" fill="#fbf3e4" stroke="#4a3328" strokeWidth="2" />
      <path d="M-5 2 L-7 16 M5 2 L8 16" stroke="#4a3328" strokeWidth="2" />
      {suitcase && <rect x="10" y="-8" width="11" height="8" fill="#8d4b55" stroke="#4a3328" />}
    </g>
  )
}

function Truck({ x, empty = false, mark = false }: { x: number; empty?: boolean; mark?: boolean }) {
  return (
    <g transform={`translate(${x} 630)`} opacity={empty ? 0.55 : 1}>
      <rect x="0" y="0" width="70" height="28" fill={empty ? '#d9d0c6' : '#e7a93b'} stroke="#4a3328" strokeWidth="3" />
      <rect x="70" y="8" width="28" height="20" fill="#fbf3e4" stroke="#4a3328" strokeWidth="3" />
      <circle cx="18" cy="32" r="7" fill="#3b2a22" />
      <circle cx="78" cy="32" r="7" fill="#3b2a22" />
      {mark && (
        <g stroke="#e8503f" strokeWidth="4">
          <path d="M20 6 L50 22 M50 6 L20 22" />
        </g>
      )}
    </g>
  )
}

function Procedural({ art, halls, leap }: { art: string; halls: number; leap: boolean }) {
  const roof = art === 'cleanroom' ? '#f7f1e6' : art === 'process' ? '#d98b6a' : '#8d4b55'
  const body = art === 'cleanroom' ? '#fbf7f0' : '#e6d3b4'
  return (
    <g>
      {Array.from({ length: halls }, (_, i) => (
        <g key={i} transform={`translate(${380 + i * 150} ${art === 'process' ? 20 : 0})`}>
          <path d={`M0 520 L30 ${360 - (leap ? 20 : 0)} H150 L180 520 Z`} fill={body} stroke="#4a3328" strokeWidth="4" />
          <path d={`M20 ${360 - (leap ? 20 : 0)} L90 ${300 - (leap ? 30 : 0)} L160 ${360 - (leap ? 20 : 0)}`} fill={roof} stroke="#4a3328" strokeWidth="4" />
        </g>
      ))}
      {art === 'process' && <ellipse cx="980" cy="500" rx="46" ry="70" fill="#c9b9a6" stroke="#4a3328" strokeWidth="4" />}
    </g>
  )
}
