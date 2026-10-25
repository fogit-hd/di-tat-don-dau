import type { CentennialNotice } from '../api/types.ts'
import { factoryArt } from '../lib/art.ts'
import { vnd } from '../lib/format.ts'

export function CentennialReveal({
  notice,
  industryId,
  teamName,
  onDone,
}: {
  notice: CentennialNotice
  industryId: string
  teamName: string
  onDone: () => void
}) {
  return (
    <section className="succession centennial">
      <div className="fireworks" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <img src={factoryArt(industryId)} alt="" className="succession-photo" />
      <div className="card succession-card">
        <p className="eyebrow">Bách niên</p>
        <h2>Doanh nghiệp trăm năm</h2>
        <p>
          <b>{teamName}</b> chạm năm {notice.year}. Tài sản tăng thêm {Math.round((notice.bonusMultiplier - 1) * 100)}%.
        </p>
        <p className="asset-count">
          {vnd(notice.assetsBefore)} → <b>{vnd(notice.assetsAfter)}</b>
        </p>
        <button type="button" className="btn big" onClick={onDone}>
          Xem bảng đã chốt
        </button>
      </div>
    </section>
  )
}
