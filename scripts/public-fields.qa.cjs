// Browser QA of the production bundle. All requests are fulfilled from local files/fixtures.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'design-preview/public-fields/'+(process.env.PUBLIC_QA_OUTPUT||'verification'));
fs.mkdirSync(out, { recursive: true });
const letters = require('../frontend/src/lib/public-letter-paths.json');
const catalog = require('../frontend/src/lib/wiki-catalog.json');
const required = new Set((JSON.stringify(catalog) + 'ĂăĐđĨĩŨũƠơƯư' + Array.from({length: 90}, (_, i) => String.fromCodePoint(7840 + i)).join('')).normalize('NFC'));
for (const face of Object.values(letters)) {
  for (const char of required) if (!/\s/.test(char)) {
    assert(face[char] && face[char][0] > 0 && face[char][1], `Missing outline for ${char}`);
  }
  assert.notEqual(face.a[1], face.A[1]);
  assert.equal(new Set(Array.from('0123456789', n => face[n][0])).size, 1, 'SVG digits must have equal advance widths');
}
let browser;
(async () => {
  browser = await chromium.launch({headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH});
  const report = { widths: [], errors: [], missing: [], fontCoverage: required.size, checks: [] };
  for (const width of [390, 768, 1440]) {
    const context = await browser.newContext({viewport: {width, height: width === 390 ? 844 : 900}});
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname !== 'game.test') return route.abort();
      if (url.pathname === '/api/setup') return route.fulfill({json: {yearMinSeconds: 5}});
      if (url.pathname.startsWith('/api/')) return route.fulfill({json: {ok: true}});
      if (url.pathname === '/health') return route.fulfill({json: {ok: true}});
      if (url.pathname === '/config.js') return route.fulfill({contentType: 'application/javascript', body: 'window.__APP_CONFIG__={};'});
      let file = path.join(root, 'frontend/dist', decodeURIComponent(url.pathname));
      if (!path.extname(file)) file = path.join(root, 'frontend/dist/index.html');
      if (!fs.existsSync(file)) { report.missing.push(url.pathname); return route.fulfill({status: 404}); }
      return route.fulfill({body: fs.readFileSync(file), contentType: ({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.ttf':'font/ttf'})[path.extname(file)] || 'application/octet-stream'});
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(String(error)));
    const noOverflow = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow at ${width}: ${page.url()}`);
    const checkFields = async () => {
      await page.evaluate(() => Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))));
      const fields = page.locator('.wiki-layout input:visible,.wiki-layout select:visible');
      for (let i = 0; i < await fields.count(); i++) {
        const field = fields.nth(i);
        const before = await field.boundingBox();
        const css = await field.evaluate(el => {const s=getComputedStyle(el); return {frame:s.borderImageSource,font:s.fontFamily,height:el.getBoundingClientRect().height,color:s.color};});
        assert(css.frame.includes('field-paper-normal.svg'), `Missing SVG frame: ${await field.getAttribute('aria-label')}`);
        assert(css.font.includes('Public UI'));
        assert(css.height >= 48);
        await field.focus();
        assert((await field.evaluate(el => getComputedStyle(el).borderImageSource)).includes('field-paper-focus.svg'));
        const after = await field.boundingBox();
        assert.equal(after.width, before.width, 'Focus must not change field width');
        assert.equal(after.height, before.height, 'Focus must not change field height');
        await field.blur();
      }
      await noOverflow();
    };
    for (const section of ['start','updates','industries','upgrades','production','events','risk']) {
      await page.goto(`http://game.test/wiki?section=${section}&industry=chip-ban-dan`);
      await page.locator('.wiki-heading').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert(await page.evaluate(() => document.fonts.check('16px "Public UI"', 'Tiếng Việt 0123456789')));
      await checkFields();
      if (section === 'industries') {
        const search = page.getByRole('searchbox', {name: 'Tìm ngành', exact: true});
        await search.fill('Sản xuất chip bán dẫn'.normalize('NFD'));
        assert.equal(await page.locator('.wiki-industry-row').count(), 1, 'Vietnamese IME/decomposed text must still filter');
        await search.fill('');
        await page.getByLabel('Nhóm ngành', {exact: true}).selectOption({index: 1});
        await page.getByLabel('Nhóm ngành', {exact: true}).selectOption('');
      }
      if (section === 'upgrades') {
        await page.locator('.wiki-industry-selector select').selectOption({index: 2});
        await checkFields();
      }
      await page.screenshot({path: path.join(out, `${width}-${section}.png`)});
      if (section === 'events') {
        await page.getByLabel('Loại sự kiện', {exact: true}).selectOption('industry');
        await page.locator('.wiki-event-row').first().click();
        await page.getByLabel('Biến thể ngữ cảnh', {exact: true}).selectOption({index: 1});
        await checkFields();
        await page.locator('.wiki-event-detail').screenshot({path: path.join(out, `${width}-event-context.png`)});
      }
      report.checks.push(`${width}: ${section}, SVG normal/focus fields, no focus resize, no horizontal overflow`);
    }
    await page.goto('http://game.test/');
    await page.evaluate(() => document.fonts.ready);
    await noOverflow();
    await page.screenshot({path: path.join(out, `${width}-landing.png`)});
    const metrics = await page.evaluate(letters => {
      // Proof sheet only, never shipped in the application.
      const proof = document.createElement('div'); proof.id='font-proof';
      proof.style.cssText='position:relative;background:#fff0d2;color:#48291a;padding:20px;font-family:"Public UI";font-size:22px;line-height:1.6;overflow-wrap:anywhere';
      for (const weight of ['regular','bold']) {
        const row=document.createElement('div'); row.style.fontWeight=weight==='bold'?'700':'400';
        row.textContent='Tiếng Việt: Sản xuất · Tất cả nhóm ngành · Đầu tư · Ắ Ằ Ẳ Ẵ Ặ Ấ Ầ Ẩ Ẫ Ậ Ế Ề Ể Ễ Ệ Ố Ồ Ổ Ỗ Ộ Ớ Ờ Ở Ỡ Ợ Ứ Ừ Ử Ữ Ự Ỳ Ỷ Ỹ Ỵ';
        proof.append(row);
        const digits = document.createElementNS('http://www.w3.org/2000/svg','svg');
        digits.setAttribute('viewBox','0 0 440 86'); digits.style.cssText='width:100%;max-width:440px;display:block;background:#eed8b5';
        let x=0;
        for (const n of '0123456789') {const p=document.createElementNS(digits.namespaceURI,'path');p.setAttribute('d',letters[weight][n][1]);p.setAttribute('transform',`translate(${x} 0)`);digits.append(p);x+=letters[weight][n][0];}
        proof.append(digits);
      }
      document.body.append(proof);
      const c=document.createElement('canvas').getContext('2d');c.font='24px "Public UI"';
      const numeric=['111111','888888','000000'].map(n=>c.measureText(n).width);
      const baseline=[...proof.querySelectorAll('svg')].map(svg=>[...svg.children].map(p=>{const b=p.getBBox();return b.y+b.height}));
      return {numeric,baseline};
    }, letters);
    assert.equal(new Set(metrics.numeric).size, 1, 'Native tabular digits must not shift width');
    for (const bounds of metrics.baseline) assert(Math.max(...bounds)-Math.min(...bounds) < 2, 'SVG digits must share a lining baseline');
    await page.locator('#font-proof').screenshot({path: path.join(out, `${width}-font-proof.png`)});
    report.widths.push({width,metrics});
    await context.close();
  }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.missing, []);
  fs.writeFileSync(path.join(out,'report.json'), JSON.stringify(report,null,2));
  console.log(`Public fields/fonts passed at ${report.widths.map(x=>x.width).join(', ')}px. ${report.checks.length} section checks. ${out}`);
})().catch(error => { console.error(error); process.exitCode=1; }).finally(async () => { await browser?.close(); });
