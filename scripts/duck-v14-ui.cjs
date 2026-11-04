const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const file=path.join(root,'frontend/src/games/duck-race/DuckRace.tsx');let s=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
s=s.replace("import './frames-v9.css'","import './frames-v9.css'\nimport './frames-v14.css'");
s=s.replace("if (snap?.phase !== 'racing' || session?.role !== 'player' || rules || questionOpen)","if (snap?.phase !== 'racing' || snap?.me?.capturedAt || session?.role !== 'player' || rules || questionOpen)");
s=s.replace('[snap?.phase, session?.role, rules, questionOpen]', '[snap?.phase, snap?.me?.capturedAt, session?.role, rules, questionOpen]');
s=s.replace("finished = snap?.phase === 'finished'", "finished = snap?.phase === 'finished' || !!snap?.me?.capturedAt");
s=s.replace('canAct = racing && connected','canAct = racing && connected && !me?.capturedAt');
// Relocate the real control DOM (same handlers) onto the foreground soil, below the running road.
const start=s.indexOf('<section className="dq-driving"'),end=s.indexOf('</section>',start)+10;
const driving=s.slice(start,end).replace('3 làn vật cản · Mỗi hàng có làn trống · Thả phím để đứng yên','Vật cản ngẫu nhiên · Không có làn · Thả phím để đứng yên');
s=s.slice(0,start)+s.slice(end);
s=s.replace('{racing&&!host&&guide&&',`{racing&&!host&&!me?.capturedAt&&${driving}}\n          {racing&&!host&&!me?.capturedAt&&guide&&`);
s=s.replace('<h2>{host ? <S text="Bảng tổng kết" bold/>', '<h2>{me?.capturedAt ? <S text="Vịt đã bị bắt · Điểm đã chốt" bold/> : host ? <S text="Bảng tổng kết" bold/>');
s=s.replace('<p>{snap.finishReason === \'finish\' ?', '<p>{me?.capturedAt ? <S text="Lượt của bạn đã kết thúc. Các vịt khác vẫn tiếp tục đua; hạng cuối cùng được xác nhận khi hết trận."/> : snap.finishReason === \'finish\' ?');
s=s.replace('Di chuyển bằng phím, chọn làn trống.','Di chuyển bằng phím, chủ động né tránh.').replace('Vật cản cố định theo X và phân bố vào 3 làn Y; mỗi hàng luôn có ít nhất một làn trống. Dùng W/S để né trước khi chạy qua.','Vật cản cố định theo X, có vị trí và chiều dài ngẫu nhiên theo Y. Tường kín cần đi vòng; rào thấp cần nhảy; ụ cao cần nhảy đôi; thanh treo cần cúi hoặc lăn.');
fs.writeFileSync(file,s);
console.log('Gameplay controls moved to foreground; capture is a personal terminal state.');
