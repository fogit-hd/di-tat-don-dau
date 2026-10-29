import type { QuestionDef } from './types'
import { PRESENTATION_QUESTIONS } from '../../prisma/seed/presentation-questions'

const ORIGINAL_QUESTIONS: QuestionDef[] = [
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

// Keep persisted question/option IDs stable while giving every active question
// four distinct choices, including the three former true/false prompts.
const revised:Record<string,{prompt:string;options:[string,string][]}>={
 q16:{prompt:'Mốc nào gắn với việc nêu khái niệm Công nghiệp 4.0 tại Hannover (Đức)?',options:[['dung','Năm 2011'],['sai','Cuối thế kỷ XVIII'],['c','Nửa đầu thế kỷ XIX'],['d','Đầu thế kỷ XX']]},
 q17:{prompt:'Quan điểm nào phù hợp với CNH-HĐH và hội nhập của Việt Nam?',options:[['dung','Tách biệt hoàn toàn khỏi kinh tế thế giới'],['sai','Chủ động hội nhập gắn với nâng năng lực tự chủ'],['c','Phụ thuộc hoàn toàn vào một đối tác'],['d','Ngừng mọi hợp tác công nghệ']]},
 q18:{prompt:'Nhập máy hiện đại nhưng thiếu người làm chủ. Quyết định nào hợp lý?',options:[['dung','Đào tạo nhân lực và tổ chức tiếp thu công nghệ'],['sai','Chỉ mua thêm máy mà không đào tạo'],['c','Bỏ việc bảo trì và kiểm soát chất lượng'],['d','Coi việc nhập máy là đã hoàn tất hiện đại hóa']]},
}
export const QUESTIONS:QuestionDef[]=[...ORIGINAL_QUESTIONS.map(row=>revised[row.id]?{...row,type:'mc',prompt:revised[row.id].prompt,explanation:row.explanation.replace(/^(Đúng|Sai)\. /u,''),options:revised[row.id].options.map(([id,text])=>({id,text}))}:row),...PRESENTATION_QUESTIONS]

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

