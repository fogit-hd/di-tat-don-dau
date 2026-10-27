// Backend data is authoritative; each Docker build has its own local JSON copy.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=path.join(root,'backend/src/game/company-events.data.json');
const rows=JSON.parse(fs.readFileSync(source,'utf8'));
const folder=path.join(root,'frontend/public/assets/ui/company-events-v1');
const manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'),'utf8'));
const escape=text=>text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
for(const id of [...rows.map(row=>row.id),'gen-lop-nghe']){
  const entry=manifest.events[id];
  if(!entry||!/^[a-z0-9-]+$/.test(id)||!/^[a-z0-9-]+\.webp$/.test(entry.source))throw Error(`Missing approved artwork: ${id}`);
  const title=rows.find(row=>row.id===id)?.title??entry.title;
  const data=fs.readFileSync(path.join(root,'frontend/public/assets/ui/static-events-v3',entry.source)).toString('base64');
  fs.writeFileSync(path.join(folder,`${id}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256"><title>${escape(title)}</title><desc>Minh họa nét vẽ tay đồng bộ bộ sự kiện đã duyệt.</desc><image width="256" height="256" preserveAspectRatio="xMidYMid meet" href="data:image/webp;base64,${data}"/></svg>`);
}
fs.copyFileSync(source,path.join(root,'frontend/src/lib/company-events.json'));
console.log(`Synchronized ${rows.length} events and ${rows.length+1} self-contained SVG illustrations.`);
