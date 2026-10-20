/* The window kit (the new look): every part on the kit sheet fits one screen at every size, nothing is cut off inside a
   window, every control has a name and works from the keyboard, and a pop-up wears the same look.
   Run: NODE_PATH=<dir containing playwright> node app/tests/kit.js */
const { open, go, overflow, shot, fits } = require('./helper');
const SIZES = [['desk', 1280, 720], ['desk', 1280, 860], ['desk', 1920, 1080], ['tablet', 1024, 768], ['tv', 1920, 1080]];
const fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(15), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
const rgb = (page, sel, prop) => page.$eval(sel, (e, p) => getComputedStyle(e)[p], prop);
/* the paper look (app/styles/theme.css): which Blender card a piece is cut from (tools/creator/ui-pieces.py) */
const cut = (page, sel) => page.$eval(sel, e => { const u = x => x.trim().replace(/^url\(["']?|["']?\)$/g, ''), bi = u(getComputedStyle(e).borderImageSource), rs = getComputedStyle(document.documentElement);
  // the craft look (app/styles/craft.css): torn cream paper and cut card on the workbench, --lk-*
  return ['win', 'card', 'note', 'btn-green', 'btn-blue', 'btn-red', 'btn-yellow', 'btn-navy', 'btn-off', 'btn-cream'].map(k => 'lk-' + k).find(k => bi === u(rs.getPropertyValue('--' + k)))
    || ['win', 'grp', 'tile', 'btn-green', 'btn-blue', 'btn-red', 'btn-yellow', 'btn-navy', 'btn-off', 'btn-cream'].find(k => bi === u(rs.getPropertyValue('--ui-' + k))) || 'none'; });
const INK = 'rgb(35, 35, 42)', WHITE = 'rgb(255, 255, 255)', MARKER = 'rgb(255, 228, 138)';

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
    ok(id, 'a window is torn cream paper, dark ink, its title a strip of navy card in yellow marker', (await cut(page, '[data-t="kit-list"]')) === 'lk-win' && (await rgb(page, '[data-t="kit-list"] > .bd', 'color')) === INK && (await rgb(page, '[data-t="kit-list"] > .ttl', 'backgroundImage')) !== 'none' && (await rgb(page, '[data-t="kit-list"] > .ttl h2', 'color')) === MARKER);
    ok(id, 'a window that wants attention has a red bar, a celebration a gold one', (await rgb(page, '[data-t="kit-hot"] > .ttl', 'backgroundColor')) === 'rgb(184, 50, 42)' && (await rgb(page, '[data-t="kit-gold"] > .ttl', 'backgroundColor')) === 'rgb(201, 154, 24)');
    ok(id, 'buttons are cut coloured card: green with white marker, yellow, navy, red', (await cut(page, '[data-t="kit-b1"]')) === 'lk-btn-green' && (await rgb(page, '[data-t="kit-b1"]', 'color')) === WHITE && (await cut(page, '[data-t="kit-b2"]')) === 'lk-btn-yellow' && (await cut(page, '[data-t="kit-b3"]')) === 'lk-btn-navy' && (await cut(page, '[data-t="kit-b4"]')) === 'lk-btn-red');
    ok(id, 'a button that costs something says so at its right end', /1 point$/.test((await page.$eval('[data-t="kit-talk"]', e => e.textContent)).trim()));
    ok(id, 'a tag in a window is a filled box, not a word in brackets', await page.$eval('[data-t="kit-tags"] .tag.bad', e => getComputedStyle(e).backgroundColor === 'rgb(230, 77, 64)' && getComputedStyle(e, '::before').content === 'none'));
    ok(id, 'bars come ten, eight and five wide', await page.$$eval('[data-t="kit-tags"] .meter', L => L.map(e => e.textContent.length).join(',') === '10,8,5,5'));
    /* the list box */
    const rows = await page.$$('[data-t="kit-row"]');
    ok(id, 'the list box has a header and seven lines, each one line tall', rows.length === 7 && await page.evaluate(() => { const L = [...document.querySelectorAll('[data-t="kit-row"]')].map(e => e.getBoundingClientRect().height), hd = document.querySelector('.lb .hd'); return !!hd && L.every(x => Math.abs(x - L[0]) < 1.5); }));
    ok(id, 'the first line is picked, marked with a yellow highlighter', await page.$eval('[data-t="kit-row"]', e => e.classList.contains('sel') && /linear-gradient/.test(getComputedStyle(e).backgroundImage) && /255, 210, 63/.test(getComputedStyle(e).backgroundImage)));
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
    ok(id, 'the pop-up wears the craft look: a strip of navy card, a yellow title in the middle, torn paper', await page.evaluate(() => { const w = document.querySelector('.win'), t = w.querySelector('.wt'), s = t.querySelector('span'), c = getComputedStyle(t), b = getComputedStyle(w), tr = t.getBoundingClientRect(), sr = s.getBoundingClientRect(), r = document.createRange(); r.selectNodeContents(s); const xr = r.getBoundingClientRect(); return c.backgroundImage !== 'none' && getComputedStyle(s).color === 'rgb(255, 228, 138)' && b.borderImageSource !== 'none' && Math.abs((xr.left + xr.right) / 2 - (tr.left + tr.right) / 2) < tr.width * 0.06; }));
    ok(id, 'its OK button is yellow card with dark marker', (await cut(page, '#modal-ok')) === 'lk-btn-yellow' && (await rgb(page, '#modal-ok', 'color')) === INK);
    await page.keyboard.press('Escape');
    ok(id, 'Esc closes it', !(await page.$('.win')));
    ok(id, 'a disabled answer cannot be pressed', await page.$eval('[data-t="kit-ans-4"]', e => e.disabled));
    /* what used to be lights: lettering in marker on black card, and pictures painted as cut card (no dot matrix) */
    const words = await page.$$eval('.ledb.txt', L => L.map(e => ({ t: e.getAttribute('data-t'), label: e.getAttribute('aria-label'), role: e.getAttribute('role'), font: getComputedStyle(e).fontFamily, bg: getComputedStyle(e).backgroundColor, canvas: !!e.querySelector('canvas') })));
    const pics = () => page.$$eval('.ledb.pic canvas', L => L.map(c => { const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data; let gold = 0, red = 0, any = 0;
      for (let i = 0; i < d.length; i += 16) { if (d[i + 3] < 200) continue; any++; if (d[i] > 170 && d[i + 1] > 140 && d[i + 2] < 110) gold++; if (d[i] > 160 && d[i + 1] < 110 && d[i + 2] < 110) red++; }
      const r = c.getBoundingClientRect(), win = c.closest('.wn > .bd').getBoundingClientRect();
      return { t: c.getAttribute('data-t'), label: c.getAttribute('aria-label'), w: r.width, any, gold, red, inside: r.left >= win.left - 1 && r.right <= win.right + 1 && r.top >= win.top - 1 && r.bottom <= win.bottom + 1 }; }));
    let P = await pics();
    ok(id, 'lettering is marker on black card, can be read as words, and has no dots', words.length === 3 && words.every(x => x.role === 'img' && !!x.label && !x.canvas && /Marker/.test(x.font) && x.bg === 'rgb(27, 26, 31)') && words.some(x => x.label === 'New champion') && words.some(x => x.label === 'Sold out'), JSON.stringify(words));
    ok(id, 'three pictures painted as cut card: a red apron on the ring, a gold bell, a gold belt with a red jewel', P.length === 3 && P.map(b => b.label).join('|') === 'The ring|The bell|The belt' && P[0].red > 30 && P[1].gold > 60 && P[2].gold > 60 && P[2].red > 0 && P.every(b => b.inside), JSON.stringify(P));
    const d0 = await page.evaluate(() => window.EWF_DEBUG.lights());
    await page.evaluate(() => { for (let i = 0; i < 3; i++) window.EWF_DEBUG.render(); }); await rows[0].click(); await rows[3].click();
    ok(id, 'a picture is painted once and kept: redrawing the page does not paint it again', await page.evaluate(() => window.EWF_DEBUG.lights()) === d0, d0 + ' draws');
    if (w === 1280 && h === 720) {
      await shot(page, 'kit-sheet');
      const before = P.map(b => Math.round(b.w)).join(',');
      await page.setViewportSize({ width: 1920, height: 1080 }); await page.waitForTimeout(400);
      P = await pics();
      const f3 = await fits(page);
      ok(id, 'on a bigger window the pictures grow with the type and still fit', P.map(b => Math.round(b.w)).join(',') !== before && !f3, before + ' -> ' + P.map(b => Math.round(b.w)).join(',') + ' ' + f3);
      await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(400);
    }
    /* an old page still looks like itself */
    await go(page, 'world');
    ok(id, 'an old page shows its panels as torn cream paper', (await cut(page, '.panel').catch(() => '')) === 'lk-win');
    ok(id, 'no errors on the way', !errs.length, errs.join(' | '));
  } catch (e) { ok(id, 'ran to the end', false, e.message.split('\n')[0]); }
  await browser.close();
}
(async () => {
  for (const s of SIZES) await run(s[0], s[1], s[2]);
  console.log(fails.length ? '\n' + fails.length + ' FAILED\n' + fails.join('\n') : '\nall passed');
  process.exit(fails.length ? 1 : 0);
})();
