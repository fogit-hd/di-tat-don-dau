import type { SceneView } from '../api/types'

export type GuideStep = { action: string; target: string; text: string; tab?: string; focus?: string }
export function guideActive(scene: SceneView) { return scene.tutorial?.version === 1 && !scene.tutorial.complete && !scene.finished && !scene.bankrupt }
export function guideStep(scene: SceneView): GuideStep {
  const crew = scene.crewRequired ?? 1
  const steps: GuideStep[] = [
    { action:'company', target:'[data-guide="company"]', text:`Chào bạn! Đây là tên doanh nghiệp của đội, khác với tên đội dùng trên bảng xếp hạng. Tên dài được thu gọn để không vỡ giao diện. Bấm vào tên doanh nghiệp để xem đầy đủ.` },
    { action:'cash', target:'[data-guide="cash"]', text:'Tiền mặt là số tiền bạn có thể dùng để đầu tư và trả chi phí. Mua nâng cấp sẽ trừ vào đây; doanh thu, chi phí và sự kiện làm số dư thay đổi khi chốt năm. Bấm vào ô Tiền mặt.' },
    { action:'assets', target:'[data-guide="assets"]', text:'Tài sản là giá trị doanh nghiệp, gồm tiền mặt và các khoản đã đầu tư, sau các điều chỉnh định giá. Đây không phải tiền có thể chi thêm. Bấm vào ô Tài sản để phân biệt với tiền mặt.' },
    { action:'year-count', target:'[data-guide="year-count"]', text:'Năm trên thanh này là số năm đã chốt. Ban đầu là 0 vì bạn chưa chốt lần nào. Lần Sang năm đầu tiên sẽ ghi kết quả Năm 1; sau đó doanh nghiệp bước vào kỳ tiếp theo. Bấm vào ô Năm.' },
    { action:'clock', target:'[data-guide="clock"]', text:'Đồng hồ này là thời gian còn lại của CẢ TRẬN và vẫn chạy trong lúc hướng dẫn. Đồng hồ tự Sang năm đang được giữ lại để bạn làm quen. Bấm vào đồng hồ trận; sau đó cùng mình tiếp tục ngay nhé!' },
    { action:'income', target:'[data-guide="income"]', text:'Thu vận hành hoặc Lãi SX cho biết kết quả sản xuất năm vừa chốt, không phải toàn bộ tiền tăng giảm trong năm. Lạm phát, lãi nợ và sự kiện được ghi riêng trong sổ từng năm. Bấm vào chỉ số thu nhập này.' },
    { action:'rank', target:'[data-guide="rank"]', text:'Thứ hạng cho biết vị trí hiện tại của đội so với các đội trong phòng, dựa trên giá trị doanh nghiệp. Hạng có thể đổi khi các đội phát triển hoặc gặp biến cố. Bấm vào ô Hạng.' },
    { action:'sound', target:'[data-guide="sound"]', text:'Nút loa bật hoặc tắt âm thanh thao tác của trò chơi. Bấm nút loa một lần để thử. Bạn có thể đổi lại bất cứ lúc nào; việc bật tiếng không ảnh hưởng điểm hay kết quả.' },
    { action:'investment', target:'[data-guide="tab-investment"]', tab:'investment', text:'Bên dưới là thanh điều hành. Tab Đầu tư chứa các khoản mua để phát triển doanh nghiệp: công nhân, cụm sản xuất, phụ trợ, hạ tầng và công nghệ sạch. Bấm Đầu tư để mở và xem trực tiếp.' },
    { action:'enterprise', target:'[data-guide="tab-enterprise"]', tab:'enterprise', text:'Trong Đầu tư, mỗi mục cho biết bạn nhận được gì và phải trả bao nhiêu; giá và định mức khác nhau theo ngành. Chưa cần mua ngay. Bây giờ bấm Doanh nghiệp để xem nguồn lực đang có.' },
    { action:'risk', target:'[data-guide="tab-risk"]', tab:'risk', text:'Doanh nghiệp cho biết công nhân, cụm đang chạy, công nghệ, phụ trợ, hạ tầng, ô nhiễm và đặc quyền. Cụm chỉ chạy khi đủ một tổ công nhân. Tiếp theo, bấm Rủi ro để xem các nguy cơ và hỗ trợ.' },
    { action:'events', target:'[data-guide="tab-events"]', tab:'events', text:'Rủi ro hiển thị nguy cơ tử vong, chuyển giao quyền điều hành và tình trạng hỗ trợ vốn nếu có. Tử vong chốt lượt chơi; không phải mọi lần chuyển giao đều phá sản. Bấm Lịch sử sự kiện để xem nơi theo dõi biến cố.' },
    { action:'years', target:'[data-guide="tab-years"]', tab:'years', text:'Lịch sử sự kiện có ba nhóm: Năm nay, Còn hiệu lực và Lịch sử. Bấm một sự kiện sẽ xem được tác động cụ thể. Hiệu ứng kinh tế tính theo năm. Bây giờ bấm Thay đổi từng năm để xem sổ thu–chi.' },
    { action:'investment-return', target:'[data-guide="tab-investment"]', tab:'investment', text:'Thay đổi từng năm ghi tiền vào, tiền ra và số dư sau mỗi lần chốt. Mở một năm để xem vì sao tăng hoặc giảm; năm đầu chưa chốt nên chưa có bản ghi. Bấm lại Đầu tư để thực hành.' },
    { action:'cluster', target:'[data-guide="starter-cluster"]', text:'Bắt đầu với một cụm sản xuất. Cụm tạo công suất nhưng chưa tạo sản phẩm nếu thiếu người vận hành. Bấm Mở 1 cụm ở nút đang được đánh dấu; chỉ giá hiện trên nút sẽ bị trừ vào tiền mặt.' },
    { action:'crew', target:'[data-guide="starter-crew"]', text:`Cụm đầu tiên đã có! Ngành này cần ${crew} công nhân cho một tổ. Bấm Tuyển đủ tổ để tuyển số người còn thiếu. Nhân lực dư không tự tăng sản lượng nếu chưa có thêm cụm để vận hành.` },
    { action:'enterprise-ready', target:'[data-guide="tab-enterprise"]', tab:'enterprise', text:scene.operating>0?'Đã đủ điều kiện vận hành! Bấm lại Doanh nghiệp để kiểm tra số công nhân và số cụm đang chạy vừa được cập nhật. Đầu tư đã trừ tiền và tăng chỉ số, còn sản xuất được chốt khi Sang năm.':'Bấm Doanh nghiệp để xem nguồn lực hiện có. Cụm thiếu công nhân sẽ chưa tạo sản phẩm; tiền mặt và tài sản vẫn được ghi nhận riêng.' },
    { action:'year', target:'[data-guide="year"]', text:'Bạn đã biết các mục điều hành. Bấm Sang năm để chốt năm đầu: trò chơi tính sản xuất, chi phí, hiệu ứng và biến cố. Lần này không có thời gian chờ; sau hướng dẫn, chu kỳ tự Sang năm mới bắt đầu.' },
    { action:'complete', target:'', text:'Bạn đã hoàn thành năm đầu! Kết quả đã được ghi vào Thay đổi từng năm; biến cố được ghi ở Sự kiện. Từ bây giờ bạn tự điều hành, và đồng hồ Sang năm của kỳ tiếp theo sẽ bắt đầu.' },
  ]
  const step = steps[Math.min(scene.tutorial?.step ?? 0, steps.length-1)]
  const subjects:Record<string,string>={enterprise:'investment',risk:'enterprise',events:'risk',years:'events','investment-return':'years'}
  if(subjects[step.action])step.focus=`[data-guide="tab-${subjects[step.action]}"]`
  if(step.action==='cluster'&&scene.machines>=1)return {action:'confirm-existing-cluster',target:'[data-guide="existing-resource"]',text:'Doanh nghiệp đã có cụm sản xuất, có thể do một sự kiện vừa mang lại. Bạn không phải mua lặp lại để vượt hướng dẫn. Kiểm tra số cụm hiện có rồi bấm Đã kiểm tra để chuyển sang nhân lực.'}
  if(step.action==='crew'&&scene.engineers>=crew)return {action:'confirm-existing-crew',target:'[data-guide="existing-resource"]',text:`Doanh nghiệp đã có đủ tổ ${crew} công nhân của ngành này. Bạn không phải tuyển lặp lại để vượt hướng dẫn. Bấm Đã kiểm tra để xem nguồn lực trong Doanh nghiệp.`}
  const quote = step.action==='cluster' ? scene.investmentPreviews?.mac?.[1] : step.action==='crew' ? scene.investmentPreviews?.eng?.crew : undefined
  if ((step.action==='cluster'||step.action==='crew') && (!quote || quote.count<1 || scene.cash<quote.total)) return { action:'continue-without-purchase',target:'[data-guide="insufficient-capital"]',text:'Vốn hiện tại chưa đủ cho khoản mua này. Mình sẽ không tự cấp thêm tiền hay mua thay bạn. Bấm Tiếp tục với vốn hiện có để xem doanh nghiệp và chốt năm; phần chưa đủ nhân lực sẽ chưa tạo sản phẩm.' }
  return step
}
export function guideDisplayedTab(step: number) {
  return step<=9?'investment':step===10?'enterprise':step===11?'risk':step===12?'events':step===13?'years':step<=16?'investment':'enterprise'
}
