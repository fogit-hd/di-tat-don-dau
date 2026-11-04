// Reproducible SVG export from the project's licensed, Vietnamese-complete glyph outlines.
// No font engine or extra app dependency is needed. All visible SVGs contain paths only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),ts=require('typescript')
const root=path.resolve(__dirname,'..'),out=path.join(root,'frontend/public/assets/duck-race/lettering-v4')
fs.mkdirSync(out,{recursive:true})
const faces=JSON.parse(fs.readFileSync(path.join(root,'frontend/src/shared/ui/public-letter-paths.json'),'utf8'))
const vocab=new Set('A B C D E F W S Space Shift Phòng Vịt của Câu Lăn điểm bước đúng HẠNG Thẻ may mắn Quỹ dự trữ Nhật ký cuộc đua của bạn Mã phòng Tên người chơi Bạn tên là gì? D1A2B3C'.split(/\s+/))
const sharedManifest=path.join(root,'frontend/src/shared/ui/lettering.manifest.json')
if(fs.existsSync(sharedManifest))for(const word of Object.keys(JSON.parse(fs.readFileSync(sharedManifest,'utf8'))))vocab.add(word)
function collect(copy){for(const word of copy.normalize('NFC').split(/\s+/))if(word)vocab.add(word)}
const sources=['frontend/src/shared/GameHub.tsx','frontend/src/shared/ui/GameWebBar.tsx','frontend/src/shared/auth/GoogleHostLogin.tsx','shared/duck-race.ts']
for(const file of fs.readdirSync(path.join(root,'frontend/src/games/duck-race')))if(file.endsWith('.tsx'))sources.push('frontend/src/games/duck-race/'+file)
for(const relative of sources){
 const file=path.join(root,relative),ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,relative.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS)
 function visit(node){if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)||ts.isTemplateHead(node)||ts.isTemplateMiddle(node)||ts.isTemplateTail(node))collect(node.text);ts.forEachChild(node,visit)}visit(ast)
}
const missing=new Set(),glyphDefinitions=new Map()
function geometry(copy,weight='bold',linked=false){
 let width=0,paths=''
 for(const char of [...copy.normalize('NFC')]){
  const shape=faces[weight][char]
  if(!shape){missing.add(char);continue}
  if(shape[1]){
   const id=`g${weight[0]}${char.codePointAt(0).toString(16)}`
   if(linked){glyphDefinitions.set(id,`<path id="${id}" d="${shape[1]}"/>`);paths+=`<use href="#${id}" x="${width.toFixed(2)}"/>`}
   else paths+=`<path transform="translate(${width.toFixed(2)} 0)" d="${shape[1]}"/>`
  }
  width+=shape[0]
 }
 return{width:+width.toFixed(2),paths}
}
const manifest={},symbols=[]
for(const word of [...vocab].sort()){
 const id='w'+crypto.createHash('sha1').update(word).digest('hex').slice(0,12),regular=geometry(word,'regular',true),bold=geometry(word,'bold',true)
 manifest[word]={width:Math.max(regular.width,bold.width,1),regular:id+'r',bold:id+'b'}
 for(const[variant,shape]of[['r',regular],['b',bold]])symbols.push(`<symbol id="${id+variant}" viewBox="0 0 ${manifest[word].width} 86">${shape.paths}</symbol>`)
}
fs.writeFileSync(path.join(out,'words.svg'),`<svg xmlns="http://www.w3.org/2000/svg"><desc>Vietnamese fixed UI copy, exported entirely as vector paths. No font required.</desc><defs>${[...glyphDefinitions.values()].join('')}${symbols.join('')}</defs></svg>`)
fs.writeFileSync(path.join(root,'frontend/src/games/duck-race/lettering.manifest.json'),JSON.stringify(manifest))
function lockup(name,lines,width,height){
 if(process.argv.includes('--words-only'))return
 const content=lines.map(([copy,x,y,scale,fill])=>{const shape=geometry(copy).paths;return`<g transform="translate(${x} ${y}) scale(${scale})" stroke-linejoin="round"><g transform="translate(0 5)" fill="#4e2e10" stroke="#4e2e10" stroke-width="5">${shape}</g><g fill="url(#${fill})" stroke="#182e22" stroke-width="4" paint-order="stroke fill">${shape}</g><g fill="none" stroke="#fff2bd" stroke-opacity=".35" stroke-width=".5">${shape}</g></g>`}).join('')
 fs.writeFileSync(path.join(out,name+'.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="cream" x2="0" y2="1"><stop stop-color="#fffbe7"/><stop offset="1" stop-color="#f2da96"/></linearGradient><linearGradient id="gold" x2="0" y2="1"><stop stop-color="#fff2a6"/><stop offset=".45" stop-color="#ffcf51"/><stop offset="1" stop-color="#d58018"/></linearGradient></defs>${content}</svg>`)
}
lockup('hero-title',[['Biết đáp án.',10,0,1.18,'cream'],['Chọn thời điểm',10,93,1,'gold'],['bứt phá.',10,178,1.35,'gold']],590,295)
lockup('brand-title',[['QUIZ DUCK',5,0,.6,'cream'],['RACE',5,43,.92,'gold']],260,128)
lockup('portal-title',[['CHỌN TRÒ CHƠI',10,0,1,'cream']],620,98)
lockup('start-label',[['XUẤT PHÁT',5,0,1,'cream']],430,94)
lockup('finish-label',[['ĐÍCH',5,0,1,'cream']],190,94)
// Code-only punctuation is collected too. Missing glyphs in real copy are caught by UI QA.
console.log(JSON.stringify({words:vocab.size,missing:[...missing],spriteBytes:fs.statSync(path.join(out,'words.svg')).size}))

fs.mkdirSync(path.join(root,'frontend/public/assets/shared/lettering'),{recursive:true})
fs.copyFileSync(path.join(out,'words.svg'),path.join(root,'frontend/public/assets/shared/lettering/words.svg'))
fs.copyFileSync(path.join(root,'frontend/src/games/duck-race/lettering.manifest.json'),path.join(root,'frontend/src/shared/ui/lettering.manifest.json'))
