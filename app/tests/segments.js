/* Booking promos and angles on the run sheet.
   Run: NODE_PATH=<dir containing playwright> node app/tests/segments.js   (MODES=desk,tablet) */
const { open, go, overflow, shot, state, flash, fits } = require('./helper');
const MODES = (process.env.MODES || 'desk,tablet').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const txt = (page, sel) => page.$eval(sel, e => e.innerText).catch(() => '');
const has = async (page, sel) => !!(await page.$(sel));

async function run(mode) {
  const { browser, page, errs } = await open({ mode, promo: 'pdw' });
  const over = async label => { const o = await overflow(page); ok(mode, label + ' fits the screen', !o, o); const f = await fits(page); ok(mode, label + ' needs no scrolling', !f, f); };
  try {
    await go(page, 'booking');
    const clock = () => page.$eval('[data-t="clock"]', e => ({ v: e.getAttribute('data-v'), t: e.innerText.replace(/\s+/g, ' ') }));
    const cat = async k => +(await txt(page, '[data-t="cat-' + k + '"] b'));
    const nSeg = () => page.$$eval('[data-t="seg-edit"]', L => L.length);
    ok(mode, 'the page has three Add buttons: a match, a promo, an angle', await has(page, '[data-t="add"]') && await has(page, '[data-t="add-promo"]') && await has(page, '[data-t="add-angle"]') && !(await has(page, '[data-t="seg-new"]')));
    ok(mode, 'an empty show says how many hours there are to fill', /0:00 of 2:00/.test((await clock()).t) && /2 hours to fill/.test((await clock()).t), (await clock()).t);
    ok(mode, 'the head of the sheet says how the show opens', await has(page, '[data-t="opening"]') && await has(page, '[data-t="open-guide"]'));
    await over('the empty card');
    await page.click('[data-t="suggest"]');
    let c = await clock();
    ok(mode, 'a suggested card fills the two hours', c.v === 'ok' && /of 2:00/.test(c.t), c.t);
    ok(mode, 'it comes with promos and angles, and the three kinds are counted', await nSeg() === 2 && await cat('match') >= 4 && await cat('promo') + await cat('angle') === 2);
    ok(mode, 'every row says when it starts', await page.$$eval('.sheet .seg .at', L => L.length >= 6 && L[0].innerText === '0:00' && L.every(e => /^\d:\d\d$/.test(e.innerText))));
    ok(mode, 'the item on at the top of each hour is marked', /Opens the show/i.test(await txt(page, '.sheet')) && /Top of hour 2/i.test(await txt(page, '.sheet')) && (await page.$$('.sheet .seg.top')).length === 2);
    await page.click('[data-t="bk"][data-v="clock"]');
    ok(mode, 'the clock beside the sheet names them too', /The show opens on/.test(await txt(page, '[data-t="tops"]')) && /Hour 2 opens on/.test(await txt(page, '[data-t="tops"]')));
    ok(mode, 'with a match first, the show goes straight to the ring', await page.$eval('[data-t="opening"]', e => e.getAttribute('data-v')) === 'match');
    /* take both off: the show is short and cannot run */
    for (let k = 0; k < 2; k++) { await page.click('[data-t="seg-edit"]'); ok(mode, 'selecting a promo or an angle shows it beside the sheet', await page.$eval('[data-t="pane"]', e => e.getAttribute('data-v')) === 'seg'); await over('a selected segment'); await page.click('[data-t="seg-rm"]'); }
    c = await clock();
    ok(mode, 'with them gone the clock says how much is left to fill', await nSeg() === 0 && c.v === 'short' && /\d+ minutes still to fill/.test(c.t), c.t);
    await page.click('[data-t="advance"]');
    ok(mode, 'and the show will not run until it is filled', /still empty/.test(await txt(page, '.flash.err:not([role])')), await txt(page, '.flash.err:not([role])'));
    /* a promo */
    await page.click('[data-t="add-promo"]');
    await page.waitForSelector('.win');
    await over('the booking window');
    ok(mode, 'the window is for a promo: only promo kinds, and the writers', await page.$eval('#seg-kind', e => [...e.options].map(o => o.value).join()) === 'interview,callout,words,challenge,faceoff,recap,writers', await page.$eval('#seg-kind', e => [...e.options].map(o => o.value).join()));
    ok(mode, 'it says how much time is left', /minutes still to fill/.test(await txt(page, '[data-t="seg-left"]')));
    ok(mode, 'Book it waits until everyone is picked', await page.$eval('[data-t="seg-save"]', e => e.disabled));
    await page.selectOption('#seg-kind', 'callout');
    await page.selectOption('#seg-who-0', { index: 1 });
    ok(mode, 'the second pick opens once the first is made', !(await page.$eval('#seg-who-1', e => e.disabled)));
    await page.selectOption('#seg-who-1', { index: 1 });
    ok(mode, 'the window gives a read in words, never a forecast in stars, and says how long it takes', /(No read|should land|do its job|could die out there)/.test(await txt(page, '[data-t="seg-look"]')) && !/[★¼½¾]|should be about/.test(await txt(page, '[data-t="seg-look"]')) && /takes 5 minutes/.test(await txt(page, '[data-t="seg-look"]')), await txt(page, '[data-t="seg-look"]'));
    await page.selectOption('#seg-len', 'L');
    ok(mode, 'a long one takes fifteen', /takes 15 minutes/.test(await txt(page, '[data-t="seg-look"]')));
    await page.selectOption('#seg-pos', { index: 2 });
    await page.click('[data-t="seg-save"]');
    ok(mode, 'booking it says what was booked and for how long', /Booked: .* calls out .*, 15 minutes/.test(await flash(page)), await flash(page));
    ok(mode, 'the promo is on the run sheet before its match', await page.evaluate(() => { const rows = [...document.querySelectorAll('.sheet > .seg')]; const i = rows.findIndex(r => r.querySelector('[data-t="seg-edit"]')); return i === 2 && /Call-out/.test(rows[i].innerText) && /15 min/.test(rows[i].innerText); }));
    ok(mode, 'the row carries the same read, in words', /(No read|should land|do its job|could die out there)/.test(await txt(page, '[data-t="seg-read"]')) && !/[★¼½¾]/.test(await txt(page, '.sheet')) && await page.$eval('[data-t="pane"]', e => e.getAttribute('data-v')) === 'seg', await txt(page, '[data-t="seg-read"]'));
    ok(mode, 'and it is counted as a promo', await cat('promo') === 1 && await cat('angle') === 0);
    /* an angle, at the top of the show */
    await page.click('[data-t="add-angle"]');
    await page.waitForSelector('.win');
    ok(mode, 'the angle window offers only angles, and the writers', await page.$eval('#seg-kind', e => [...e.options].map(o => o.value).join()) === 'ambush,brawl,save,turn,writers');
    await page.selectOption('#seg-kind', 'writers');
    ok(mode, 'time for the writers needs nobody picked', !(await page.$eval('[data-t="seg-save"]', e => e.disabled)) && /The writers get 10 minutes/.test(await txt(page, '[data-t="seg-look"]')), await txt(page, '[data-t="seg-look"]'));
    await page.selectOption('#seg-pos', { index: 0 });
    await page.click('[data-t="seg-save"]');
    ok(mode, 'put first, it opens the show', await page.$eval('[data-t="opening"]', e => e.getAttribute('data-v')) === 'writers' && await cat('angle') === 1, await txt(page, '[data-t="opening"]'));
    /* as many as fit: keep adding */
    await page.click('[data-t="bk"][data-v="clock"]');
    await page.click('[data-t="seg-suggest"]');
    ok(mode, 'a suggested one is added to the ones already there', await nSeg() === 3, await flash(page));
    await over('the run sheet with segments');
    await shot(page, 'segments-' + mode, true);
    /* the guide */
    await page.click('[data-t="open-guide"]');
    await page.waitForSelector('.win');
    ok(mode, 'the guide lists the ways to open a show and the top of the hour', /Straight to the ring/.test(await txt(page, '.win')) && /video recap/i.test(await txt(page, '.win')) && /top of the hour/i.test(await txt(page, '.win')));
    await over('the guide');
    await page.click('#modal-ok');
    /* change one, then take it off */
    await page.click('[data-t="seg-edit"][data-v="0"]');
    await page.click('[data-t="seg-change"]');
    await page.waitForSelector('.win');
    ok(mode, 'Change opens the window with the promo as booked', await page.$eval('#seg-kind', e => e.value) === 'callout' && await page.$eval('#seg-who-0', e => e.value) !== '' && await page.$eval('#seg-len', e => e.value) === 'L');
    await page.click('[data-t="seg-clear"]');
    ok(mode, 'taking it off the show removes it', await nSeg() === 2 && /off the show/.test(await flash(page)), await flash(page));
    /* the opening promo row takes you to its form */
    await page.click('[data-t="bk"][data-v="promo"]');
    await page.waitForSelector('#plan-sp');
    ok(mode, 'the scripted opening promo opens its form', await has(page, '#plan-sp'));
    /* the match editor shows what each length costs */
    await page.click('[data-t="edit"][data-v="1"]');
    ok(mode, 'the match editor gives each length in minutes', /Short · \d+ min/.test(await txt(page, '#m1-len')) && /Long · \d+ min/.test(await txt(page, '#m1-len')), await txt(page, '#m1-len'));
    await over('a selected match');
    await page.click('[data-t="edit"][data-v="1"]');
    /* fill what is left with booked work, then run */
    await page.evaluate(() => { const S = window.EWF_DEBUG.state(), E = window.GP; E.fitShow(S, S.card); });
    /* the show runs the booked segment and the report marks it */
    const rep = await page.evaluate(() => { const S = window.EWF_DEBUG.state(), E = window.GP, pr = E.preShow(S, S.card); if (pr) { E.resolvePre(S, S.card, 0); E.fitShow(S, S.card); } const v = E.validate(S, S.card); if (v.errors.length) return { err: v.errors.join(' | ') }; const r = E.runPlayerShow(S, S.card).rep; return { booked: r.segs.filter(s => s.k === 'angle' && s.booked).map(s => s.head + ': ' + s.text), n: r.segs.filter(s => s.k === 'angle').length, open: r.open.k, tops: r.tops.length, total: r.clock.total }; });
    ok(mode, 'the booked segments ran on the show, inside its two hours', !rep.err && rep.booked.length >= 1 && rep.n >= 2 && rep.tops === 2 && Math.abs(rep.total - 120) <= 10, rep.err || rep.booked.join(' / ') + ' · ' + rep.total + ' min');
    ok(mode, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(mode, 'the run finished', false, String(e.message).split('\n')[0]); await shot(page, 'segments-' + mode + '-fail', true).catch(() => { }); }
  await browser.close();
}
(async () => {
  for (const m of MODES) await run(m);
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('segments: all passed');
})();
