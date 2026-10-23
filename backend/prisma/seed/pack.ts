import type { EventDef, QuestionDef, ThemeStart } from '../../src/game/types'

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

export const QUESTIONS: QuestionDef[] = [
  q('q01', 'cmcn1', '6.1.1', 1, 'mc', 'Cách mạng công nghiệp lần thứ nhất (khởi đầu ở Anh, cuối thế kỷ XVIII) có đặc trưng cơ bản là gì?', [
    ['a', 'Sử dụng năng lượng nước, hơi nước để cơ khí hóa sản xuất'],
    ['b', 'Sử dụng năng lượng điện và dây chuyền sản xuất hàng loạt'],
    ['c', 'Sử dụng điện tử và công nghệ thông tin để tự động hóa'],
    ['d', 'Liên kết thế giới thực và ảo qua hệ thống số'],
  ], 'a', 'CMCN 1.0 chuyển lao động thủ công sang lao động sử dụng máy móc, với động cơ hơi nước là biểu tượng.'),
  q('q02', 'cmcn2', '6.1.1', 1, 'mc', 'Cách mạng công nghiệp lần thứ hai (nửa cuối thế kỷ XIX – đầu thế kỷ XX) gắn với:', [
    ['a', 'Máy hơi nước'],
    ['b', 'Điện năng và dây chuyền sản xuất hàng loạt'],
    ['c', 'Internet vạn vật'],
    ['d', 'Trí tuệ nhân tạo'],
  ], 'b', 'CMCN 2.0 sử dụng năng lượng điện, tạo ra dây chuyền sản xuất hàng loạt.'),
  q('q03', 'cmcn3', '6.1.1', 1, 'mc', 'Cách mạng công nghiệp lần thứ ba (từ khoảng những năm 60 thế kỷ XX) có đặc trưng là:', [
    ['a', 'Sử dụng công nghệ thông tin, máy tính để tự động hóa sản xuất'],
    ['b', 'Phát minh máy dệt'],
    ['c', 'Sử dụng sức kéo động vật'],
    ['d', 'Chỉ phát triển nông nghiệp'],
  ], 'a', 'CMCN 3.0 gắn với điện tử, máy tính, Internet và tự động hóa sản xuất.'),
  q('q04', 'cmcn4', '6.1.1', 1, 'mc', 'Đặc trưng nổi bật của Cách mạng công nghiệp lần thứ tư là:', [
    ['a', 'Cơ khí hóa bằng máy hơi nước'],
    ['b', 'Liên kết giữa thế giới thực và ảo, dựa trên trí tuệ nhân tạo, Internet vạn vật, dữ liệu lớn'],
    ['c', 'Điện khí hóa'],
    ['d', 'Thủ công nghiệp'],
  ], 'b', 'CMCN 4.0 (Hội chợ Hannover, Đức, 2011) dựa trên hệ thống thực – ảo, AI, IoT và dữ liệu lớn.'),
  q('q05', 'vai-tro', '6.1.1', 2, 'mc', 'Theo giáo trình, cách mạng công nghiệp có vai trò gì đối với phát triển?', [
    ['a', 'Chỉ thay đổi văn hóa'],
    ['b', 'Thúc đẩy phát triển lực lượng sản xuất, hoàn thiện quan hệ sản xuất, đổi mới phương thức quản trị'],
    ['c', 'Làm giảm năng suất lao động'],
    ['d', 'Không ảnh hưởng đến kinh tế'],
  ], 'b', 'CMCN thúc đẩy lực lượng sản xuất, hoàn thiện quan hệ sản xuất và đổi mới phương thức quản trị.'),
  q('q06', 'mo-hinh-anh', '6.1.2', 2, 'mc', 'Mô hình công nghiệp hóa cổ điển (Anh và các nước Tây Âu) thường bắt đầu từ:', [
    ['a', 'Công nghiệp nặng'],
    ['b', 'Công nghiệp nhẹ (nhất là dệt), sau đó mới đến công nghiệp nặng'],
    ['c', 'Công nghệ thông tin'],
    ['d', 'Dịch vụ tài chính'],
  ], 'b', 'CNH cổ điển đi tuần tự từ công nghiệp nhẹ đến công nghiệp nặng, khoảng 60–80 năm.'),
  q('q07', 'mo-hinh-lx', '6.1.2', 2, 'mc', 'Mô hình công nghiệp hóa kiểu Liên Xô (cũ) có đặc điểm:', [
    ['a', 'Ưu tiên phát triển công nghiệp nặng, huy động nguồn lực tập trung'],
    ['b', 'Bắt đầu từ công nghiệp nhẹ'],
    ['c', 'Dựa chủ yếu vào đầu tư nước ngoài'],
    ['d', 'Dựa vào xâm chiếm thuộc địa'],
  ], 'a', 'Liên Xô ưu tiên công nghiệp nặng trong thời gian ngắn nhờ kế hoạch hóa tập trung.'),
  q('q08', 'mo-hinh-nb', '6.1.2', 2, 'mc', 'Nhật Bản và các nước công nghiệp mới (NICs) rút ngắn thời gian công nghiệp hóa chủ yếu nhờ:', [
    ['a', 'Đóng cửa nền kinh tế'],
    ['b', 'Đi tuần tự từng bước như nước Anh'],
    ['c', 'Tiếp nhận, chuyển giao công nghệ từ các nước đi trước, kết hợp phát triển nguồn nhân lực'],
    ['d', 'Chỉ phát triển nông nghiệp'],
  ], 'c', 'Mô hình Nhật Bản và NICs dựa vào chuyển giao công nghệ và giáo dục, khoảng 20–30 năm.'),
  q('q09', 'khai-niem', '6.1.1', 2, 'mc', 'Công nghiệp hóa, hiện đại hóa ở Việt Nam là quá trình chuyển từ sử dụng sức lao động thủ công là chính sang:', [
    ['a', 'Sử dụng một cách phổ biến sức lao động cùng với công nghệ, phương tiện và phương pháp tiên tiến, hiện đại'],
    ['b', 'Chỉ nhập khẩu máy móc'],
    ['c', 'Chỉ phát triển dịch vụ'],
    ['d', 'Giảm vai trò của khoa học – công nghệ'],
  ], 'a', 'Mục đích là tạo năng suất lao động xã hội cao, dựa trên công nghiệp và tiến bộ khoa học – công nghệ.'),
  q('q10', 'dac-diem', '6.1.1', 2, 'mc', 'Đặc điểm nào KHÔNG phải là đặc điểm của CNH-HĐH ở Việt Nam hiện nay?', [
    ['a', 'Gắn với phát triển kinh tế tri thức'],
    ['b', 'Trong điều kiện kinh tế thị trường định hướng xã hội chủ nghĩa'],
    ['c', 'Trong bối cảnh hội nhập kinh tế quốc tế'],
    ['d', 'Tách biệt hoàn toàn khỏi kinh tế thế giới'],
  ], 'd', 'CNH-HĐH ở Việt Nam gắn với kinh tế tri thức, kinh tế thị trường định hướng XHCN và hội nhập.'),
  q('q11', 'tat-yeu', '6.1.1', 2, 'mc', 'Tính tất yếu khách quan của CNH-HĐH ở Việt Nam thể hiện ở chỗ:', [
    ['a', 'CNH là quy luật phổ biến của sự phát triển lực lượng sản xuất; tạo cơ sở vật chất – kỹ thuật cho CNXH'],
    ['b', 'CNH chỉ là lựa chọn tạm thời'],
    ['c', 'CNH chỉ cần cho nông nghiệp'],
    ['d', 'CNH không liên quan đến năng suất'],
  ], 'a', 'Với nước đi lên CNXH từ nền sản xuất nhỏ, CNH-HĐH là con đường tạo cơ sở vật chất – kỹ thuật.'),
  q('q12', 'noi-dung', '6.1.2', 2, 'mc', 'Nội dung nào thuộc nội dung cơ bản của CNH-HĐH ở Việt Nam?', [
    ['a', 'Tạo lập điều kiện để chuyển đổi nền sản xuất sang nền sản xuất hiện đại'],
    ['b', 'Chuyển dịch cơ cấu kinh tế theo hướng hiện đại, hợp lý, hiệu quả'],
    ['c', 'Ứng dụng thành tựu khoa học – công nghệ; từng bước hoàn thiện quan hệ sản xuất'],
    ['d', 'Tất cả các phương án trên'],
  ], 'd', 'Giáo trình nêu đủ các nội dung: điều kiện, chuyển dịch cơ cấu, ứng dụng khoa học – công nghệ và quan hệ sản xuất.'),
  q('q13', 'di-tat', '6.1.2', 2, 'mc', 'Trong bối cảnh CMCN 4.0, nước đi sau có thể "đi tắt, đón đầu" nghĩa là:', [
    ['a', 'Bỏ qua mọi bước, không cần nhân lực'],
    ['b', 'Tận dụng công nghệ mới để rút ngắn khoảng cách, đi thẳng vào một số lĩnh vực hiện đại'],
    ['c', 'Chỉ nhập khẩu hàng tiêu dùng'],
    ['d', 'Ngừng phát triển nông nghiệp'],
  ], 'b', 'Có thể kết hợp tuần tự với nhảy vọt ở khâu có lợi thế, không có nghĩa là bỏ qua con người.'),
  q('q14', 'nhan-luc', '6.1.2', 1, 'mc', 'Để thích ứng với CMCN 4.0, Việt Nam cần tập trung vào yếu tố nào được coi là then chốt?', [
    ['a', 'Phát triển nguồn nhân lực, nhất là nguồn nhân lực chất lượng cao'],
    ['b', 'Tăng khai thác tài nguyên thô'],
    ['c', 'Giảm đầu tư cho giáo dục'],
    ['d', 'Hạn chế ứng dụng công nghệ'],
  ], 'a', 'Nguồn nhân lực chất lượng cao là yếu tố quyết định để tiếp thu và làm chủ công nghệ.'),
  q('q15', 'giai-phap', '6.1.2', 2, 'mc', 'Giải pháp nào giúp Việt Nam thích ứng với CMCN 4.0 theo giáo trình?', [
    ['a', 'Hoàn thiện thể chế, xây dựng nền kinh tế dựa trên đổi mới sáng tạo'],
    ['b', 'Nắm bắt và đẩy mạnh ứng dụng thành tựu CMCN 4.0'],
    ['c', 'Chuẩn bị điều kiện cần thiết, phát triển hạ tầng và nhân lực'],
    ['d', 'Tất cả các phương án trên'],
  ], 'd', 'Các nhóm giải pháp gồm thể chế, ứng dụng CMCN 4.0, nhân lực và hạ tầng.'),
  q('q16', 'cmcn4', '6.1.1', 1, 'tf', 'Khái niệm Cách mạng công nghiệp 4.0 được nêu tại Hội chợ Hannover (Đức) năm 2011.', [
    ['dung', 'Đúng'],
    ['sai', 'Sai'],
  ], 'dung', 'Đúng. Mốc 2011 tại Hannover thường được dùng để đánh dấu khái niệm CMCN 4.0.'),
  q('q17', 'dac-diem', '6.1.1', 1, 'tf', 'CNH-HĐH ở Việt Nam cần tách biệt hoàn toàn khỏi kinh tế thế giới để giữ độc lập.', [
    ['dung', 'Đúng'],
    ['sai', 'Sai'],
  ], 'sai', 'Sai. Hội nhập quốc tế là một đặc điểm của CNH-HĐH ở Việt Nam, không phải tách biệt.'),
  q('q18', 'nhan-luc', '6.1.2', 1, 'tf', 'Nhập máy móc hiện đại mà thiếu người làm chủ thì chưa phải là công nghiệp hóa, hiện đại hóa.', [
    ['dung', 'Đúng'],
    ['sai', 'Sai'],
  ], 'dung', 'Đúng. Máy móc phải đi cùng nhân lực, chuyển giao công nghệ và công nghiệp phụ trợ.'),
  q('q19', 'di-tat', '6.1.2', 2, 'match', 'Với ngành {{industry}} tại {{region}}, phương án nào minh họa đúng "đi tắt, đón đầu"?', [
    ['a', '{{leap}}'],
    ['b', 'Chỉ mua thật nhiều máy và để đối tác nước ngoài vận hành hộ'],
    ['c', 'Bán nguyên liệu thô rồi dừng đầu tư cho {{worker}}'],
    ['d', 'Đóng cửa, không tham gia chuỗi cung ứng'],
  ], 'a', 'Đi tắt đón đầu là vào khâu có giá trị cao nhờ công nghệ và con người — ví dụ: {{leap}}.'),
  q('q20', 'khai-niem', '6.1.1', 2, 'fill', 'Điền khái niệm: quá trình chuyển đổi căn bản, toàn diện từ lao động thủ công sang công nghệ hiện đại ở Việt Nam được gọi là ____.', [
    ['a', 'Công nghiệp hóa, hiện đại hóa'],
    ['b', 'Toàn cầu hóa tài chính'],
    ['c', 'Kinh tế tự cung tự cấp'],
    ['d', 'Cải cách ruộng đất'],
  ], 'a', 'Đó chính là công nghiệp hóa, hiện đại hóa.'),
]

function q(
  id: string,
  topic: string,
  section: string,
  difficulty: number,
  type: QuestionDef['type'],
  prompt: string,
  options: [string, string][],
  correctOptionId: string,
  explanation: string,
): QuestionDef {
  return {
    id,
    topic,
    section,
    difficulty,
    type,
    typeTitle: '',
    prompt,
    options: options.map(([oid, text]) => ({ id: oid, text })),
    correctOptionId,
    explanation,
  }
}

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
