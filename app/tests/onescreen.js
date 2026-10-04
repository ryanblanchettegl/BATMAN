/* One screen, no scrolling: the card builder must fit the window at every size, whatever is on it.
   Run: NODE_PATH=<dir containing playwright> node app/tests/onescreen.js */
const { open, go, overflow, shot, state, fits } = require('./helper');
const SIZES = [['desk', 1280, 720], ['desk', 1280, 800], ['desk', 1920, 1080], ['desk', 2560, 1080], ['tablet', 1024, 768], ['tv', 1920, 1080]];
const fails = [];
const ok = (id, label, pass, detail) => { console.log(id.padEnd(15), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(id + ' ' + label); };
const has = async (page, sel) => !!(await page.$(sel));

async function run(mode, w, h) {
  const id = mode + ' ' + w + 'x' + h, { browser, page, errs } = await open({ mode, promo: 'pdw' });
  const fit = async label => { const f = await fits(page), o = await overflow(page); ok(id, label + ' fits one screen', !f && !o, f || o); };
  try {
    await page.setViewportSize({ width: w, height: h });
    await go(page, 'booking');
    ok(id, 'the card builder is a one-screen page', await has(page, '.onescreen'));
    ok(id, 'the menu, the big button and the status line are all on screen', await page.evaluate(() => ['.ftop', '[data-t="advance"]', '.ffoot'].every(s => { const r = document.querySelector(s).getBoundingClientRect(); return r.top >= -1 && r.bottom <= window.innerHeight + 1; })));
    await fit('the empty card');
    await page.click('[data-t="suggest"]');
    await fit('a suggested card');
    const n = await state(page, S => S.card.length);
    ok(id, 'every line of the run sheet is one line of text, and none is cut off at the bottom', await page.evaluate(() => { const box = document.querySelector('.b1-rows').getBoundingClientRect(); return [...document.querySelectorAll('.b1-rows .seg')].every(r => { const q = r.getBoundingClientRect(), lh = parseFloat(getComputedStyle(r).lineHeight) || 24; return q.bottom <= box.bottom + 1 && q.height >= lh * 0.95; }); }));
    for (const t of ['advice', 'order', 'clock', 'promo', 'feuds', 'targets']) { await page.click('[data-t="bk"][data-v="' + t + '"]'); await fit('the ' + t + ' notes'); }
    await page.selectOption('#plan-sp', { index: 1 }).catch(() => { });
    await page.click('[data-t="bk"][data-v="promo"]'); await page.selectOption('#plan-sp', { index: 1 }); await fit('a scripted opening promo'); await page.selectOption('#plan-sp', { index: 0 });
    for (let i = 0; i < n; i++) { await page.click('[data-t="edit"][data-v="' + i + '"]'); await fit('match ' + (i + 1) + ' selected'); }
    /* the match kinds with the most boxes */
    await page.click('[data-t="edit"][data-v="1"]'); if (!(await has(page, '#m1-type'))) await page.click('[data-t="edit"][data-v="1"]');
    for (const mt of ['tag', '6man', '4way', 'br']) { await page.selectOption('#m1-type', mt); await fit('a ' + mt + ' match in the editor'); ok(id, 'its buttons are on screen (' + mt + ')', await page.evaluate(() => { const b = document.querySelector('[data-t="rm"]').getBoundingClientRect(), p = document.querySelector('.b1-pane').getBoundingClientRect(); return b.bottom <= p.bottom + 1 && b.top >= p.top; })); }
    if (w === 1280 && h === 720) await shot(page, 'onescreen-editor');
    /* what stands in the way */
    await page.click('[data-t="advance"]');
    ok(id, 'the list of what to fix comes up beside the sheet', /Fix before the show can run/.test(await page.$eval('.b1-pane', e => e.innerText)));
    await fit('the list of what to fix');
    await page.click('[data-t="suggest"]');
    /* a promo or an angle selected */
    await page.click('[data-t="seg-edit"]'); await fit('a segment selected');
    /* more lines than the sheet holds: it turns pages */
    await state(page, S => { const E = window.GP, ids = E.segChoices(S, 'interview', [], -1)[0]; for (let k = 0; k < 9 && k < ids.length; k++) E.setSeg(S, -1, { k: 'interview', who: [ids[k]], pos: k % S.card.length, len: 'S' }); });
    await go(page, 'booking');
    const lines = await state(page, S => S.card.length + window.GP.segInfo(S).booked);
    ok(id, 'a long run sheet turns pages instead of scrolling', lines > 13 && await has(page, '[data-t="sheet-pages"]') && (await page.$$('.b1-rows .seg')).length === 13, lines + ' lines');
    await fit('a long run sheet');
    await page.click('[data-t="sheet-next"]');
    ok(id, 'the next page shows the rest', (await page.$$('.b1-rows .seg')).length === lines - 13 && await page.$eval('[data-t="sheet-next"]', e => e.disabled));
    await fit('the second page');
    if (w === 1280 && h === 720) await shot(page, 'onescreen-pages');
    ok(id, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(id, 'the run finished', false, String(e.message).split('\n')[0]); await shot(page, 'onescreen-fail-' + mode + w).catch(() => { }); }
  await browser.close();
}
(async () => {
  for (const s of SIZES) await run(s[0], s[1], s[2]);
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('onescreen: all passed');
})();
