// One-off source migration. All files are local; no package/network changes.
const fs=require('node:fs'),path=require('node:path')
const root=path.resolve(__dirname,'..')
if(fs.existsSync(path.join(root,'frontend/src/shared/realtime.ts'))){console.log('One-off migration already applied.');process.exit(0)}
function read(p){return fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n')}
function write(p,s){fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),s)}
function replace(p,a,b){const s=read(p);if(!s.includes(a))throw Error('Missing source: '+p+' '+a.slice(0,70));write(p,s.replace(a,b))}

// Question content and transport are neutral infrastructure, never a dependency on a game's engine.
if(!read('backend/src/games/di-tat-don-dau/game/questions.data.ts').startsWith('export { QUESTIONS }')){
const types=read('backend/src/games/di-tat-don-dau/game/types.ts'),questionType=types.slice(types.indexOf('export type QuestionDef = {'),types.indexOf('\nexport type EffectPatch'))
write('backend/src/shared/questions/types.ts',questionType+'\n')
replace('backend/src/games/di-tat-don-dau/game/types.ts',questionType,"export type { QuestionDef } from '../shared/questions/types'\nimport type { QuestionDef } from '../shared/questions/types'\n")
write('backend/src/shared/questions/bank.ts',read('backend/src/games/di-tat-don-dau/game/questions.data.ts').replace("'../../prisma/seed/presentation-questions'","'../../../prisma/seed/presentation-questions'"))
write('backend/src/games/di-tat-don-dau/game/questions.data.ts',"export { QUESTIONS } from '../shared/questions/bank'\n")
replace('backend/prisma/seed/presentation-questions.ts',"'../../src/game/types'","'../../src/shared/questions/types'")
for(const p of ['backend/src/games/duck-race/engine.ts','backend/src/games/duck-race/engine.test.ts'])replace(p,"'../game/questions.data'","'../shared/questions/bank'")
}
if(!read('backend/src/load-env.ts').startsWith('export {')){
write('backend/src/shared/load-env.ts',read('backend/src/load-env.ts'))
write('backend/src/load-env.ts',"export { loadEnv } from './shared/load-env'\n")
}
replace('backend/src/games/duck-race/server.ts',"import '../load-env'\n",'')
replace('backend/src/games/duck-race/server.ts',"'../load-env'","'../shared/load-env'")
write('frontend/src/shared/realtime.ts',`import {io,type ManagerOptions,type SocketOptions} from 'socket.io-client'
/** A factory, NOT a singleton: every game owns its connection and lifecycle. */
export function createGameSocket(url:string|undefined,options:Partial<ManagerOptions & SocketOptions>){
 return io(url,{transports:['websocket','polling'],reconnection:true,...options})
}
`)
replace('frontend/src/games/di-tat-don-dau/realtime/useRoom.ts',"import { io } from 'socket.io-client'","import { createGameSocket } from '../shared/realtime'")
replace('frontend/src/games/di-tat-don-dau/realtime/useRoom.ts','const socket = io(','const socket = createGameSocket(')
replace('frontend/src/games/duck-race/DuckRace.tsx',"import { io, type Socket } from 'socket.io-client'","import type { Socket } from 'socket.io-client'\nimport { createGameSocket } from '../shared/realtime'")
replace('frontend/src/games/duck-race/DuckRace.tsx','const socket = io(','const socket = createGameSocket(')

// Shared basic UI / game selector: neither game imports the other game.
write('frontend/src/shared/ui/StaticArt.tsx',read('frontend/src/games/duck-race/StaticArt.tsx').replace('/assets/duck-race/lettering-v4/words.svg','/assets/shared/lettering/words.svg'))
write('frontend/src/shared/ui/lettering.manifest.json',read('frontend/src/games/duck-race/lettering.manifest.json'))
write('frontend/src/shared/ui/static-art.css',read('frontend/src/games/duck-race/static-art.css'))
write('frontend/src/games/duck-race/StaticArt.tsx',"export { StaticArt } from '../shared/ui/StaticArt'\n")
write('frontend/src/shared/GameHub.tsx',read('frontend/src/games/di-tat-don-dau/components/GameHub.tsx').replace("'../duck-race/StaticArt'","'./ui/StaticArt'"))
write('frontend/src/shared/game-hub.css',read('frontend/src/games/di-tat-don-dau/components/game-hub.css'))
write('frontend/src/games/di-tat-don-dau/components/GameHub.tsx',"export { GameHub } from '../shared/GameHub'\n")
replace('frontend/src/App.tsx',"'./components/GameHub.tsx'","'./shared/GameHub.tsx'")
replace('scripts/generate-duck-lettering.cjs',"'frontend/src/games/di-tat-don-dau/components/GameHub.tsx'","'frontend/src/shared/GameHub.tsx'")
// Publish the reusable lettering payload separately, leaving game-specific title assets isolated.
const script='scripts/generate-duck-lettering.cjs'
write(script,read(script)+`\nfs.mkdirSync(path.join(root,'frontend/public/assets/shared/lettering'),{recursive:true})
fs.copyFileSync(path.join(out,'words.svg'),path.join(root,'frontend/public/assets/shared/lettering/words.svg'))
fs.copyFileSync(path.join(root,'frontend/src/games/duck-race/lettering.manifest.json'),path.join(root,'frontend/src/shared/ui/lettering.manifest.json'))
`)

let ui=read('frontend/src/games/duck-race/DuckRace.tsx')
for(const[a,b]of [
 ['W A S D: di chuyển · Space: nhảy đôi · Shift: cúi','Tự đi chậm · W/S: né lên/xuống · Space: nhảy đôi · Shift: cúi'],
 ['Chuột trái: đánh · Giữ chuột phải: đỡ · E: mua lăn','Chuột trái: đánh · Giữ chuột phải: đỡ · E: chạy nhanh'],
 ['Không có làn · Thả hướng để đứng yên · Giữ hướng + lăn để bứt tốc','Tự đi chậm miễn phí · Né tự do trong phạm vi đường chạy'],
 ['Điều khiển tự do, không có làn.','Tự đi chậm, chủ động né và bứt tốc.'],
 ['W/A/S/D hoặc D-pad để đi; thả phím đứng yên. Space nhảy và nhảy lần hai trên không; giữ Shift để cúi. E mua 4 xung lăn (150 điểm), hoặc mua gói ngắn 50 điểm. Có năng lượng lăn thì giữ hướng để bứt tốc.','Vịt tự đi từ trái sang phải. W/S hoặc nút lên/xuống để né trong giới hạn đường; A/D điều chỉnh nhịp tiến. Space nhảy đôi; Shift cúi. E hoặc Chạy nhanh tiêu 150 điểm cho 4% đường đua bứt tốc. Gói ngắn 50 điểm cho 1%. Va chạm vẫn áp dụng khi chạy nhanh.'],
 ['Lăn ·','Chạy nhanh ·'],['Năng lượng lăn','Chạy nhanh bằng điểm'],['Lăn ngắn +','Bứt tốc +'],['Lăn dài +','Chạy nhanh +'],
 ['xung lăn ·','% bứt tốc ·'],['Giữ hướng để sử dụng','Tự động bứt tốc'],
 ['50 điểm = 1 xung lăn · 150 điểm = 4 xung lăn.','50 điểm = 1% bứt tốc · 150 điểm = 4% bứt tốc.'],
 ['Kiếm điểm trước. Chạy sau.','Tự đi chậm. Kiếm điểm để bứt tốc.']
])ui=ui.split(a).join(b)
write('frontend/src/games/duck-race/DuckRace.tsx',ui)
replace('shared/duck-race.ts','Nhận 3 xung lăn miễn phí. Giữ hướng để sử dụng; vẫn chịu va chạm.','Nhận 3% đường đua bứt tốc miễn phí, tự động sử dụng; vẫn chịu va chạm.')

const track='frontend/src/games/duck-race/RaceTrack.tsx'
replace(track,"'/assets/duck-race/background-v3/terrain.svg'","'/assets/duck-race/side-v10/countryside.webp'")
replace(track,'const moving=current.running&&(local?!!(local.x||local.y):p.speed>.1)&&p.stunnedUntil<=frameClock','const moving=current.running&&p.speed>.1&&p.stunnedUntil<=frameClock')
replace(track,"const fx=local?.x||p.facingX;","const fx=p.facingX;")
replace(track,"duck.sprite.scale.y=action==='crouch'&&!reduced?3.2*(.97+Math.sin(elapsed*Math.PI*3)*.06):3.2","duck.sprite.scale.y=3.2")
replace(track,'marker.position.set(p.x,ROAD_Y-ROAD_HALF_WIDTH-90)','marker.position.set(p.x,ROAD_Y-ROAD_HALF_WIDTH-100)')
replace(track,'marker.anchor.set(.5);marker.position.set(p.x,p.y)','marker.anchor.set(.5);marker.width=22;marker.height=ROAD_HALF_WIDTH*2+16;marker.position.set(p.x,p.y)')
replace(track,'tile.position.set(index*1600+(flip?1600:0),0)','tile.position.set(index*1600+(flip?1600:0),0)')
replace(track,'Đường đua ngang 60.000px, di chuyển tự do qua đất, nước và bùn. Camera bám theo vịt.','Đường đua cuộn ngang 60.000px, tự đi chậm và tiêu điểm chạy nhanh; né lên xuống trong phạm vi giới hạn, không chia làn.')
console.log('Shared question/transport/UI boundaries and side-scrolling controls migrated.')
