import { PollutionDetails } from './BudgetPanel.tsx'
import type { SceneView } from '../api/types.ts'
import { CanvasHeading, PaintedIcon, type PaintedIconName } from './PaintedIcon.tsx'

export function StatCards({ scene }: { scene: SceneView }) {
  const number = (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 1 })
  const items: [PaintedIconName, string, string, string?][] = [
    ['eng', 'Kỹ sư', number(scene.engineers)],
    ['line', 'Dây chuyền', number(scene.machines), `${number(scene.idle)} nhàn`],
    ['prod', 'Sản phẩm', Math.round(scene.output).toLocaleString('vi-VN'), scene.unit !== 'sản phẩm' ? scene.unit : undefined],
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
            <div><span>{label}</span><b>{value}</b>{secondary && <small>{secondary}</small>}</div>
          </div>
        ))}
      </div>
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
