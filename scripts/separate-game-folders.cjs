// One-off, path-checked mechanical move. No file deletion or dependency changes.
const fs=require('node:fs'),path=require('node:path')
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(p,'utf8')
const folders=[
 ['frontend/src/components','frontend/src/games/di-tat-don-dau/components'],
 ['frontend/src/lib','frontend/src/games/di-tat-don-dau/lib'],
 ['frontend/src/api','frontend/src/games/di-tat-don-dau/api'],
 ['frontend/src/realtime','frontend/src/games/di-tat-don-dau/realtime'],
 ['frontend/src/duck-race','frontend/src/games/duck-race'],
 ['backend/src/game','backend/src/games/di-tat-don-dau/game'],
 ['backend/src/duck-race','backend/src/games/duck-race'],
]
const exact=new Map([
 ['frontend/src/components/ArtText.tsx','frontend/src/shared/ui/ArtText.tsx'],
 ['frontend/src/components/PublicArtText.tsx','frontend/src/shared/ui/PublicArtText.tsx'],
 ['frontend/src/components/GoogleHostLogin.tsx','frontend/src/shared/auth/GoogleHostLogin.tsx'],
 ['frontend/src/components/google-host-login.css','frontend/src/shared/auth/google-host-login.css'],
 ['frontend/src/lib/public-letter-paths.json','frontend/src/shared/ui/public-letter-paths.json'],
 ['frontend/src/lib/endpoints.ts','frontend/src/shared/http/endpoints.ts'],
 ['frontend/src/lib/image-drag.ts','frontend/src/shared/ui/image-drag.ts'],
 ['frontend/src/api/client.ts','frontend/src/shared/http/client.ts'],
 ['frontend/src/public-font.css','frontend/src/shared/ui/public-font.css'],
 ['backend/src/runtime.ts','backend/src/games/di-tat-don-dau/runtime.ts'],
 ['backend/src/runtime-purchases.test.ts','backend/src/games/di-tat-don-dau/runtime-purchases.test.ts'],
 ['backend/src/auth.ts','backend/src/shared/auth.ts'],
 ['backend/src/prisma.ts','backend/src/shared/prisma.ts'],
 ['backend/src/index.ts','backend/src/games/di-tat-don-dau/server.ts'],
])
for(const file of ['App.css','index.css','landing.css','public-fields.css','public-home.css','public-pages.css','readable-ui.css'])exact.set('frontend/src/'+file,'frontend/src/games/di-tat-don-dau/styles/'+file)
const slash=p=>p.replaceAll('\\','/'),safe=p=>{const a=path.resolve(root,p);if(!a.startsWith(root+path.sep))throw Error('Path outside workspace: '+a);return a}
const destination=p=>exact.get(p)||(()=>{const f=folders.find(([from])=>p.startsWith(from+'/'));return f?f[1]+p.slice(f[0].length):p})()
const walk=dir=>fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?['node_modules','.git','dist','.agents','design-preview','public'].includes(e.name)?[]:walk(path.join(dir,e.name)):[path.join(dir,e.name)]):[]
const files=[...walk(path.join(root,'frontend/src')),...walk(path.join(root,'backend/src')),...walk(path.join(root,'backend/prisma')),...walk(path.join(root,'scripts')),...walk(path.join(root,'shared'))]
const planned=[]
for(const file of files){
 if(!/\.(tsx?|css|cjs|mjs|py|json)$/.test(file)||file===__filename)continue
 const old=slash(path.relative(root,file)),next=destination(old);let text=read(file)
 if(/\.(tsx?|css|cjs|mjs)$/.test(file))text=text.replace(/(['"])(\.{1,2}\/[^'"\r\n]+)\1/g,(all,quote,spec)=>{
  const target=path.resolve(path.dirname(file),spec)
  const found=['','.ts','.tsx','.json','.css','/index.ts','/index.tsx'].find(ext=>fs.existsSync(target+ext)&&fs.statSync(target+ext).isFile())
  if(found===undefined)return all
  const targetRelative=slash(path.relative(root,target+found)),newTarget=destination(targetRelative)
  let result=slash(path.relative(path.dirname(safe(next)),safe(newTarget)))
  if(found&&!found.startsWith('/'))result=result.slice(0,-found.length)
  if(!result.startsWith('.'))result='./'+result
  return quote+result+quote
 })
 // Tooling generators use explicit repo-relative source paths, too.
 if(old.startsWith('scripts/')){
  for(const[from,to]of [...exact.entries()].sort((a,b)=>b[0].length-a[0].length))text=text.replaceAll(from,to)
  for(const[from,to]of folders)text=text.replaceAll(from,to)
 }
 planned.push({old,next,text})
}
if(!process.argv.includes('--apply')){console.log(JSON.stringify(planned.filter(p=>p.old!==p.next).map(p=>({from:p.old,to:p.next})),null,2));process.exit()}
for(const p of planned)if(p.old!==p.next&&fs.existsSync(safe(p.next)))throw Error('Destination exists: '+p.next)
for(const p of planned){
 const from=safe(p.old),to=safe(p.next)
 if(from!==to){fs.mkdirSync(path.dirname(to),{recursive:true});fs.renameSync(from,to)}
 if(read(to)!==p.text)fs.writeFileSync(to,p.text)
}
fs.writeFileSync(safe('backend/src/index.ts'),"// Deployment entry point; the factory game owns its server.\nimport './games/di-tat-don-dau/server'\n")
console.log('Separated '+planned.filter(p=>p.old!==p.next).length+' game-owned files; shared modules retained separately.')
