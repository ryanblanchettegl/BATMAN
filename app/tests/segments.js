/* Booking promos and angles on the run sheet.
   Run: NODE_PATH=<dir containing playwright> node app/tests/segments.js   (MODES=desk,phone,tv) */
const { open, go, overflow, shot, state, flash } = require('./helper');
const MODES = (process.env.MODES || 'desk,phone,tv').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const txt = (page, sel) => page.$eval(sel, e => e.innerText).catch(() => '');
const has = async (page, sel) => !!(await page.$(sel));

async function run(mode) {
  const { browser, page, errs } = await open({ mode, promo: 'pdw' });
  const over = async label => { const o = await overflow(page); ok(mode, label + ' fits the screen', !o, o); };
  try {
    await go(page, 'booking');
    ok(mode, 'the run sheet has an opening promo row and a promos and angles panel', await has(page, '[data-t="promo-open"]') && await has(page, '[data-t="seg-add"]'));
    ok(mode, 'the panel says how many are booked', /0 of 2/.test(await txt(page, 'main.main')));
    await page.click('[data-t="suggest"]');
    ok(mode, 'a suggested card comes with one promo or angle pencilled in', /1 of 2/.test(await txt(page, 'main.main')) && (await page.$$('[data-t="seg-edit"]')).length === 1);
    await page.click('[data-t="seg-rm"]');
    ok(mode, 'there is a button for it beside Add a match', await has(page, '[data-t="seg-new"]'));
    await page.click('[data-t="seg-new"]');
    await page.waitForSelector('.win');
    await over('the booking window');
    ok(mode, 'Book it waits until everyone is picked', await page.$eval('[data-t="seg-save"]', e => e.disabled));
    await page.selectOption('#seg-kind', 'callout');
    await page.selectOption('#seg-who-0', { index: 1 });
    ok(mode, 'the second pick opens once the first is made', !(await page.$eval('#seg-who-1', e => e.disabled)));
    await page.selectOption('#seg-who-1', { index: 1 });
    ok(mode, 'the window says what to expect', /should score about \d+%/.test(await txt(page, '[data-t="seg-look"]')), await txt(page, '[data-t="seg-look"]'));
    await page.selectOption('#seg-pos', { index: 2 });
    await page.click('[data-t="seg-save"]');
    ok(mode, 'booking it says what was booked', /Booked: .* calls out /.test(await flash(page)), await flash(page));
    ok(mode, 'the segment is on the run sheet before its match', await page.evaluate(() => { const rows = [...document.querySelectorAll('.sheet > .seg')]; const i = rows.findIndex(r => r.querySelector('[data-t="seg-edit"]')); return i === 3 && /Call-out/.test(rows[i].innerText); }));
    await page.click('[data-t="seg-suggest"]');
    ok(mode, 'Suggest them fills the other slot', /2 of 2/.test(await txt(page, 'main.main')) && (await page.$$('[data-t="seg-edit"]')).length === 2, await flash(page));
    ok(mode, 'with every slot booked there is nothing more to add', await page.$eval('[data-t="seg-add"]', e => e.disabled));
    await over('the run sheet with segments');
    await shot(page, 'segments-' + mode, true);
    /* change one, then hand one back */
    await page.click('[data-t="seg-edit"][data-v="0"]');
    await page.waitForSelector('.win');
    ok(mode, 'Change opens the window with the segment as booked', await page.$eval('#seg-kind', e => e.value) === 'callout' && await page.$eval('#seg-who-0', e => e.value) !== '');
    await page.click('[data-t="seg-clear"]');
    ok(mode, 'handing it back to the writers frees the slot', /1 of 2/.test(await txt(page, 'main.main')) && /back with the writers/.test(await flash(page)));
    /* the opening promo row takes you to its form */
    await page.click('[data-t="promo-open"]');
    await page.waitForSelector('#plan-sp');
    ok(mode, 'the opening promo row opens its form', await has(page, '#plan-sp'));
    /* the show runs the booked segment and the report marks it */
    const rep = await page.evaluate(() => { const S = window.EWF_DEBUG.state(), E = window.GP, pr = E.preShow(S, S.card); if (pr) E.resolvePre(S, S.card, 0); const v = E.validate(S, S.card); if (v.errors.length) return { err: v.errors.join(' | ') }; const r = E.runPlayerShow(S, S.card).rep; return { booked: r.segs.filter(s => s.k === 'angle' && s.booked).map(s => s.head + ': ' + s.text), n: r.segs.filter(s => s.k === 'angle').length }; });
    ok(mode, 'the booked segment ran on the show', !rep.err && rep.booked.length === 1 && rep.n >= 2, rep.err || rep.booked.join(' / '));
    ok(mode, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(mode, 'the run finished', false, String(e.message).split('\n')[0]); await shot(page, 'segments-' + mode + '-fail', true).catch(() => { }); }
  await browser.close();
}
(async () => {
  for (const m of MODES) await run(m);
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('segments: all passed');
})();
