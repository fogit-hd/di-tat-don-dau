import type { EndingRule, Line } from '../../src/game/types'

export const LINES: { id: Line; label: string; hint: string; log: string; sort: number }[] = [
  { id: 'eng', label: 'Đào tạo', hint: 'Nhân lực – yếu tố cốt lõi', log: 'Tuyển và đào tạo +{{hired}} kỹ sư.', sort: 1 },
  { id: 'mac', label: 'Dây chuyền', hint: 'Máy móc – công nghệ', log: 'Lắp thêm {{added}} dây chuyền.', sort: 2 },
  { id: 'sup', label: 'Phụ trợ', hint: 'Công nghiệp phụ trợ', log: 'Mở rộng công nghiệp phụ trợ.', sort: 3 },
  { id: 'inf', label: 'Hạ tầng', hint: 'Hạ tầng – thể chế', log: 'Đầu tư hạ tầng và thể chế.', sort: 4 },
  { id: 'grn', label: 'Công nghệ sạch', hint: 'Giảm ô nhiễm, giữ giá bán', log: 'Đầu tư công nghệ sạch.', sort: 5 },
]

export const QUESTION_TYPES = [
  { id: 'mc', title: 'Câu hỏi ôn tập', sort: 1 },
  { id: 'tf', title: 'Đúng hay sai?', sort: 2 },
  { id: 'match', title: 'Chọn ví dụ đúng', sort: 3 },
  { id: 'fill', title: 'Điền khái niệm', sort: 4 },
]

export const TEMPLATES = {
  themeName: '{{scale}} {{industry}} · {{region}}',
  mission: '{{mission}} {{contextLine}}',
}

export const ENDINGS: EndingRule[] = [
  {
    id: 'leap',
    title: 'Nhảy vọt',
    text: 'Đội đã có đủ kỹ sư để chạy máy và bắt đầu làm chủ công nghệ. Bài học: nguồn nhân lực chất lượng cao là yếu tố cốt lõi; nước đi sau có thể đi tắt, đón đầu nếu con người đi cùng máy móc.',
    sort: 1,
    isDefault: false,
    requiresProduction: true,
    productionMul: 0.4,
    minRatio: 0.8,
    maxRatio: null,
    minTech: 0.7,
    maxDependency: 4.5,
    minMachines: null,
  },
  {
    id: 'depend',
    title: 'Phụ thuộc công nghệ',
    text: 'Nhà máy có máy nhưng thiếu người làm chủ. Máy nằm im hoặc công nghệ vẫn ở đối tác bên ngoài. Nhập máy không đồng nghĩa với công nghiệp hóa.',
    sort: 2,
    isDefault: false,
    requiresProduction: false,
    productionMul: 0.4,
    minRatio: null,
    maxRatio: 0.72,
    minTech: null,
    maxDependency: null,
    minMachines: 0.8,
  },
  {
    id: 'lag',
    title: 'Tụt hậu',
    text: 'Vốn giữ trong két thì an toàn hơn một vụ vỡ trận, nhưng lạm phát bào mòn và khoảng cách với các đội chịu đầu tư ngày càng xa. Công nghiệp hóa không chờ.',
    sort: 3,
    isDefault: true,
    requiresProduction: false,
    productionMul: 0.4,
    minRatio: null,
    maxRatio: null,
    minTech: null,
    maxDependency: null,
    minMachines: null,
  },
]
