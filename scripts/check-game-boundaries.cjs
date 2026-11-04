const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const root=path.resolve(__dirname,'..')
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):/\.(tsx?|css)$/.test(e.name)?[path.join(dir,e.name)]:[])}
let count=0
for(const [source,forbidden] of [
 ['frontend/src/games/duck-race',/frontend\/src\/games\/di-tat-don-dau\//],
 ['backend/src/games/duck-race',/backend\/src\/games\/di-tat-don-dau\//],
 ['frontend/src/games/di-tat-don-dau',/frontend\/src\/games\/duck-race\//],
 ['backend/src/games/di-tat-don-dau',/backend\/src\/games\/duck-race\//],
 ['frontend/src/shared',/frontend\/src\/games\//],
 ['backend/src/shared',/backend\/src\/games\//],
])for(const file of files(path.join(root,source))){
 const text=fs.readFileSync(file,'utf8')
 for(const match of text.matchAll(/(?:from\s*|import\s*\(|import\s*)['"]([^'"]+)['"]/g)){
  if(!match[1].startsWith('.'))continue
  const target=path.resolve(path.dirname(file),match[1]).replace(/\\/g,'/')
  assert.ok(!forbidden.test(target),path.relative(root,file)+' imports the other game: '+match[1]);count++
 }
}
// Render/application lifecycle remains inside each game, not a shared singleton.
for(const file of files(path.join(root,'frontend/src/shared'))){
 const text=fs.readFileSync(file,'utf8')
 assert.ok(!/new\s+Application\s*\(|Ticker\.shared|new\s+Server\s*\(/.test(text),'Shared renderer/server instance in '+file)
}
console.log(`PASS: ${count} local imports; no cross-game source imports or shared renderer instances.`)
