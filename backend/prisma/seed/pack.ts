import type { EventDef, ThemeStart } from '../../src/game/types'

export type IndustrySeed = {
  id: string
  name: string
  unit: string
  art: string
  epl: number
  tech: number
  support: number
  infra: number
  emission: number
  baseOutput: number
  role: string
  mission: string
  patterns: string[]
  worker: string
  product: string
  leap: string
  weak: string
  dirs: [string, string, string, string]
}

export const INDUSTRIES: IndustrySeed[] = [
  {
    id: 'chip-ban-dan',
    name: 'Chip bán dẫn',
    unit: 'lô chip',
    art: 'cleanroom',
    epl: 1400,
    tech: 0.16,
    support: 0.08,
    infra: 0.09,
    emission: 1.05,
    baseOutput: 78,
    role: 'Giám đốc',
    mission:
      'Nước A đặt mục tiêu đào tạo kỹ sư bán dẫn và tham gia chuỗi cung ứng chip toàn cầu, dù công nghiệp cơ khí và phụ trợ còn yếu. Bạn phải chọn: đi tuần tự từng bước hay nhảy vọt nhờ con người và công nghệ mới?',
    patterns: ['Nhà máy Chip Sao Việt', 'Nhà máy Chip {{region}}', 'Xưởng Bán dẫn {{region}}'],
    worker: 'kỹ sư bán dẫn',
    product: 'chip bán dẫn',
    leap: 'làm chủ đóng gói, kiểm thử và một phần thiết kế chip thay vì chỉ nhập wafer',
    weak: 'cơ khí chính xác và công nghiệp phụ trợ còn yếu',
    dirs: [
      'Đào tạo kỹ sư bán dẫn',
      'Máy quang khắc & dây chuyền',
      'Vật liệu, linh kiện phụ trợ',
      'Hạ tầng điện, nước & thể chế',
    ],
  },
  {
    id: 'xe-dien',
    name: 'Xe điện',
    unit: 'xe',
    art: 'assembly',
    epl: 1000,
    tech: 0.12,
    support: 0.15,
    infra: 0.11,
    emission: 1,
    baseOutput: 96,
    role: 'Tổng giám đốc',
    mission:
      'Nước A muốn có thương hiệu xe điện riêng và tham gia chuỗi cung ứng pin, động cơ của khu vực, trong khi cơ khí chính xác và linh kiện còn phải nhập khẩu. Hãy cân bằng giữa nhập dây chuyền và đào tạo kỹ sư cơ điện.',
    patterns: ['Xưởng Xe điện Lạc Hồng', 'Nhà máy Xe điện {{region}}', 'Xưởng Lắp ráp {{region}}'],
    worker: 'kỹ sư cơ điện',
    product: 'xe điện',
    leap: 'làm chủ pin và phần mềm điều khiển, không chỉ lắp ráp CKD',
    weak: 'linh kiện và cơ khí chính xác còn phải nhập',
    dirs: [
      'Đào tạo kỹ sư cơ điện',
      'Robot hàn & dây chuyền lắp ráp',
      'Pin, khung, linh kiện phụ trợ',
      'Trạm sạc, đường sá & chính sách',
    ],
  },
  {
    id: 'ca-phe',
    name: 'Cà phê chế biến sâu',
    unit: 'tấn',
    art: 'process',
    epl: 700,
    tech: 0.08,
    support: 0.18,
    infra: 0.1,
    emission: 0.75,
    baseOutput: 110,
    role: 'Chủ tịch',
    mission:
      'Nước A xuất khẩu nhiều cà phê nhân nhưng giá trị gia tăng thấp. Nhiệm vụ của bạn là chuyển sang chế biến sâu, xây thương hiệu và đưa sản phẩm vào chuỗi giá trị toàn cầu, với đội ngũ kỹ sư chế biến làm nòng cốt.',
    patterns: ['Xưởng Cà phê Cao Nguyên Xanh', 'Nhà máy Cà phê {{region}}', 'Xưởng Rang {{region}}'],
    worker: 'kỹ sư chế biến',
    product: 'cà phê chế biến sâu',
    leap: 'rang xay, đóng gói và giữ thương hiệu trong nước thay vì bán nhân giá rẻ',
    weak: 'chế biến sâu và thương hiệu còn mỏng',
    dirs: [
      'Đào tạo kỹ sư chế biến',
      'Máy rang & đóng gói hiện đại',
      'Vùng nguyên liệu, bao bì',
      'Logistics, tiêu chuẩn & thương hiệu',
    ],
  },
]

export const REGIONS = [
  { id: 'ha-noi', name: 'Hà Nội' },
  { id: 'bac-ninh', name: 'Bắc Ninh' },
  { id: 'tay-nguyen', name: 'Tây Nguyên' },
  { id: 'binh-duong', name: 'Bình Dương' },
]

export const SCALES = [
  { id: 'xuong', name: 'Xưởng nhỏ', roleTemplate: 'Chủ xưởng {{industryLower}} tại {{region}}' },
  { id: 'nha-may', name: 'Nhà máy', roleTemplate: '{{role}} {{scaleLower}} {{industryLower}} nước A tại {{region}}' },
]

export const CONTEXTS: { id: string; name: string; line: string; start: ThemeStart }[] = [
  {
    id: 'khoi-nghiep',
    name: 'Khởi nghiệp',
    line: 'Bạn đang dựng cơ sở từ đầu: vốn là tiền mặt, máy móc gần như chưa có.',
    start: { cashMul: 1, engineers: 180, machines: 0, pollution: 8, dependency: 0, condition: 1 },
  },
  {
    id: 'lien-doanh',
    name: 'Liên doanh FDI',
    line: 'Một đối tác nước ngoài vừa đưa máy vào. Công nghệ và quyết định còn nằm nhiều ở họ.',
    start: { cashMul: 0.92, engineers: 300, machines: 1, pollution: 16, dependency: 2.1, condition: 0.95 },
  },
]

export { QUESTIONS } from '../../src/game/questions.data'

const neutral = { outputMul: [1, 1] as [number, number], priceMul: [1, 1] as [number, number], inflationMul: [1, 1] as [number, number] }

export const EVENTS: EventDef[] = [
  {
    id: 'flood',
    scope: 'team',
    weight: 3,
    visual: 'flood',
    exposure: 'machines',
    title: 'Nước dâng sát chân nhà máy',
    body: 'Mưa lớn làm ngập sân {{factory}}. Một phần dây chuyền phải dừng.',
    variants: {
      'chip-ban-dan': { title: 'Ngập khu phụ trợ', body: 'Nước tràn khu phụ trợ của {{factory}}. Phòng sạch phải giảm công suất.' },
      'ca-phe': { title: 'Ngập sân phơi', body: 'Mưa làm ướt nguyên liệu tại {{factory}}. Lô rang bị chậm.' },
      'xe-dien': { title: 'Ngập xưởng hàn', body: 'Nước vào khu robot hàn của {{factory}}. Dây chuyền phải dừng một phần.' },
    },
    durationSec: [50, 90],
    outputMul: [0.55, 0.8],
    priceMul: [0.92, 1],
    inflationMul: [1, 1],
    machinesPct: [-0.18, -0.08],
    pollution: [1, 4],
  },
  {
    id: 'outage',
    scope: 'team',
    weight: 3,
    visual: 'power_outage',
    exposure: 'machines',
    title: 'Mất điện',
    body: 'Lưới quá tải. Cửa sổ nhà máy tắt dần, ống khói ngừng.',
    durationSec: [40, 70],
    outputMul: [0.2, 0.45],
    priceMul: [1, 1],
    inflationMul: [1, 1],
  },
  {
    id: 'brain',
    scope: 'team',
    weight: 3,
    visual: 'brain_drain',
    exposure: 'engineers',
    title: 'Chảy máu chất xám',
    body: 'Một nhóm {{worker}} nhận việc ở nước ngoài và kéo va-li ra cổng.',
    durationSec: [55, 90],
    outputMul: [0.85, 0.95],
    priceMul: [1, 1],
    inflationMul: [1, 1],
    engineersPct: [-0.18, -0.1],
  },
  {
    id: 'crisis',
    scope: 'room',
    weight: 2,
    visual: 'crisis',
    exposure: 'machines',
    title: 'Khủng hoảng đơn hàng',
    body: 'Cầu thế giới hạ nhiệt. Giá xuất khẩu giảm với mọi đội trong phòng.',
    durationSec: [70, 110],
    outputMul: [0.9, 1],
    priceMul: [0.62, 0.78],
    inflationMul: [1, 1],
  },
  {
    id: 'policy',
    scope: 'room',
    weight: 2,
    visual: 'policy',
    exposure: 'any',
    title: 'Chính sách hỗ trợ',
    body: 'Nhà nước mở gói tín dụng cho công nghiệp. Mỗi đội nhận thêm một khoản vốn.',
    durationSec: [40, 70],
    outputMul: [1, 1.05],
    priceMul: [1, 1],
    inflationMul: [1, 1],
    cash: [250, 700],
  },
  {
    id: 'breakthrough',
    scope: 'team',
    weight: 2,
    visual: 'breakthrough',
    exposure: 'engineers',
    title: 'Đột phá công nghệ',
    body: 'Tổ nghiên cứu của {{factory}} chạy được một công đoạn mới.',
    durationSec: [60, 100],
    outputMul: [1.08, 1.18],
    priceMul: [1.02, 1.08],
    inflationMul: [1, 1],
    tech: [0.25, 0.55],
  },
  {
    id: 'supply',
    scope: 'team',
    weight: 3,
    visual: 'supply_shock',
    exposure: 'machines',
    title: 'Đứt nguồn linh kiện',
    body: 'Nhà cung cấp chậm hàng. Xe tải vào cổng {{factory}} chạy không.',
    variants: {
      'chip-ban-dan': { title: 'Thiếu hóa chất phòng sạch', body: 'Lô hóa chất phụ trợ về muộn. Dây chuyền chip phải chờ.' },
      'ca-phe': { title: 'Thiếu bao bì', body: 'Xưởng rang có cà phê nhưng chưa có bao bì đạt chuẩn.' },
      'xe-dien': { title: 'Thiếu pin', body: 'Lô pin nhập về chậm. Khung xe nằm chờ trong xưởng.' },
    },
    durationSec: [50, 85],
    outputMul: [0.6, 0.82],
    priceMul: [0.95, 1],
    inflationMul: [1, 1],
    support: [-0.25, -0.05],
  },
  {
    id: 'smog',
    scope: 'team',
    weight: 2,
    visual: 'smog',
    exposure: 'pollution',
    title: 'Khói mù trên khu công nghiệp',
    body: 'Chạy quá công suất mà ít đầu tư xử lý. Trời xám, đối tác hỏi về tiêu chuẩn môi trường.',
    durationSec: [60, 100],
    outputMul: [0.9, 1],
    priceMul: [0.8, 0.92],
    inflationMul: [1, 1],
    pollution: [6, 14],
  },
  {
    id: 'fdi',
    scope: 'team',
    weight: 2,
    visual: 'fdi',
    exposure: 'any',
    title: 'Đối tác đề nghị đưa dây chuyền',
    body: 'Họ cho máy và đơn hàng ngay. Bản vẽ vẫn để ở nước ngoài. {{factory}} chọn thế nào?',
    durationSec: [40, 40],
    ...neutral,
    choice: {
      timeoutIndex: 1,
      options: [
        {
          id: 'take',
          text: 'Nhận dây chuyền và đơn hàng ngay',
          patch: {
            visual: 'fdi',
            title: 'Nhận dây chuyền FDI',
            body: 'Cần cẩu dựng một xưởng mới. Công nghệ vẫn nằm ở đối tác.',
            exposure: 'any',
            durationSec: [70, 100],
            outputMul: [1.05, 1.15],
            priceMul: [1, 1.04],
            inflationMul: [1, 1],
            machinesAdd: [0.8, 1.6],
            dependency: [1.2, 2],
            pollution: [2, 6],
          },
        },
        {
          id: 'train',
          text: 'Đòi chương trình đào tạo kỹ sư, chưa nhận máy',
          patch: {
            visual: 'breakthrough',
            title: 'Giữ người, học việc',
            body: 'Đối tác nhận đào tạo {{worker}} ngay tại {{factory}}.',
            exposure: 'any',
            durationSec: [50, 80],
            outputMul: [1, 1.06],
            priceMul: [1, 1],
            inflationMul: [1, 1],
            engineersAdd: [280, 520],
            dependency: [-0.8, -0.3],
          },
        },
      ],
    },
  },
]
