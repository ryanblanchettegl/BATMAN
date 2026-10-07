/* Company logos and the logo creator: every company shows its own icon, and the creator in the World Editor builds a
   new one from parts, refuses a clash or letters that cannot be read, and saves only when asked.
   Run: NODE_PATH=<dir containing playwright> node app/tests/logos.js   (MODES=desk,tablet,tv) */
const { open, go, overflow, shot, state } = require('./helper');
const MODES = (process.env.MODES || 'desk,tablet,tv').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const txt = (page, sel) => page.$eval(sel, e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => '');
const has = async (page, sel) => !!(await page.$(sel));
/* what a board of lights shows: how many are lit, and the colours */
const lit = (page, sel) => page.$eval(sel, c => { const mk = (c.getAttribute('data-sig') || '').split('@')[0]; const W = +c.getAttribute('data-w'), H = +c.getAttribute('data-h'), d = +c.getAttribute('data-dot'), x = c.getContext('2d'), out = []; for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) { const q = x.getImageData(Math.floor(xx * d + d / 2), Math.floor(yy * d + d / 2), 1, 1).data; out.push(q[0] + q[1] + q[2] > 110 ? [q[0] >> 6, q[1] >> 6, q[2] >> 6].join('') : '.'); } return { W, H, d, mk, sig: out.join(','), n: out.filter(v => v !== '.').length, label: c.getAttribute('aria-label') }; });

async function game(mode) {
  const { browser, page, errs } = await open({ mode, promo: 'whw' });
  try {
    ok(mode, 'the menu bar shows your company’s letters on its own colour', await page.$eval('.menu .ttl [data-t="menu-logo"]', e => e.textContent === 'WHW' && getComputedStyle(e).backgroundColor === 'rgb(85, 85, 255)' && getComputedStyle(e).color === 'rgb(255, 255, 255)' && /World History Wrestling/.test(e.getAttribute('aria-label'))));
    const cards = [];
    for (const id of await state(page, S => S.order)) {
      await page.evaluate(id => { const D = window.EWF_DEBUG; D.ui.cards.length = 0; D.ui.cards.push({ k: 'promo', id }); D.render(); }, id);
      await page.waitForSelector('[data-t="card-logo"][data-sig]');
      cards.push(Object.assign({ id }, await lit(page, '[data-t="card-logo"]')));
    }
    await page.evaluate(() => { const D = window.EWF_DEBUG; D.ui.cards.length = 0; D.render(); });
    ok(mode, 'every company’s card shows its logo in lights, 40 by 32', cards.length === 9 && cards.every(c => c.W === 40 && c.H === 32 && c.n > 150 && /^The logo of /.test(c.label)), cards.map(c => c.id + ':' + c.n).join(' '));
    ok(mode, 'and no two look alike', new Set(cards.map(c => c.sig)).size === 9);
    const o = await overflow(page); ok(mode, 'the page with the logo on the menu fits', !o, o);
    ok(mode, 'no errors in the game', !errs.length, errs.join(' | '));
  } catch (e) { ok(mode, 'the game part ran to the end', false, e.message.split('\n')[0]); }
  await browser.close();
}
async function editor(mode) {
  const { browser, page, errs } = await open({ mode, promo: null });
  try {
    await page.click('[data-t="scr"][data-v="select"]');
    await page.waitForSelector('[data-t="pick-logo"][data-sig]');
    ok(mode, 'the company picker shows the logo of the company under the highlight', (await lit(page, '[data-t="pick-logo"]')).n > 150);
    await page.keyboard.press('Escape');
    await page.click('[data-t="editor"]'); await page.waitForSelector('.edpage');
    await page.click('[data-t="ed-new-copy"]');
    await page.click('[data-t="ed-tab"][data-v="companies"]');
    const back = await page.$('.edback [data-t="ed-list"]'); if (back && await back.isVisible()) await back.click();
    await page.click('[data-t="ed-pick"][data-v="whw"]').catch(async () => { const L = await page.$$('[data-t="ed-pick"]'); await L[0].click(); });
    await page.waitForSelector('[data-t="ed-logo"][data-sig]');
    const before = await lit(page, '[data-t="ed-logo"]');
    ok(mode, 'a company’s page in the editor shows its logo, and says it is the model’s own', before.n > 150 && /logo its model gives it/.test(await txt(page, '.panel:has([data-t="ed-logo"])')) && !(await has(page, '[data-t="ed-logo-reset"]')));
    await page.click('[data-t="ed-logo-open"]'); await page.waitForSelector('[data-t="logo-preview"][data-sig]');
    ok(mode, 'Change the logo opens the creator, with the logo as it stands', /The logo of WHW/.test(await txt(page, '.win .wt span')) && (await lit(page, '[data-t="logo-preview"]')).mk === before.mk && /free to use/.test(await txt(page, '[data-t="logo-check"]')));
    ok(mode, 'the parts are all there: 19 shapes, 6 letter styles, 4 layouts, 3 finishes, 5 extras, 16 colours three times, 6 ideas', (await page.$$('[data-t="logo-sh"]')).length === 19 && (await page.$$('[data-t="logo-st"]')).length === 6 && (await page.$$('[data-t="logo-lay"]')).length === 4 && (await page.$$('[data-t="logo-fin"]')).length === 3 && (await page.$$('[data-t="logo-ex"]')).length === 5 && (await page.$$('[data-t="logo-c1"]')).length === 16 && (await page.$$('[data-t="logo-c2"]')).length === 16 && (await page.$$('[data-t="logo-c3"]')).length === 16 && (await page.$$('[data-t="logo-idea"]')).length === 6);
    ok(mode, 'every control in the creator is a real button or box with a name', await page.$$eval('.win button, .win input', L => L.every(e => e.getAttribute('data-t')) && L.filter(e => e.tagName === 'BUTTON').every(e => (e.getAttribute('aria-label') || e.innerText).trim().length > 0)));
    ok(mode, 'the creator fits the window without scrolling', await page.$eval('.win .wb', e => e.scrollHeight - e.clientHeight <= 1) && await page.$eval('.win', e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; }), await page.$eval('.win .wb', e => (e.scrollHeight - e.clientHeight) + 'px over'));
    if (mode === 'desk') await shot(page, 'logo-creator');
    /* each choice redraws the logo */
    let last = before.sig; const step = async (sel, what) => { await page.click(sel); await page.waitForTimeout(60); const s = (await lit(page, '[data-t="logo-preview"]')).sig, ch = s !== last; last = s; ok(mode, what + ' redraws the logo', ch); };
    await step('[data-t="logo-sh"][data-v="crown"]', 'a new shape'); await step('[data-t="logo-c1"][data-v="#aa0000"]', 'a new shape colour'); await step('[data-t="logo-st"][data-v="wide"]', 'a letter style');
    await step('[data-t="logo-lay"][data-v="stair"]', 'a layout'); await step('[data-t="logo-fin"][data-v="stripe"]', 'a finish'); await step('[data-t="logo-ex"][data-v="stars"]', 'an extra'); await step('[data-t="logo-c2"][data-v="#ffffff"]', 'a trim colour');
    ok(mode, 'the picked parts are marked as picked', await page.$eval('[data-t="logo-sh"][data-v="crown"]', e => e.getAttribute('aria-pressed') === 'true') && await page.$eval('[data-t="logo-c1"][data-v="#aa0000"]', e => e.classList.contains('on')));
    /* letters that cannot be read are moved to the nearest colour that can */
    await page.click('[data-t="logo-c3"][data-v="#aa0000"]'); await page.waitForTimeout(60);
    ok(mode, 'letters the colour of the shape are not allowed: the nearest colour that shows is used, and it says so', !(await page.$eval('[data-t="logo-c3"][data-v="#aa0000"]', e => e.classList.contains('on'))) && /so they can be read/.test(await txt(page, '[data-t="logo-note"]')) && /free to use/.test(await txt(page, '[data-t="logo-check"]')), await txt(page, '[data-t="logo-note"]'));
    /* undo, and the model's own */
    const s1 = (await lit(page, '[data-t="logo-preview"]')).sig; await page.click('[data-t="logo-sh"][data-v="globe"]'); await page.click('[data-t="logo-undo"]'); await page.waitForTimeout(60);
    ok(mode, 'Undo takes back the last choice', (await lit(page, '[data-t="logo-preview"]')).sig === s1);
    /* a second line */
    await page.click('[data-t="logo-ex"][data-v="tag"]'); await page.fill('[data-t="logo-tag"]', 'ROME'); await page.waitForTimeout(80);
    ok(mode, 'a second line can be typed under the letters', (await lit(page, '[data-t="logo-preview"]')).sig !== s1 && await page.$eval('[data-t="logo-tag"]', e => e.value === 'ROME'));
    /* ideas */
    const i0 = (await lit(page, '[data-t="logo-idea"][data-v="0"] canvas')).sig; await page.click('[data-t="logo-shuffle"]'); await page.waitForTimeout(80);
    ok(mode, 'Shuffle gives six more ideas', (await lit(page, '[data-t="logo-idea"][data-v="0"] canvas')).sig !== i0 && (await page.$$('[data-t="logo-idea"]')).length === 6);
    await page.click('[data-t="logo-idea"][data-v="2"]'); await page.waitForTimeout(80);
    const want = await lit(page, '[data-t="logo-preview"]');
    ok(mode, 'pressing an idea takes it', want.mk === (await lit(page, '[data-t="logo-idea"][data-v="2"] canvas')).mk && want.n > 80);
    /* nothing is saved until Save is pressed */
    ok(mode, 'nothing is kept until Save the logo is pressed', await page.evaluate(() => { const u = JSON.parse(localStorage.getItem('ewf9000-universes') || '{}'); return Object.keys(u).every(k => !u[k].promotions.some(p => p.logo)); }));
    await page.click('[data-t="logo-save"]'); await page.waitForSelector('.win', { state: 'detached' });
    await page.waitForTimeout(700);
    ok(mode, 'Save closes the creator, the company’s page shows the new logo, and it is stored with the world', (await lit(page, '[data-t="ed-logo"]')).mk === want.mk && /has a new logo/.test(await txt(page, '.ednote')) && await has(page, '[data-t="ed-logo-reset"]') && await page.evaluate(() => { const u = JSON.parse(localStorage.getItem('ewf9000-universes') || '{}'); return Object.keys(u).some(k => u[k].promotions.some(p => p.id === 'whw' && p.logo && p.logo.l === 'WHW')); }));
    /* a clash: give PDW the same letters and the same logo */
    const mk = await page.evaluate(() => { const u = JSON.parse(localStorage.getItem('ewf9000-universes') || '{}'), k = Object.keys(u)[0]; return u[k].promotions.find(p => p.id === 'whw').logo; });
    ok(mode, 'the engine refuses the same logo for a second company', await page.evaluate(m => { const E = window.GP, u = JSON.parse(localStorage.getItem('ewf9000-universes') || '{}'), k = Object.keys(u)[0]; return !E.edSetLogo(u[k], 'pdw', m).ok; }, mk));
    /* back to the model's own */
    await page.click('[data-t="ed-logo-reset"]'); await page.waitForTimeout(300);
    ok(mode, 'Back to the model’s own puts the first logo back', (await lit(page, '[data-t="ed-logo"]')).sig === before.sig && !(await has(page, '[data-t="ed-logo-reset"]')));
    /* Esc leaves without saving */
    await page.click('[data-t="ed-logo-open"]'); await page.waitForSelector('[data-t="logo-preview"][data-sig]'); await page.click('[data-t="logo-sh"][data-v="flame"]'); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    ok(mode, 'Esc closes the creator and keeps nothing', !(await has(page, '.win')) && (await lit(page, '[data-t="ed-logo"]')).sig === before.sig);
    const o = await overflow(page); ok(mode, 'the editor page fits', !o, o);
    ok(mode, 'no errors in the editor', !errs.length, errs.join(' | '));
  } catch (e) { ok(mode, 'the editor part ran to the end', false, e.message.split('\n')[0]); await shot(page, 'logos-fail-' + mode, true).catch(() => { }); }
  await browser.close();
}
(async () => {
  for (const m of MODES) { await game(m); await editor(m); }
  console.log(fails.length ? '\nFAILED: ' + fails.length + '\n' + fails.join('\n') : '\nlogos: all passed');
  process.exit(fails.length ? 1 : 0);
})();
