/* Shows and belts made during a game, through the Manage section.
   Run: NODE_PATH=<dir containing playwright> node app/tests/create.js   (MODES=desk,phone,tv) */
const { open, go, overflow, shot, state } = require('./helper');
const MODES = (process.env.MODES || 'desk,phone,tv').split(',');
const fails = [];
const ok = (mode, label, pass, detail) => { console.log(mode.padEnd(6), pass ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!pass) fails.push(mode + ' ' + label); };
const txt = (page, sel) => page.$eval(sel, e => e.innerText).catch(() => '');

async function run(mode) {
  const { browser, page, errs } = await open({ mode, promo: 'pdw' });
  const over = async label => { const o = await overflow(page); ok(mode, label + ' fits the screen', !o, o); };
  try {
    await go(page, 'manage');
    ok(mode, 'Operations has a Shows and belts panel', /weekly shows? and/i.test(await txt(page, 'main.main')));
    const n0 = await state(page, S => S.promos[S.player].titles.length), cash0 = await state(page, S => S.promos[S.player].cash);

    /* belts */
    await page.click('[data-t="make-belts"]');
    await page.waitForSelector('.win');
    await over('the Belts window');
    await page.click('[data-t="make-belt"]');
    ok(mode, 'a belt without a name is refused, and the window says so', /name first/i.test(await txt(page, '[data-t="make-msg"]')));
    await page.fill('#make-belt-name', 'Lantern Title');
    await page.click('[data-t="make-belt"]');
    ok(mode, 'a belt is created, and the window says what happened', /Lantern Title is made and vacant/.test(await txt(page, '[data-t="make-msg"]')), await txt(page, '[data-t="make-msg"]'));
    ok(mode, 'the belt is in the game, vacant, and paid for', await state(page, (S, a) => { const P = S.promos[S.player], t = P.titles[P.titles.length - 1]; return P.titles.length === a.n + 1 && t.name === 'Lantern Title' && !t.holders.length && P.cash < a.c; }, { n: n0, c: cash0 }));
    const tid = await state(page, S => { const P = S.promos[S.player]; return P.titles[P.titles.length - 1].id; });
    await page.click('[data-t="make-ren"][data-id="' + tid + '"]');
    await page.fill('[data-t="make-ren-text"]', 'Golden Lantern Title');
    await page.click('[data-t="make-ren-save"]');
    ok(mode, 'the belt can be renamed', /Golden Lantern Title/.test(await txt(page, '.win .list')));
    await over('the Belts window after changes');
    await shot(page, 'create-' + mode + '-belts', true);
    await page.keyboard.press('Escape');
    await go(page, 'titles');
    ok(mode, 'the new belt is on the Titles page as vacant', /Golden Lantern Title/.test(await txt(page, 'main.main')) && /vacant/i.test(await txt(page, 'main.main')));
    await page.click('[data-t="make-belts"]');
    await page.waitForSelector('.win');
    await page.click('[data-t="make-del"][data-id="' + tid + '"]');
    await page.click('[data-t="make-del-yes"]');
    ok(mode, 'the belt can be retired in two presses', /is retired/.test(await txt(page, '[data-t="make-msg"]')) && await state(page, (S, n) => S.promos[S.player].titles.length === n, n0), await txt(page, '[data-t="make-msg"]'));
    ok(mode, 'a retired belt is listed', /Retired belts/i.test(await txt(page, '.win')) && /Golden Lantern Title/.test(await txt(page, '.win')));
    await page.keyboard.press('Escape');

    /* shows */
    await go(page, 'manage');
    const s0 = await state(page, S => S.promos[S.player].shows.length);
    await page.click('[data-t="make-shows"]');
    await page.waitForSelector('.win');
    ok(mode, 'the show form gives the chance and the cost', /an attempt with a/.test(await txt(page, '.win')) && /Launching it costs/.test(await txt(page, '.win')));
    await over('the Weekly shows window');
    let made = false, said = '';
    for (let i = 0; i < 25 && !made; i++) {
      await state(page, S => { S.showAsk = null; }); await page.evaluate(() => window.EWF_DEBUG.render());
      await page.fill('#make-show-name', 'Lantern Night');
      await page.click('[data-t="make-show"]');
      said = await txt(page, '[data-t="make-msg"]');
      made = /starts next week/.test(said);
      if (!made && !/attempt did not come off/i.test(said)) break;
    }
    ok(mode, 'the network says yes or no in plain words, and yes adds the show', made && await state(page, (S, n) => S.promos[S.player].shows.length === n + 1, s0), said);
    ok(mode, 'no dice wording in the answer', !/roll|dice|2d6/i.test(said));
    const sid = await state(page, S => { const P = S.promos[S.player]; return P.shows[P.shows.length - 1].id; });
    await shot(page, 'create-' + mode + '-shows', true);
    await page.keyboard.press('Escape');
    await go(page, 'desk');
    await page.evaluate(() => { const S = window.EWF_DEBUG.state(); while (S.qi < S.queue.length) S.qi++; });
    await page.evaluate(() => { const E = window.GP, S = window.EWF_DEBUG.state(); E.endWeek(S); window.EWF_DEBUG.render(); });
    ok(mode, 'the new show is on next week’s schedule', await state(page, S => S.queue.some(q => q.name === 'Lantern Night')));
    await go(page, 'manage');
    await page.click('[data-t="make-shows"]');
    await page.waitForSelector('.win');
    await page.click('[data-t="make-del"][data-id="' + sid + '"]');
    await page.click('[data-t="make-del-yes"]');
    ok(mode, 'the show can be cancelled, and it leaves this week’s schedule', /off the schedule/.test(await txt(page, '[data-t="make-msg"]')) && await state(page, (S, n) => S.promos[S.player].shows.length === n && !S.queue.some(q => q.name === 'Lantern Night'), s0));
    await page.keyboard.press('Escape');
    ok(mode, 'no errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { ok(mode, 'the run finished', false, String(e.message).split('\n')[0]); await shot(page, 'create-' + mode + '-fail', true).catch(() => { }); }
  await browser.close();
}

(async () => {
  for (const m of MODES) await run(m);
  if (fails.length) { console.log('FAILED: ' + fails.length); process.exit(1); }
  console.log('create: all passed');
})();
