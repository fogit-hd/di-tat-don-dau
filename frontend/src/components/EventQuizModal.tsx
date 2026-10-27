import type { PendingView } from '../api/types.ts'

export function EventQuizModal({
  pending,
  busy,
  onAnswer,
  onDismiss,
  readOnly = false,
  now,
}: {
  pending: PendingView | null
  busy: boolean
  onAnswer: (optionId: string) => void
  onDismiss: () => void
  readOnly?: boolean
  now?: number
}) {
  if (!pending) return null
  const letters = 'ABCD'
  return (
    <div className="modal on">
      <div className="card" id="mbody">
        <h2>{pending.kind === 'question' ? 'Câu hỏi đề tài thuyết trình' : pending.title}</h2>
        <p>
          <b>{pending.body}</b>
        </p>
        {readOnly && <p className="meta">CEO đang trả lời trên điện thoại.</p>}
        {!readOnly && pending.kind==='question' && pending.phase==='open' && now!=null && <p className="meta">Còn {Math.max(0,Math.ceil((pending.expiresAt-now)/1000))} giây trả lời · Đồng hồ Sang năm đang tạm dừng.</p>}
        {pending.phase === 'open' &&
          pending.options.map((option, index) =>
            readOnly ? (
              <p className="opt" key={option.id}>
                {pending.kind === 'choice' ? option.text : `${letters[index] ?? index + 1}. ${option.text}`}
              </p>
            ) : (
              <button type="button" className="opt" key={option.id} disabled={busy} onClick={() => onAnswer(option.id)}>
                {pending.kind === 'choice' ? option.text : `${letters[index] ?? index + 1}. ${option.text}`}
              </button>
            ),
          )}
        {pending.phase === 'resolved' && (
          <div className="exp" style={{ display: 'block' }}>
            {pending.note || (pending.kind === 'question' ? '' : 'Đã chọn.')}
            {pending.explanation ? <><br />{pending.explanation}</> : null}
          </div>
        )}
        {readOnly && (
          <button type="button" className="btn s" onClick={onDismiss}>
            Ẩn trên máy chiếu
          </button>
        )}
        {!readOnly && (pending.kind === 'event' || pending.phase === 'resolved') && (
          <button type="button" className="btn big" disabled={busy} onClick={onDismiss}>
            {pending.kind === 'event' ? 'Đã rõ' : 'Tiếp tục'}
          </button>
        )}
      </div>
    </div>
  )
}
