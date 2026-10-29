const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const glyphs=JSON.parse(fs.readFileSync(path.join(root,'frontend/src/lib/public-letter-paths.json'),'utf8'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'frontend/src/lib/wiki-catalog.json'),'utf8'));
const source=['StartScreen.tsx','WikiPage.tsx','ArtText.tsx'].map(name=>fs.readFileSync(path.join(root,'frontend/src/components',name),'utf8')).join('');
const required=new Set((JSON.stringify(catalog)+source+'Đi Tắt Đón Đầu Cách chơi Sự kiện Đăng nhập Đăng xuất Tạo phòng Xây doanh nghiệp. Chốt vận mệnh. Ươ ưƠ').normalize('NFC'));
for(const weight of ['regular','bold']){
 assert.notEqual(glyphs[weight].a[1],glyphs[weight].A[1],'a/A outlines must be distinct');
 for(const char of required){if(/\s/.test(char))continue;assert(glyphs[weight][char],`Missing ${weight} character: ${char} U+${char.codePointAt(0).toString(16)}`);const [width,outline]=glyphs[weight][char];assert(Number.isFinite(width)&&width>0);assert.equal(typeof outline,'string');assert(outline.length>0,`Empty outline for ${char}`)}
}
console.log(`Public lettering: ${required.size} required characters checked, both weights; Vietnamese and letter case preserved.`);
