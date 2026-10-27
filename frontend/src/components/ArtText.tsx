import type { CSSProperties } from 'react'
import letters from '../lib/wiki-letter-paths.json'

type Weight = 'regular' | 'bold'
export type Lettering = Record<Weight, Record<string, [number, string]>>
const glyphs = letters as unknown as Record<Weight, Record<string, [number, string]>>

/** Public-page lettering is SVG geometry, not a browser font or an inaccessible screenshot. */
export function ArtText({ text, bold = false, className = '', style, lettering = glyphs }: { text: string; bold?: boolean; className?: string; style?: CSSProperties; lettering?: Lettering }) {
  const face = lettering[bold ? 'bold' : 'regular']
  return <span className={`art-text ${className}`} role="img" aria-label={text} style={style}>
    {text.normalize('NFC').split(/\s+/).filter(Boolean).map((word, index) => {
      let width = 0
      const paths = [...word].map((letter, n) => {
        const glyph = face[letter] ?? face['?']
        const x = width
        width += glyph[0]
        return <path key={n} d={glyph[1]} transform={`translate(${x} 0)`} />
      })
      return <svg key={index} aria-hidden="true" viewBox={`0 0 ${Math.max(1,width)} 86`} style={{ width: `${width / 64}em` }} fill="currentColor">{paths}</svg>
    })}
  </span>
}

export function PaintedArt({ src, alt = '', className = '', eager = false }: { src: string; alt?: string; className?: string; eager?: boolean }) {
  return <img className={className} src={src} alt={alt} draggable={false} loading={eager ? 'eager' : 'lazy'} decoding="async" onDragStart={event => event.preventDefault()} onContextMenu={event => event.preventDefault()} />
}
