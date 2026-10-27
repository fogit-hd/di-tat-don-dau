import type { SceneView } from '../api/types'
import { money, vnd } from './format'
import { count, rate } from './production-format'

export type GuideStep = { action: string; target: string; text: string; tab?: string; focus?: string; interaction?:'continue' }
export function guideActive(scene: SceneView) { return scene.tutorial?.version === 1 && !scene.tutorial.complete && !scene.finished && !scene.bankrupt }
export function guideStep(scene: SceneView,context:{ceoName?:string;industryName?:string;rank?:number;durationSec?:number}={}): GuideStep {
  const crew = scene.crewRequired ?? 1
  const ceo=context.ceoName?.trim()||'bạn',industry=context.industryName||'ngành này'
  const clusterQuote=scene.investmentPreviews?.mac?.[1],crewQuote=scene.investmentPreviews?.eng?.crew,hireQuote=scene.investmentPreviews?.eng?.[1]
  const steps: GuideStep[] = [
    { action:'company', target:'[data-guide="company"]', text:`Chào CEO ${ceo}! Bạn đang điều hành ${scene.factoryName}, thuộc ngành ${industry}. Tên CEO dùng trên bảng xếp hạng; tên công ty đã được phân sẵn, bạn không cần đặt lại.` },
    { action:'cash', target:'[data-guide="cash"]', text:`Bạn đang có ${vnd(scene.cash)} tiền mặt. Đây là vốn dùng để mua nâng cấp và trả chi phí. Hãy theo dõi số dư trước mỗi khoản đầu tư.` },
    { action:'assets', target:'[data-guide="assets"]', text:`Doanh nghiệp hiện được định giá ${vnd(scene.value)}. Đây không phải tiền mặt để chi thêm; chỉ số này ảnh hưởng thứ hạng của CEO ${ceo}.` },
    { action:'year-count', target:'[data-guide="year-count"]', text:`Bạn đã chốt ${scene.cycles} năm. Lần Sang năm tiếp theo sẽ ghi kết quả Năm ${scene.cycles+1}, rồi doanh nghiệp bước vào kỳ mới.` },
    { action:'clock', target:'[data-guide="clock"]', text:`Phiên chơi này dài ${Math.round((context.durationSec??600)/60)} phút. Đồng hồ trận vẫn chạy trong lúc hướng dẫn; đồng hồ tự Sang năm đang được giữ lại để bạn làm quen.` },
    { action:'income', target:'[data-guide="income"]', text:`Thu vận hành hiện ghi ${money(scene.lastProduction?.net??scene.lastIncome)}. ${scene.cycles===0?'Bạn chưa chốt năm đầu nên chưa có kết quả sản xuất.':'Đây là kết quả sản xuất năm vừa chốt.'} Các khoản thu–chi khác nằm trong Thay đổi từng năm.` },
    { action:'rank', target:'[data-guide="rank"]', text:`CEO ${ceo} đang ở hạng ${context.rank??1}. Thứ hạng có thể đổi khi doanh nghiệp phát triển hoặc các CEO khác gặp biến cố.` },
    { action:'sound', target:'[data-guide="sound"]', text:'Nút loa bật hoặc tắt âm thanh thao tác. Bạn có thể đổi bất cứ lúc nào; việc bật tiếng không ảnh hưởng kết quả lượt chơi.' },
    { action:'investment', target:'[data-guide="tab-investment"]', tab:'investment', text:'Bên dưới là thanh điều hành. Tab Đầu tư chứa các khoản mua để phát triển doanh nghiệp: công nhân, cụm sản xuất, phụ trợ, hạ tầng và công nghệ sạch. Bấm Đầu tư để mở và xem trực tiếp.' },
    { action:'enterprise', target:'[data-guide="tab-enterprise"]', tab:'enterprise', text:`Trong Đầu tư của ${industry}, tuyển một công nhân hiện giá ${hireQuote?money(hireQuote.total):'trên nút'}; mở một cụm giá ${clusterQuote?money(clusterQuote.total):'trên nút'}. Chưa cần mua ngay. Bấm Doanh nghiệp để xem nguồn lực đang có.` },
    { action:'risk', target:'[data-guide="tab-risk"]', tab:'risk', text:'Doanh nghiệp cho biết công nhân, cụm đang chạy, công nghệ, phụ trợ, hạ tầng, ô nhiễm và đặc quyền. Cụm chỉ chạy khi đủ một tổ công nhân. Tiếp theo, bấm Rủi ro để xem các nguy cơ và hỗ trợ.' },
    { action:'events', target:'[data-guide="tab-events"]', tab:'events', text:`Rủi ro kỳ tới của CEO ${ceo}: tử vong ${rate(scene.deathChance??0)}, kế nghiệp ${rate(scene.successionChance??0)}. Tình trạng hỗ trợ vốn nằm bên dưới. Bấm Lịch sử sự kiện để xem nơi theo dõi biến cố.` },
    { action:'years', target:'[data-guide="tab-years"]', tab:'years', text:'Lịch sử sự kiện có ba nhóm: Năm nay, Còn hiệu lực và Lịch sử. Bấm một sự kiện sẽ xem được tác động cụ thể. Hiệu ứng kinh tế tính theo năm. Bây giờ bấm Thay đổi từng năm để xem sổ thu–chi.' },
    { action:'investment-return', target:'[data-guide="tab-investment"]', tab:'investment', text:'Thay đổi từng năm ghi tiền vào, tiền ra và số dư sau mỗi lần chốt. Mở một năm để xem vì sao tăng hoặc giảm; năm đầu chưa chốt nên chưa có bản ghi. Bấm lại Đầu tư để thực hành.' },
    { action:'cluster', target:'[data-guide="starter-cluster"]', text:`Ngành ${industry} của bạn cần ${crew} công nhân/cụm. Mở cụm đầu tiên hiện có giá ${clusterQuote?money(clusterQuote.total):'trên nút'}. Bấm Mở 1 cụm ở nút đang sáng để mua; sau đó cùng tuyển tổ vận hành.` },
    { action:'crew', target:'[data-guide="starter-crew"]', text:`Bạn đã có ${count(scene.machines)} cụm và ${count(scene.engineers)} công nhân. Ngành này cần ${crew} người/cụm; tổ đầu còn thiếu ${count(crewQuote?.count??Math.max(0,crew-scene.engineers))} người. Bấm Tuyển đủ tổ${crewQuote?` với giá ${money(crewQuote.total)}`:''} để sẵn sàng vận hành.` },
    { action:'enterprise-ready', target:'[data-guide="tab-enterprise"]', tab:'enterprise', text:`Nguồn lực của CEO ${ceo}: ${count(scene.engineers)} công nhân, ${count(scene.machines)} cụm; ${count(scene.operating)} đang chạy và ${count(scene.idle)} chờ nhân lực. Bấm Doanh nghiệp để xem các chỉ số vừa cập nhật.` },
    { action:'year', target:'[data-guide="year"]', text:'Bạn đã biết các mục điều hành. Bấm Sang năm để chốt năm đầu: trò chơi tính sản xuất, chi phí, hiệu ứng và biến cố. Lần này không có thời gian chờ; sau hướng dẫn, chu kỳ tự Sang năm mới bắt đầu.' },
    { action:'complete', target:'', text:`CEO ${ceo} đã chốt Năm ${scene.cycles}! Sản lượng ${count(scene.lastProduction?.output??scene.lastOutput)} ${scene.unit}; lãi sản xuất ${money(scene.lastProduction?.net??scene.lastIncome)}. Kết quả ở Thay đổi từng năm. Từ bây giờ bạn tự điều hành; đồng hồ Sang năm sẽ bắt đầu.` },
  ]
  const step = steps[Math.min(scene.tutorial?.step ?? 0, steps.length-1)]
  if((scene.tutorial?.step??0)<8)step.interaction='continue'
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
