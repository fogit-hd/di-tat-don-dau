// Synchronize player instructions with the manual, three-lane obstacle course.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..')
const file=path.join(root,'frontend/src/games/duck-race/DuckRace.tsx')
let text=fs.readFileSync(file,'utf8')
for(const [old,current] of [
 ['Tự đi chậm. Kiếm điểm để bứt tốc.','Giữ hướng để di chuyển. Kiếm điểm để bứt tốc.'],
 ['Tự đi chậm · W/S: né lên/xuống · Space: nhảy đôi · Shift: cúi','W A S D: di chuyển · Thả phím: dừng · Space: nhảy đôi · Shift: cúi'],
 ['Tự đi chậm miễn phí · Né tự do trong phạm vi đường chạy','3 làn vật cản · Mỗi hàng có làn trống · Thả phím để đứng yên'],
 ['Tự động bứt tốc','Giữ hướng tiến để sử dụng'],
 ['Tự đi chậm, chủ động né và bứt tốc.','Di chuyển bằng phím, chọn làn trống.'],
 ['Vịt tự đi từ trái sang phải. W/S hoặc nút lên/xuống để né trong giới hạn đường; A/D điều chỉnh nhịp tiến. Space nhảy đôi; Shift cúi. E hoặc Chạy nhanh tiêu 150 điểm cho 4% đường đua bứt tốc. Gói ngắn 50 điểm cho 1%. Va chạm vẫn áp dụng khi chạy nhanh.','WASD hoặc phím mũi tên để di chuyển, thả phím đứng yên. Vật cản cố định theo X và phân bố vào 3 làn Y; mỗi hàng luôn có ít nhất một làn trống. Dùng W/S để né trước khi chạy qua. Space nhảy đôi; Shift cúi. E mua bứt tốc, giữ hướng tiến để dùng quãng đường đã mua. Va chạm vẫn áp dụng khi chạy nhanh.']
])text=text.split(old).join(current)
fs.writeFileSync(file,text)
