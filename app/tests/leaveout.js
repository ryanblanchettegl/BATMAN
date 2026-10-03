/* Leaving companies out of a new game, from the Federations screen.
   Run: NODE_PATH=<dir containing playwright> node app/tests/leaveout.js   (MODES=desk,phone) */
const { open, overflow, state } = require('./helper');
const MODES = (process.env.MODES || 'desk,phone').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const txt = (page, sel) => page.$eval(sel, e => e.innerText).catch(() => '');

async function run(mode, gone) {
  const { browser, page, errs } = await open({ mode, promo: null });
  try {
    await page.click('[data-t="scr"][data-v="select"]');
    await page.click('[data-t="uni-cut"]');
    await page.waitForSelector('.win');
    ok(mode, 'the window lists every company', (await page.$$('[data-t="cut-toggle"]')).length === 9);
    for (const id of ['whw', 'ocw', 'pdp', 'nmw', 'ldd', 'lta', 'kjp']) await page.click('[data-t="cut-toggle"][data-v="' + id + '"]');
    await page.click('[data-t="cut-toggle"][data-v="ttt"]');
    ok(mode, 'the last two cannot be left out, and the window says why', /at least two/.test(await txt(page, '[data-t="cut-msg"]')));
    if (gone) await page.click('[data-t="cut-gone"][data-v="1"]');
    const o = await overflow(page); ok(mode, 'the window fits the screen', !o, o);
    await page.keyboard.press('Escape');
    ok(mode, 'the list shows only the companies left in', (await page.$$('[data-t="pick"]')).length === 3 && !!(await page.$('[data-t="pick"][data-v="pdw"]')) && !(await page.$('[data-t="pick"][data-v="whw"]')));
    ok(mode, 'the Universe panel says what was done', /2 of 9 companies/.test(await txt(page, '[data-t="uni-cut-note"]')));
    await page.click('[data-t="pick"][data-v="ttt"]');
    await page.fill('#bname', 'Ryan');
    await page.click('[data-t="begin"]');
    await page.waitForSelector('main.main');
    const w = await state(page, S => ({ n: S.order.length, ids: S.order.join(), people: S.w.length, fa: S.w.filter(x => x.promo === 'FA').length }));
    ok(mode, 'the game has two companies', w.n === 2 && w.ids === 'pdw,ttt', w.ids);
    ok(mode, gone ? 'the others’ wrestlers are gone' : 'the others’ wrestlers are free agents', gone ? w.people < 250 : w.fa > 250, w.people + ' people, ' + w.fa + ' free agents');
    ok(mode, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(mode, 'the run finished', false, String(e.message).split('\n')[0]); }
  await browser.close();
}
(async () => {
  for (const m of MODES) { await run(m, false); if (m === 'desk') await run(m, true); }
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('leaveout: all passed');
})();
