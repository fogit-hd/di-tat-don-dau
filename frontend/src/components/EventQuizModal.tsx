import type { PendingView } from '../api/types.ts'

export function EventQuizModal({
  pending,
  busy,
  onAnswer,
  onDismiss,
}: {
  pending: PendingView | null
  busy: boolean
  onAnswer: (optionId: string) => void
  onDismiss: () => void
}) {
  if (!pending) return null
  const letters = 'ABCD'
  return (
    <div className="modal on">
      <div className="card" id="mbody">
        <h2>{pending.title}</h2>
        <p>
          <b>{pending.body}</b>
        </p>
        {pending.phase === 'open' &&
          pending.options.map((option, index) => (
            <button type="button" className="opt" key={option.id} disabled={busy} onClick={() => onAnswer(option.id)}>
              {pending.kind === 'choice' ? option.text : `${letters[index] ?? index + 1}. ${option.text}`}
            </button>
          ))}
        {pending.phase === 'resolved' && (
          <div className="exp" style={{ display: 'block' }}>
            {pending.note || (pending.kind === 'question' ? '' : 'Đã chọn.')}
            {pending.explanation ? <><br />{pending.explanation}</> : null}
          </div>
        )}
        {(pending.kind === 'event' || pending.phase === 'resolved') && (
          <button type="button" className="btn big" disabled={busy} onClick={onDismiss}>
            {pending.kind === 'event' ? 'Đã rõ' : 'Tiếp tục'}
          </button>
        )}
      </div>
    </div>
  )
}
