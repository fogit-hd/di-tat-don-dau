import type { SceneView } from '../api/types'
import type { GuideStep } from './first-year-guide'
import { money, vnd } from './format'
import { count, rate } from './production-format'

export const GUIDE_V2_ACTIONS=['company','cash','assets','year-count','clock','income','rank','sound','investment','cluster','crew','supply','infrastructure','green','enterprise-ready','stat-workers','stat-clusters','stat-products','stat-tech','stat-supply','stat-infra','stat-environment','stat-quality','risk','events','years','year','complete'] as const
export function guideV2(scene:SceneView,context:{ceoName?:string;industryName?:string;rank?:number;durationSec?:number}):GuideStep{
 const action=GUIDE_V2_ACTIONS[Math.min(scene.tutorial?.step??0,GUIDE_V2_ACTIONS.length-1)],crew=scene.crewRequired??1
 const ceo=context.ceoName||'bạn',industry=context.industryName||'ngành này',quotes=scene.investmentPreviews
 const texts:Record<string,string>={
  company:`Chào CEO ${ceo}! Bạn đang điều hành ${scene.factoryName}, ngành ${industry}. Công ty đã có tên riêng; bạn không cần đặt lại.`,
  cash:`Bạn có ${vnd(scene.cash)} tiền mặt. Đây là vốn để mua nâng cấp và trả chi phí. Mỗi lần đầu tư sẽ trừ tiền ở đây.`,
  assets:`Tài sản doanh nghiệp hiện là ${vnd(scene.value)}. Đây là giá trị dùng xếp hạng, không phải tiền mặt có thể chi thêm.`,
  'year-count':`Bạn đã chốt ${scene.cycles} năm. Nút Sang năm sẽ chốt kết quả năm đang chơi và đưa công ty sang kỳ tiếp theo.`,
  clock:`Trận dài ${Math.round((context.durationSec??900)/60)} phút. Đồng hồ trận vẫn chạy. Chỉ đồng hồ tự Sang năm được giữ trong lúc bạn học thao tác.`,
  income:`Thu vận hành hiện là ${money(scene.lastProduction?.net??scene.lastIncome)}. Chưa chốt năm đầu thì chưa có kết quả sản xuất; số này không gồm mọi khoản thu chi khác.`,
  rank:`CEO ${ceo} đang hạng ${context.rank??1}. Hạng thay đổi theo giá trị doanh nghiệp và kết quả của các CEO khác.`,
  sound:'Nút loa bật hoặc tắt âm thanh thao tác. Âm thanh không ảnh hưởng kết quả. Tiếp theo mình sẽ hướng dẫn bạn mua nâng cấp thật.',
  investment:'Bấm tab Đầu tư để mở danh sách nâng cấp. Chúng ta sẽ bấm các nút Đầu tư ngay trên thẻ, dùng vốn thật của doanh nghiệp.',
  cluster:`Mở một cụm giúp công ty có nơi sản xuất. Ngành ${industry} cần ${crew} công nhân cho mỗi cụm. Giá cụm đầu tiên hiện là ${money(quotes?.mac?.[1]?.total??0)}. Bấm Đầu tư trên thẻ Mở cụm sản xuất.`,
  crew:`Bạn có ${count(scene.machines)} cụm và ${count(scene.engineers)} công nhân. Còn thiếu ${count(quotes?.eng?.crew?.count??Math.max(0,crew-scene.engineers))} người cho tổ đầu. Bấm Tuyển đủ tổ trong thẻ công nhân, giá ${money(quotes?.eng?.crew?.total??0)}. Đủ người thì cụm mới chạy.`,
  supply:`Công ty có ${count(scene.operating)} cụm đang vận hành. Phụ trợ giúp giảm phí nguyên liệu và giảm bất lợi khi thiếu nguồn cung. Bấm Đầu tư trên thẻ ${scene.lines.find(l=>l.id==='sup')?.label??'phụ trợ'}, giá ${money(quotes?.sup?.[1]?.total??0)}.`,
  infrastructure:`Phụ trợ đã ở cấp ${scene.support.toLocaleString('vi-VN',{maximumFractionDigits:1})}. Hạ tầng giúp giảm phí logistics và tăng tỷ lệ hàng bán được. Bấm Đầu tư trên thẻ ${scene.lines.find(l=>l.id==='inf')?.label??'hạ tầng'}, giá ${money(quotes?.inf?.[1]?.total??0)}.`,
  green:`Công nghệ sạch xử lý ô nhiễm, giúp bảo vệ giá bán và giá trị doanh nghiệp. Nó khác công nghệ tăng năng suất. Bấm Đầu tư trên thẻ công nghệ sạch, giá ${money(quotes?.grn?.[1]?.total??0)}.`,
  'enterprise-ready':`Bạn đã thực hành các thẻ đầu tư. Hiện có ${count(scene.engineers)} công nhân, ${count(scene.machines)} cụm và ${count(scene.operating)} cụm đang chạy. Bấm Doanh nghiệp để xem từng chỉ số.`,
  'stat-workers':`Bạn có ${count(scene.engineers)} công nhân. Ngành ${industry} cần ${crew} người cho một cụm. Tuyển đủ tổ giúp cụm chạy; tuyển dư không tự tạo thêm cụm hoặc sản phẩm.`,
  'stat-clusters':`Bạn sở hữu ${count(scene.machines)} cụm: ${count(scene.operating)} đang vận hành, ${count(scene.idle)} chờ đủ nhân lực. Cụm cần đủ tổ mới tạo sản phẩm; cụm chờ vẫn có thể tốn phí duy trì.`,
  'stat-products':`Bạn đã làm ra tổng cộng ${count(scene.output)} ${scene.unit}. Đây là sản phẩm cộng dồn qua các năm, không phải dự báo năm tới, lượng đã bán hay hàng tồn kho.`,
  'stat-tech':`Công nghệ hiện là ${scene.tech.toLocaleString('vi-VN',{maximumFractionDigits:1})}. Vận hành giúp tích lũy công nghệ và tăng năng suất. Chỉ số này khác tay nghề, chất lượng và tình trạng thiết bị.`,
  'stat-supply':`Phụ trợ hiện cấp ${scene.support.toLocaleString('vi-VN',{maximumFractionDigits:1})}. Nó giúp tiết kiệm nguyên liệu và bảo vệ nguồn cung. Nó không thay công nhân hoặc cụm sản xuất.`,
  'stat-infra':`Hạ tầng hiện cấp ${scene.infra.toLocaleString('vi-VN',{maximumFractionDigits:1})}. Nó giảm phí vận chuyển, kho bãi và giúp bán được nhiều sản phẩm hơn. Không có cụm chạy thì hạ tầng chưa tự tạo sản phẩm.`,
  'stat-environment':`Ô nhiễm hiện ${Math.round(scene.pollution)}/100, công nghệ sạch cấp ${scene.green.toLocaleString('vi-VN',{maximumFractionDigits:1})}. Ô nhiễm cao làm bất lợi giá bán và định giá. Công nghệ sạch giúp xử lý ô nhiễm.`,
  'stat-quality':`Tay nghề hiện ${scene.workerSkill??0}/5; chất lượng thiết bị ${scene.machineQuality??0}/5; tình trạng ${Math.round((scene.condition??1)*100)}%. Đào tạo và cải tiến tăng năng suất; bảo dưỡng phục hồi tình trạng. Các lựa chọn có điều kiện mở khóa riêng.`,
  risk:'Bấm Rủi ro để biết những tình huống có thể kết thúc lượt chơi và tình trạng hỗ trợ của chính doanh nghiệp này.',
  events:`Nguy cơ kỳ tới của bạn: tử vong ${rate(scene.deathChance??0)}, kế nghiệp ${rate(scene.successionChance??0)}. Bấm Lịch sử sự kiện để xem tác động cụ thể và thời hạn của biến cố.`,
  years:'Hiệu ứng kinh tế tính theo năm: Năm nay, Còn hiệu lực và Lịch sử giúp bạn theo dõi chúng. Bấm Thay đổi từng năm để xem nơi ghi tiền vào và tiền ra.',
  year:'Mỗi năm đã chốt sẽ ghi các khoản thu chi và số dư ở đây. Bây giờ bấm Sang năm thật để chốt năm đầu. Lần này không phải chờ; trò chơi không bấm thay bạn.',
  complete:`Bạn đã chốt Năm ${scene.cycles}: sản lượng ${count(scene.lastProduction?.output??scene.lastOutput)} ${scene.unit}, lãi sản xuất ${money(scene.lastProduction?.net??scene.lastIncome)}. Xem các khoản khác trong sổ thu chi. Từ đây bạn tự điều hành; đồng hồ tự Sang năm bắt đầu.`,
 }
 const tabs:Record<string,string>={investment:'investment','enterprise-ready':'enterprise',risk:'risk',events:'events',years:'years'}
 const targets:Record<string,string>={cluster:'buy-mac',crew:'buy-crew',supply:'buy-sup',infrastructure:'buy-inf',green:'buy-grn'}
 const info=action.startsWith('stat-')||GUIDE_V2_ACTIONS.indexOf(action)<8
 const target=tabs[action]?`tab-${tabs[action]}`:targets[action]??action
 const step:GuideStep={action,target:`[data-guide="${target}"]`,text:texts[action],tab:tabs[action],interaction:info?'continue':undefined}
 if(action==='complete')step.target=''
 if(action==='cluster'&&scene.machines>=1)return {action:'confirm-existing-cluster',target:'[data-guide="existing-resource"]',text:'Bạn đã có cụm sản xuất. Không cần mua lặp lại để qua hướng dẫn. Bấm Đã kiểm tra để xem tổ vận hành.'}
 if(action==='crew'&&scene.engineers>=crew)return {action:'confirm-existing-crew',target:'[data-guide="existing-resource"]',text:`Bạn đã có đủ tổ ${crew} công nhân. Không cần tuyển lặp lại. Bấm Đã kiểm tra để xem các khoản đầu tư khác.`}
 const line=({cluster:'mac',crew:'eng',supply:'sup',infrastructure:'inf',green:'grn'} as const)[action as 'cluster'|'crew'|'supply'|'infrastructure'|'green']
 const quote=line?quotes?.[line]?.[action==='crew'?'crew':1]:undefined
 if(line&&(!quote||quote.count<1||scene.cash<quote.total))return {action:'continue-without-purchase',target:'[data-guide="insufficient-capital"]',text:'Vốn hiện chưa đủ cho khoản này. Bạn không bị buộc vay hoặc mua thay. Bấm Tiếp tục với vốn hiện có; khi có thêm tiền, bạn có thể trở lại nâng cấp.'}
 return step
}
