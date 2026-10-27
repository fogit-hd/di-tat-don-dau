import type { CSSProperties } from 'react'
import { ArtText, type Lettering } from './ArtText'
import letters from '../lib/public-letter-paths.json'
import '../public-font.css'

const lettering = letters as unknown as Lettering

/** Public-page outlines use the same local font as editable fields; gameplay keeps its own lettering. */
export function PublicArtText(props: { text: string; bold?: boolean; className?: string; style?: CSSProperties }) {
  return <ArtText {...props} lettering={lettering} />
}
