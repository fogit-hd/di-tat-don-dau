import companyEvents from '../lib/company-events.json'
import { companyRules } from '../lib/wiki-company-rules'
import { PaintedArt as Art } from './ArtText'
import { PublicArtText as T } from './PublicArtText'
import { useState } from 'react'
import { PAGE_SIZE } from '../lib/pagination'
import { PageControls } from './PageControls'

const updates = [
  {title:'Phòng chờ & nhận diện CEO',paragraphs:[
    'Mỗi phòng nhận tối đa 50 CEO khi đủ chủ đề doanh nghiệp. Danh sách chia trang tối đa 10 CEO, có tìm tên và trạng thái kết nối. Đây là danh sách phòng chờ, chưa phải bảng xếp hạng.',
    'Người chơi thấy toàn bộ dáng đứng và trang phục của mình. Bấm Thay đổi nhận diện để mở ngăn bên phải; nền phòng chờ được làm tối và giữ nguyên bố cục. Chọn dáng người, màu da, bộ đồ rồi Lưu diện mạo. Đóng khi chưa lưu sẽ bỏ các thay đổi thử.',
    'Diện mạo đã lưu được dùng cho CEO đó trong phòng và khi tổng kết. Lỗi lưu giữ lại lựa chọn để thử lại; không thay đổi diện mạo của CEO khác. Khi host bắt đầu, ngăn nhận diện đóng và chuyển sang đếm ngược.',
    'Giây mỗi năm và Khóa nút có thể nhập số hoặc bấm nút tăng/giảm được vẽ riêng. Hiệu ứng mở/đóng, đổi trang, thay trang phục và kết nối hỗ trợ tùy chọn giảm chuyển động của thiết bị.',
  ]},
  {title:'Cụm sản xuất, nhân lực & giá đầu tư',paragraphs:[
    'Chủ phòng tự nhập thời lượng 1–45 phút và vốn tham chiếu 2–100 tỷ VNĐ, tối đa một chữ số thập phân; ví dụ 2,5 tỷ. Các chỉ số của phiên được cố định khi tạo phòng và chỉ hiển thị để xem trong sảnh chờ. Muốn đổi thiết lập cần tạo phòng mới.',
    'Mỗi ngành có định mức tổ công nhân và giá riêng cho tuyển người, mở cụm, phụ trợ, hạ tầng, công nghệ sạch. Đủ người mới vận hành được cụm; số người, cụm hoạt động và sản phẩm luôn là số nguyên.',
    'Mua ×1, ×5, ×10 hoặc Tối đa cộng đúng giá từng gói khi quy mô tăng. Ưu đãi giảm giá chỉ giảm tiền trả, không giảm nguồn lực nhận: gói 100 triệu giảm 10% còn 90 triệu vẫn nhận đủ một gói.',
    'Đào tạo tay nghề và cải tiến thiết bị có 5 cấp; mở khi có 3 cụm đang vận hành. Bảo dưỡng khôi phục 100% độ bền, không thêm cụm. Mất cấp do sự kiện không xóa số lần đã mua, không làm giá nâng cấp rẻ trở lại.',
    'Tiền hiển thị theo triệu và tỷ VNĐ; 1 đơn vị tính nội bộ là 1 triệu. Công nghệ vận hành vẫn có thể tích lũy phần lẻ; quy định % nguyên áp dụng cho các % tác động ngẫu nhiên, không phải mọi chỉ số trong game.',
  ]},
  {title:'Độ bền, tốc độ máy & hàng lỗi',paragraphs:[
    'Chỉ năm có cụm thực sự vận hành mới hao mòn 5–10 điểm % độ bền. Sản xuất năm đó dùng độ bền đầu năm; hao mòn được trừ cuối năm. Mở dự báo, tải lại trang hoặc mua nâng cấp không bốc lại kết quả của năm.',
    'Trên 80–100% độ bền: tốc độ 100%, hàng lỗi 0–1%. Trên 60–80%: tốc độ 90%, lỗi 2–4%. Trên 40–60%: tốc độ 75%, lỗi 5–8%. Trên 20–40%: tốc độ 55%, lỗi 9–15%. Trên 0–20%: tốc độ 30%, lỗi 16–25%.',
    'Mỗi năm bốc % lỗi nguyên theo mốc độ bền. Hàng lỗi = làm tròn xuống (sản lượng × % lỗi); không bán được nhưng vẫn tốn chi phí sản xuất. Hàng đạt chất lượng còn chịu tỷ lệ giao hàng để ra lượng bán thực tế.',
    'Độ bền 0%: dừng sản xuất, không mất quyền sở hữu cụm hoặc công nhân, vẫn có chi phí duy trì. Bảo dưỡng để chạy lại. Độ bền còn ảnh hưởng định giá thiết bị; chất lượng thiết bị và độ bền là hai chỉ số khác nhau.',
  ]},
  {title:'Sự kiện, ngẫu nhiên & thời hạn',paragraphs:[
    'Danh mục sự kiện chứa toàn bộ sự kiện gốc, các biến thể ngữ cảnh và 21 sự kiện doanh nghiệp mới. Các ý tưởng chưa triển khai không nằm trong danh mục đang áp dụng. Sự kiện có điều kiện nguồn lực: không bốc giảm chất lượng nếu chưa có cấp chất lượng, không bốc hỏng độ bền nếu chưa có cụm.',
    'Mức tác động được bốc và lưu một lần khi sự kiện xuất hiện. % tác động ngẫu nhiên là số nguyên, không bốc lại khi xem chi tiết. Các mốc nền cũ có thể được dao động quanh mức gốc; tỷ lệ tăng rủi ro theo năm là luật riêng.',
    'Chưa bắt đầu: “Áp dụng từ năm kế tiếp · kéo dài 2 năm”. Đang hiệu lực: “Còn 2 năm”, giảm sau mỗi kỳ chốt. Thay đổi tiền, người, cấp hoặc độ bền tức thời không tự hoàn tác khi thẻ hết hiển thị. Chỉ hoạt cảnh và thời gian trả lời dùng giây.',
    'Lịch sử ghi số bốc thực tế, số tiền trước/sau và tác động. Ưu đãi sản lượng, giá bán và chi phí nằm trong thu nhập sản xuất; không cộng thêm cùng khoản đó lần thứ hai như tiền mặt sự kiện.',
  ]},
  {title:'Tương tác giữa các CEO sang năm khác nhau',paragraphs:[
    'Phí bản quyền và hoa hồng được xếp chờ, chưa chuyển tiền khi CEO nhanh bốc sự kiện. CEO nhận tác động thấy sự kiện và trả tiền khi chính họ bấm Sang năm, trước kỳ sản xuất của họ; không dùng năm của người gửi để ép người nhận chạy theo.',
    'Tỷ lệ và trần phí lưu ngay khi xếp chờ; số tiền tính theo tiền mặt khả dụng của bên trả tại lúc xử lý. Bên nhận được đúng khoản bên trả mất, không gây âm tiền do khoản phí. Mỗi bên trả tối đa 3 khoản đang chờ; một cặp CEO không xếp trùng cùng loại phí khi khoản trước chưa xử lý.',
    'Nếu hết trận vẫn còn chờ, quyết toán ngay trong tổng kết. Cả hai CEO đều có chứng từ “Quyết toán khi tổng kết”, tên đối tác và số tiền thực tế trong lịch sử. Không hồi sinh tài sản 0 hoặc doanh nghiệp đã phá sản để trả phí.',
  ]},
  {title:'Quyết toán tài sản & Hết hạn bảo hộ',paragraphs:[
    'Hết hạn bảo hộ là quyền thu ngẫu nhiên 1–3% tổng tài sản từ mỗi CEO khác có Công nghệ độc quyền lúc chốt trận. Không thu của chính mình, không thu của CEO không có công nghệ và không trừ tiền mặt thêm. Quyền này không phải đồng hồ tự hết của Công nghệ độc quyền.',
    'Tổng mỗi bên trả không quá 10% tài sản ban đầu và 1 tỷ; tổng mỗi bên thu không quá 20% tài sản ban đầu và 1 tỷ. Có nhiều bên thu thì phân bổ theo tỷ lệ và các trần chung; chứng từ ghi khoản yêu cầu, thực nhận và lý do giảm theo trần.',
    'Phí tiền mặt đang chờ xử lý trước. Sau đó chụp chung một bảng tài sản cho Hết hạn bảo hộ, thưởng theo người giàu nhất và nghĩa vụ tài sản. Không lấy tiền thưởng vừa nhận để tính thưởng/phí dây chuyền. Quyết toán chỉ một lần; mở lại trang không cộng hoặc trừ lại.',
    'Ví dụ: tài sản CEO có Công nghệ độc quyền là 10 tỷ; người thu bốc 3% thì khoản yêu cầu là 300 triệu. Khoản thực nhận có thể thấp hơn nếu chạm trần của bên thu hoặc có nhiều người cùng thu. Chênh lệch tài sản làm thay đổi thứ hạng cuối cùng.',
  ]},
  {title:'Hướng dẫn năm đầu, câu hỏi & tổng kết',paragraphs:[
    'Cố vấn dùng đúng doanh nghiệp và thông số hiện tại của CEO. Các bước giới thiệu và chuyển tab tự mở mục cần xem trước khi nói, nghỉ 2,5 giây sau lời thoại rồi tiếp tục; có thể bấm để đi sớm hơn. Bước đầu tư yêu cầu tự bấm nút nâng cấp thật.',
    'Đồng hồ chung của trận vẫn chạy trong hướng dẫn. Sang năm đầu không bị trì hoãn; bộ đếm năm tiếp theo bắt đầu sau khi hoàn tất hướng dẫn. Các bước mua nâng cấp và chốt năm cần người chơi thao tác.',
    'Câu hỏi đang mở giữ lại đồng hồ năm của CEO; đồng hồ chung và thời hạn trả lời vẫn chạy. Không chồng câu sau lên câu chưa giải quyết. Thưởng trả lời đúng trong mô hình mới bốc 32–48 triệu.',
    'Tổng kết người chơi: xem hạng của mình, dòng tiền, sự kiện và câu hỏi đã gặp. Câu chọn sai viền đỏ, đáp án đúng viền xanh; hết giờ được ghi riêng. Tổng kết host: tất cả câu đã xuất hiện, số lần, % đúng và tỷ lệ chọn 4 đáp án. Đáp án chỉ mở sau khi lượt hoặc trận đã kết thúc tương ứng.',
    'Top 3 chỉ trao giải trên màn hình host khi hết trận. Bảng trực tiếp vẫn là danh sách thứ hạng và trạng thái CEO; kết quả riêng người chơi không hiện bục top 3.',
  ]},
] as const

export function WikiUpdates({onEvent}:{onEvent:(id:string)=>void}) {
  const [page,setPage]=useState(0)
  return <>
    <div className="wiki-heading"><h1><T text="Cập nhật & luật hiện hành" bold/></h1><p><T text="Các thay đổi đã áp dụng cho mô hình doanh nghiệp mới"/></p></div>
    <div className="wiki-notice"><T text="Các công thức chi tiết nằm trong mục Sản lượng & thu nhập và Đầu tư & nâng cấp. Phòng cũ hoặc cấu hình riêng có thể khác; dự báo trong gameplay phản ánh thông số thực tế của CEO."/></div>
    <div className="wiki-update-rules">{updates.map(update=><details className="wiki-fold" key={update.title}><summary><T text={update.title} bold/><span aria-hidden="true" className="wiki-fold-arrow"><T text="›"/></span></summary><div>{update.paragraphs.map(text=><p key={text}><T text={text}/></p>)}</div></details>)}</div>
    <h2><T text={`${companyEvents.length} sự kiện mới đã áp dụng`} bold/></h2>
    <div className="wiki-update-events">{companyEvents.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE).map(event=><article key={event.id} className="wiki-update-event"><Art src={`/assets/ui/company-events-v1/${event.art}.svg`}/><div><h3><T text={event.title} bold/></h3><p><T text={companyRules[event.id]}/></p><button type="button" className="public-button public-button-dark" onClick={()=>onEvent(event.id)}><T text="Xem chi tiết"/></button></div></article>)}</div>
    <PageControls page={page} count={companyEvents.length} onChange={setPage} label="Trang cập nhật sự kiện"/>
  </>
}
