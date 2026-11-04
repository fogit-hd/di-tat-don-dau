// One-off migration of fixed JSX copy. Only text nodes change; handlers stay byte-for-byte.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript')
const root=path.resolve(__dirname,'..')
for(const relative of ['frontend/src/games/duck-race/DuckRace.tsx','frontend/src/games/di-tat-don-dau/components/GameHub.tsx']){
 const file=path.join(root,relative),source=fs.readFileSync(file,'utf8')
 if(source.includes('import { StaticArt as S }'))continue
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[]
 const bold=node=>{for(let p=node.parent;p;p=p.parent){if(ts.isJsxElement(p)&&/^(h[1-6]|strong|b|button|label|legend)$/.test(p.openingElement.tagName.getText(ast)))return true}return false}
 const art=(text,node)=>`<S text=${JSON.stringify(text)}${bold(node)?' bold':''}/>`
 function visit(node){
  if(ts.isJsxText(node)){
   const raw=node.getFullText(ast),copy=raw.replace(/\s+/g,' ').trim()
   if(copy)edits.push({start:node.pos,end:node.end,text:(/^\s/.test(raw)?' ':'')+art(copy,node)+(/\s$/.test(raw)?' ':'')})
  }else if(ts.isStringLiteral(node)&&node.text.trim()){
   let p=node,ok=true
   while(p.parent&&ts.isConditionalExpression(p.parent)){if(p===p.parent.condition){ok=false;break}p=p.parent}
   if(ok&&p.parent&&ts.isJsxExpression(p.parent)&&!ts.isJsxAttribute(p.parent.parent))edits.push({start:node.getStart(ast),end:node.end,text:art(node.text,node)})
  }
  ts.forEachChild(node,visit)
 }
 visit(ast)
 let result=source;for(const edit of edits.sort((a,b)=>b.start-a.start))result=result.slice(0,edit.start)+edit.text+result.slice(edit.end)
 result=`import { StaticArt as S } from '${relative.includes('/components/')?'../duck-race/StaticArt':'./StaticArt'}'\n`+result
 fs.writeFileSync(file,result);console.log(relative,edits.length,'fixed text replacements')
}
