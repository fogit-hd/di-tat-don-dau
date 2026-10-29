import { useEffect, useRef, useState } from 'react'
import { PAGE_SIZE } from '../lib/pagination'
import { PageControls } from './PageControls'
import type { BoardRow } from '../api/types.ts'
import { vnd } from '../lib/format.ts'

export function Leaderboard({
  rows,
  meId,
  loading = false,
}: {
  rows: BoardRow[] | null
  meId?: string
  loading?: boolean
}) {
  const prev = useRef<Record<string, number>>({})
  const body = rows ?? []
  const [page,setPage]=useState(0),current=Math.min(page,Math.max(0,Math.ceil(body.length/PAGE_SIZE)-1))
  const moved: Record<string, boolean> = {}
  if (rows) {
    rows.forEach((row, index) => {
      if (row.teamId in prev.current) moved[row.teamId] = prev.current[row.teamId] !== index
      else if (Object.keys(prev.current).length > 0) moved[row.teamId] = true
    })
  }
  useEffect(() => {
    if (!rows) return
    const next: Record<string, number> = {}
    rows.forEach((row, index) => {
      next[row.teamId] = index
    })
    prev.current = next
  }, [rows])

  return (
    <div>
      <h2>Bảng xếp hạng</h2>
      <table className="lb">
        <thead>
          <tr>
            <th>#</th>
            <th>CEO</th>
            <th>Ngành</th>
            <th>Điểm</th>
          </tr>
        </thead>
        <tbody>
          {loading || rows == null ? (
            <tr className="empty">
              <td className="st" colSpan={4}>
                <span className="lb-load" />
                Đang tải bảng xếp hạng…
              </td>
            </tr>
          ) : body.length === 0 ? (
            <tr className="empty">
              <td className="st" colSpan={4}>
                Chưa có CEO nào.
              </td>
            </tr>
          ) : (
            body.slice(current*PAGE_SIZE,(current+1)*PAGE_SIZE).map((row) => (
              <tr key={row.teamId} className={`${row.teamId === meId ? 'me' : ''} ${moved[row.teamId] ? 'moved' : ''}`}>
                <td>{row.rank}</td>
                <td>{row.teamName}</td>
                <td>{row.themeName}</td>
                <td>
                  <b>{vnd(row.value)}</b>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <PageControls page={current} count={body.length} onChange={setPage} label="Trang bảng xếp hạng"/>
    </div>
  )
}
