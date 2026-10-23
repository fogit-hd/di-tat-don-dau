import type { SceneView } from '../api/types.ts'
import { Icon } from './Icons.tsx'

export function StatCards({ scene }: { scene: SceneView }) {
  const items: [string, string, string][] = [
    ['eng', 'Kỹ sư', scene.engineers.toLocaleString('vi-VN')],
    ['line', 'Dây chuyền', `${scene.machines.toFixed(1)} (${scene.idle.toFixed(1)} nhàn)`],
    ['prod', 'Sản phẩm', `${Math.round(scene.output).toLocaleString('vi-VN')} ${scene.unit}`],
    ['tech', 'Trình độ công nghệ', scene.tech.toFixed(1)],
    ['sup', 'Công nghiệp phụ trợ', `Cấp ${scene.support.toFixed(1)}`],
    ['inst', 'Hạ tầng – thể chế', `Cấp ${scene.infra.toFixed(1)}`],
  ]
  return (
    <>
      <div className="stats" id="stats">
        {items.map(([icon, label, value]) => (
          <div className="stat" key={label}>
            <Icon name={icon} />
            {label}
            <b>{value}</b>
          </div>
        ))}
      </div>
      <div className="meter" title="Ô nhiễm">
        <span style={{ width: `${Math.max(4, Math.min(100, scene.pollution))}%` }} />
      </div>
      <p className="meter-label">
        Ô nhiễm {Math.round(scene.pollution)} · {scene.lines.find((line) => line.id === 'grn')?.label ?? 'xử lý'} cấp {scene.green.toFixed(1)}
      </p>
    </>
  )
}
