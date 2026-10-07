/* The window kit (the new look): every part on the kit sheet fits one screen at every size, nothing is cut off inside a
   window, every control has a name and works from the keyboard, and a pop-up wears the same look.
   Run: NODE_PATH=<dir containing playwright> node app/tests/kit.js */
const { open, go, overflow, shot, fits } = require('./helper');
const SIZES = [['desk', 1280, 720], ['desk', 1280, 860], ['desk', 1920, 1080], ['tablet', 1024, 768], ['tv', 1920, 1080]];
const fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(15), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
const rgb = (page, sel, prop) => page.$eval(sel, (e, p) => getComputedStyle(e)[p], prop);

async function run(mode, w, h) {
  const id = mode + ' ' + w + 'x' + h, { browser, page, errs } = await open({ mode, promo: 'whw' });
  try {
    await page.setViewportSize({ width: w, height: h });
    await go(page, 'kit');
    await page.waitForSelector('[data-t="kit"]');
    const f = await fits(page), o = await overflow(page);
    ok(id, 'the kit sheet fits one screen', !f && !o, f || o);
    ok(id, 'six windows, each with a title bar and a body', await page.$$eval('.wn', L => L.length === 6 && L.every(x => x.querySelector(':scope > .ttl h2') && x.querySelector(':scope > .bd'))));
    ok(id, 'no window runs into another, and every shadow has room', await page.evaluate(() => { const L = [...document.querySelectorAll('.wn')].map(e => e.getBoundingClientRect()), D = document.querySelector('.desktop').getBoundingClientRect(); return L.every((a, i) => a.right <= D.right - 4 && a.bottom <= D.bottom - 4 && L.every((b, j) => i === j || a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top)); }));
    ok(id, 'no title is cut short', await page.$$eval('.wn > .ttl h2', L => L.every(e => e.scrollWidth <= e.clientWidth + 1)));
    ok(id, 'a window is grey with black text, its bar blue with a yellow title', (await rgb(page, '[data-t="kit-list"]', 'backgroundColor')) === 'rgb(170, 170, 170)' && (await rgb(page, '[data-t="kit-list"] > .bd', 'color')) === 'rgb(0, 0, 0)' && (await rgb(page, '[data-t="kit-list"] > .ttl', 'backgroundColor')) === 'rgb(0, 0, 170)' && (await rgb(page, '[data-t="kit-list"] > .ttl h2', 'color')) === 'rgb(255, 255, 85)');
    ok(id, 'a window that wants attention has a red bar, a celebration a gold one', (await rgb(page, '[data-t="kit-hot"] > .ttl', 'backgroundColor')) === 'rgb(170, 0, 0)' && (await rgb(page, '[data-t="kit-gold"] > .ttl', 'backgroundColor')) === 'rgb(128, 96, 0)');
    ok(id, 'buttons: green with white text, yellow, grey, red', (await rgb(page, '[data-t="kit-b1"]', 'backgroundColor')) === 'rgb(0, 170, 0)' && (await rgb(page, '[data-t="kit-b1"]', 'color')) === 'rgb(255, 255, 255)' && (await rgb(page, '[data-t="kit-b2"]', 'backgroundColor')) === 'rgb(255, 255, 85)' && (await rgb(page, '[data-t="kit-b3"]', 'backgroundColor')) === 'rgb(85, 85, 85)' && (await rgb(page, '[data-t="kit-b4"]', 'backgroundColor')) === 'rgb(170, 0, 0)');
    ok(id, 'a button that costs something says so at its right end', /1 point$/.test((await page.$eval('[data-t="kit-talk"]', e => e.textContent)).trim()));
    ok(id, 'a tag in a window is a filled box, not a word in brackets', await page.$eval('[data-t="kit-tags"] .tag.bad', e => getComputedStyle(e).backgroundColor === 'rgb(170, 0, 0)' && getComputedStyle(e, '::before').content === 'none'));
    ok(id, 'bars come ten, eight and five wide', await page.$$eval('[data-t="kit-tags"] .meter', L => L.map(e => e.textContent.length).join(',') === '10,8,5,5'));
    /* the list box */
    const rows = await page.$$('[data-t="kit-row"]');
    ok(id, 'the list box has a header and seven lines, each one line tall', rows.length === 7 && await page.evaluate(() => { const L = [...document.querySelectorAll('[data-t="kit-row"]')].map(e => e.getBoundingClientRect().height), hd = document.querySelector('.lb .hd'); return !!hd && L.every(x => Math.abs(x - L[0]) < 1.5); }));
    ok(id, 'the first line is picked and green', await page.$eval('[data-t="kit-row"]', e => e.classList.contains('sel') && getComputedStyle(e).backgroundColor === 'rgb(0, 170, 0)'));
    const second = await rows[1].getAttribute('aria-label');
    await rows[1].click();
    ok(id, 'picking a line moves the green line and fills the window beside it', await page.$$eval('[data-t="kit-row"]', L => L[1].classList.contains('sel') && !L[0].classList.contains('sel')) && (await page.$eval('[data-t="kit-person"] > .ttl h2', e => e.textContent)) === second);
    await rows[2].focus(); await page.keyboard.press('Enter');
    ok(id, 'a line is picked from the keyboard too', await page.$$eval('[data-t="kit-row"]', L => L[2].classList.contains('sel')));
    ok(id, 'the focus ring shows on a line', await page.$eval('[data-t="kit-row"]:focus', e => getComputedStyle(e).outlineStyle !== 'none').catch(() => false));
    const f2 = await fits(page); ok(id, 'it still fits with another line picked', !f2, f2);
    ok(id, 'every control on the sheet has a name', await page.$$eval('.desktop button, .desktop select, .desktop input', L => L.every(e => e.getAttribute('data-t'))));
    /* an answer bar, and the pop-up it opens */
    await page.click('[data-t="kit-ans-2"]');
    await page.waitForSelector('.win');
    ok(id, 'an answer opens its result in a pop-up', /60% chance/.test(await page.$eval('.win .wb', e => e.innerText)));
    ok(id, 'the pop-up wears the new look: a blue bar, a yellow title in the middle, a bevel', await page.evaluate(() => { const w = document.querySelector('.win'), t = w.querySelector('.wt'), s = t.querySelector('span'), c = getComputedStyle(t), b = getComputedStyle(w), tr = t.getBoundingClientRect(), sr = s.getBoundingClientRect(), r = document.createRange(); r.selectNodeContents(s); const xr = r.getBoundingClientRect(); return c.backgroundColor === 'rgb(0, 0, 170)' && c.color === 'rgb(255, 255, 85)' && b.borderTopColor === 'rgb(255, 255, 255)' && b.borderBottomColor === 'rgb(85, 85, 85)' && Math.abs((xr.left + xr.right) / 2 - (tr.left + tr.right) / 2) < tr.width * 0.06; }));
    ok(id, 'its OK button is yellow with black text (white while it holds the focus on a remote)', /rgb\(255, 255, (85|255)\)/.test(await rgb(page, '#modal-ok', 'backgroundColor')) && (await rgb(page, '#modal-ok', 'color')) === 'rgb(0, 0, 0)');
    await page.keyboard.press('Escape');
    ok(id, 'Esc closes it', !(await page.$('.win')));
    ok(id, 'a disabled answer cannot be pressed', await page.$eval('[data-t="kit-ans-4"]', e => e.disabled));
    /* lights: pictures and lettering in round lit dots on a black board */
    const boards = () => page.$$eval('.ledb canvas', L => L.map(c => { const W = +c.getAttribute('data-w'), H = +c.getAttribute('data-h'), d = +c.getAttribute('data-dot'), x = c.getContext('2d'), lit = [];
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) { const q = x.getImageData(Math.floor(xx * d + d / 2), Math.floor(yy * d + d / 2), 1, 1).data; if (q[0] + q[1] + q[2] > 150) lit.push([q[0], q[1], q[2]]); }
      const fs = parseFloat(getComputedStyle(c).fontSize), r = c.getBoundingClientRect(), box = c.parentElement, win = c.closest('.wn > .bd').getBoundingClientRect();
      return { t: c.getAttribute('data-t'), label: c.getAttribute('aria-label'), role: c.getAttribute('role'), W, H, d, cw: c.width, ch: c.height, fs, dpr: window.devicePixelRatio || 1, css: r.width, lit, bg: getComputedStyle(box).backgroundColor, inside: r.left >= win.left - 1 && r.right <= win.right + 1 && r.top >= win.top - 1 && r.bottom <= win.bottom + 1 }; }));
    let B = await boards();
    const by = t => B.filter(b => b.t === t), most = (b, f) => b.lit.filter(f).length >= b.lit.length * 0.9;
    ok(id, 'six boards of lights: a headline, three pictures and two short strips', B.length === 6 && by('kit-light-text').length === 1 && by('kit-light-pic').length === 3 && by('kit-light-call').length === 1 && by('kit-light-sold').length === 1, B.map(b => b.t).join(', '));
    ok(id, 'whatever is in lights can also be read as words', B.every(b => b.role === 'img' && !!b.label) && by('kit-light-text')[0].label === 'New champion' && by('kit-light-sold')[0].label === 'Sold out' && by('kit-light-pic').map(b => b.label).join('|') === 'The ring, in lights|The bell, in lights|The belt, in lights', B.map(b => b.label).join(' | '));
    ok(id, 'a light is a whole number of screen pixels, and grows with the type', B.every(b => Number.isInteger(b.d) && b.d >= 1 && b.cw === b.W * b.d && b.ch === b.H * b.d && Math.abs(b.css - b.cw / b.dpr) < 0.6) && by('kit-light-pic').every(b => b.d === Math.max(1, Math.round(2 * b.fs / 20.736 * b.dpr))) && by('kit-light-text')[0].d === Math.max(1, Math.round(3 * by('kit-light-text')[0].fs / 20.736 * by('kit-light-text')[0].dpr)), B.map(b => b.d).join(','));
    ok(id, 'a picture is 64 lights by 48; lettering is six lights a letter and nine high', by('kit-light-pic').every(b => b.W === 64 && b.H === 48) && by('kit-light-text')[0].W === 12 * 6 + 1 && by('kit-light-text')[0].H === 9 && by('kit-light-call')[0].W === 9 * 6 + 1);
    ok(id, 'the headline is lit in yellow, Your call in red, Sold out in green and white', by('kit-light-text')[0].lit.length > 120 && most(by('kit-light-text')[0], c => c[0] > 140 && c[1] > 140 && c[2] < 110) && most(by('kit-light-call')[0], c => c[0] > 140 && c[1] < 90 && c[2] < 90) && by('kit-light-sold')[0].lit.some(c => c[1] > 140 && c[0] < 90) && by('kit-light-sold')[0].lit.some(c => c[0] > 140 && c[1] > 140 && c[2] > 140), by('kit-light-text')[0].lit.length + ' lit');
    ok(id, 'each picture is lit, in colour: a red apron on the ring, a gold bell, a gold belt with a red jewel', by('kit-light-pic').every(b => b.lit.length > 400 && b.lit.length < 64 * 48 * 0.8) && by('kit-light-pic')[0].lit.filter(c => c[0] > 120 && c[1] < 70 && c[2] < 70).length > 60 && by('kit-light-pic')[1].lit.filter(c => c[0] > 120 && c[1] > 90 && c[2] < 70).length > 150 && by('kit-light-pic')[2].lit.some(c => c[0] > 150 && c[1] < 110 && c[2] < 110) && by('kit-light-pic')[2].lit.filter(c => c[0] > 120 && c[1] > 90 && c[2] < 70).length > 150, by('kit-light-pic').map(b => b.lit.length).join(','));
    ok(id, 'the board is black, set inside a grey window, and nothing of it is cut off', B.every(b => b.bg === 'rgb(5, 5, 5)' && b.inside));
    const d0 = await page.evaluate(() => window.EWF_DEBUG.lights());
    await page.evaluate(() => { for (let i = 0; i < 3; i++) window.EWF_DEBUG.render(); }); await rows[0].click(); await rows[3].click();
    ok(id, 'a board is drawn once and kept: redrawing the page does not draw it again', await page.evaluate(() => window.EWF_DEBUG.lights()) === d0, d0 + ' draws');
    if (w === 1280 && h === 720) {
      await shot(page, 'kit-sheet');
      const before = B.map(b => b.d).join(',');
      await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(400);
      B = await boards();
      const f3 = await fits(page);
      ok(id, 'on a bigger window the lights grow with the type, are drawn again, and still fit', B.map(b => b.d).join(',') !== before && B.every(b => b.d === Math.max(1, Math.round((b.t === 'kit-light-text' ? 3 : 2) * b.fs / 20.736 * b.dpr))) && await page.evaluate(() => window.EWF_DEBUG.lights()) === d0 + 6 && !f3, before + ' -> ' + B.map(b => b.d).join(',') + ' ' + f3);
      await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(400);
    }
    /* an old page still looks like itself */
    await go(page, 'overview');
    ok(id, 'an old page keeps its old panels', await page.$eval('.panel', e => getComputedStyle(e).borderTopStyle === 'double' && getComputedStyle(e).backgroundColor === 'rgb(0, 0, 170)').catch(() => false));
    ok(id, 'no errors on the way', !errs.length, errs.join(' | '));
  } catch (e) { ok(id, 'ran to the end', false, e.message.split('\n')[0]); }
  await browser.close();
}
(async () => {
  for (const s of SIZES) await run(s[0], s[1], s[2]);
  console.log(fails.length ? '\n' + fails.length + ' FAILED\n' + fails.join('\n') : '\nall passed');
  process.exit(fails.length ? 1 : 0);
})();
