import { PollutionDetails } from './BudgetPanel.tsx'
import type { SceneView } from '../api/types.ts'
import { CanvasHeading, PaintedIcon, type PaintedIconName } from './PaintedIcon.tsx'

export function StatCards({ scene }: { scene: SceneView }) {
  const number = (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 1 })
  const items: [PaintedIconName, string, string, string?][] = [
    ['eng', 'Công nhân', Math.round(scene.engineers).toLocaleString('vi-VN')],
    ['line', 'Cụm sản xuất', Math.floor(scene.machines).toLocaleString('vi-VN'), `${scene.operating} đang vận hành · ${Math.floor(scene.idle)} chờ đủ nhân lực`],
    ['prod', 'Sản phẩm cộng dồn', Math.round(scene.output).toLocaleString('vi-VN'), scene.unit !== 'sản phẩm' ? scene.unit : undefined],
    ['tech', 'Công nghệ', number(scene.tech)],
    ['sup', 'Phụ trợ', `Cấp ${number(scene.support)}`],
    ['inst', 'Hạ tầng', `Cấp ${number(scene.infra)}`],
  ]
  return (
    <>
      <CanvasHeading>Doanh nghiệp</CanvasHeading>
      <div className="enterprise-stats" id="stats">
        {items.map(([icon, label, value, secondary]) => (
          <div className="enterprise-stat" key={label}>
            <PaintedIcon name={icon} />
            <div><span>{label}</span><b><span className="stat-value-pulse" key={value}>{value}</span></b>{secondary && <small>{secondary}</small>}</div>
          </div>
        ))}
      </div>
      {scene.economyVersion===3 && <div className="enterprise-quality"><span>Tay nghề: {scene.workerSkill??0}/5</span><span>Thiết bị: {scene.machineQuality??0}/5</span><span>Tình trạng: {Math.round((scene.condition??1)*100)}%</span><small>{scene.crewRequired} công nhân/cụm · {scene.idle} cụm chờ đủ nhân lực</small></div>}
      <div className="enterprise-environment">
        <PaintedIcon name="environment" />
        <div><p><b>Ô nhiễm {Math.round(scene.pollution)}</b><span>Công nghệ sạch · Cấp {number(scene.green)}</span></p>
          <div className="environment-meter" role="meter" aria-label="Ô nhiễm" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, Math.round(scene.pollution)))}>
            <span style={{ width: `${Math.max(0, Math.min(100, scene.pollution))}%` }} />
          </div>
        </div>
      </div>
      <PollutionDetails scene={scene} />
    </>
  )
}
