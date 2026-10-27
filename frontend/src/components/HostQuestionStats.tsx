import { useId, useState } from 'react'
import type { Snapshot } from '../api/types'
import { ArtText as T, PaintedArt as Art } from './ArtText'
import { sessionArt } from '../lib/session-art'
import './session-ui.css'

/** Question percentages count answer attempts, not the number of CEOs in the room. */
export function HostQuestionStats({ rows }: { rows: Snapshot['room']['questionStats'] }) {
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const id = useId()
  const current = Math.min(page, Math.max(0, Math.ceil(rows.length / 4) - 1))
  const start = current * 4
  return <section className="session-questions" aria-label="Kết quả trả lời">
    <header><div><h2><T text="Kết quả trả lời" bold /></h2><p><T text="Theo lượt trả lời" /></p></div><Art src={sessionArt('questions-art')} /></header>
    {!rows.length ? <p className="session-empty"><T text="Chưa có câu hỏi nào được trả lời." /></p> : <>
      <ol start={start + 1}>{rows.slice(start, start + 4).map((row, index) => {
        const percent = row.total > 0 ? Math.round(100 * row.correct / row.total) : 0
        const open = expanded === row.questionId
        const panelId = `${id}-${start + index}`
        return <li key={row.questionId} className={open ? 'expanded' : ''}>
          <button type="button" className="session-question-toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setExpanded(open ? null : row.questionId)}>
            <span className="session-question-number"><T text={String(start + index + 1)} bold /></span>
            <span className="session-question-title"><T text={row.prompt} bold /></span>
            <span className="session-question-meter" aria-hidden="true"><i style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} className={percent >= 60 ? 'positive' : ''} /></span>
            <span className="session-question-score"><T text={`${percent}% · ${row.correct}/${row.total} lượt`} /></span>
            <span className="session-question-chevron" aria-hidden="true">{open ? '⌃' : '›'}</span>
          </button>
          <div id={panelId} hidden={!open} className="session-question-detail"><p><T text={row.prompt} /></p><p><T text={`${row.correct}/${row.total} lượt trả lời đúng`} /></p></div>
        </li>
      })}</ol>
      <nav className="session-pagination" aria-label="Trang kết quả câu hỏi">
        <button type="button" className="session-button secondary" aria-label="Trang trước" disabled={current === 0} onClick={() => { setPage(current - 1); setExpanded(null) }}>‹</button>
        <span role="status"><T text={`${start + 1} – ${Math.min(start + 4, rows.length)} / ${rows.length} câu`} /></span>
        <button type="button" className="session-button secondary" aria-label="Trang sau" disabled={start + 4 >= rows.length} onClick={() => { setPage(current + 1); setExpanded(null) }}>›</button>
      </nav>
    </>}
  </section>
}
