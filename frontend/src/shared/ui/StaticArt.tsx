import { Fragment } from 'react'
import words from './lettering.manifest.json'
import './static-art.css'

type Word = { width: number; regular: string; bold: string }
const lettering = words as Record<string, Word>
const sprite = '/assets/shared/lettering/words.svg'

/** Fixed copy is exported path geometry: no SVG <text>, font download or canvas text. */
export function StaticArt({ text, bold = false }: { text: string; bold?: boolean }) {
  const tokens = text.normalize('NFC').trim().split(/\s+/)
  return <span className="dq-static-art" role="img" aria-label={text}>
    {tokens.map((word, index) => {
      const shape = lettering[word]
      return <Fragment key={`${index}-${word}`}>
        {index > 0 && ' '}
        {shape ? <svg aria-hidden="true" focusable="false" viewBox={`0 0 ${shape.width} 86`} style={{ width: `${shape.width / 64}em` }}>
          <use href={`${sprite}#${bold ? shape.bold : shape.regular}`} />
        </svg> : <span data-art-missing={word}>{word}</span>}
      </Fragment>
    })}
  </span>
}
