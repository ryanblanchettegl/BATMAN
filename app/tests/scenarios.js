/* Browser run of the scenarios: the title card entry, starting each one, and the result screen when the weeks run out. Desk and tablet.
   Build first:  node build.js
   Run:          NODE_PATH=/opt/npm-tools/node_modules node app/tests/scenarios.js */
const { open, overflow, state, redraw } = require('./helper');
const fails = [];
function check(mode, label, ok, detail) { console.log(mode.padEnd(6), ok ? 'ok  ' : 'FAIL', label + (detail ? ': ' + detail : '')); if (!ok) fails.push(mode + ' ' + label); }
(async () => {
  for (const mode of ['desk', 'tablet']) {
    const { browser, page, errs } = await open({ mode, promo: null, file: process.env.EWF_OUT || 'index' });
    await page.click('[data-t="scenarios"]'); await page.waitForSelector('[data-t="scn-play"]');
    const n = await page.$$eval('[data-t="scn-play"]', L => L.length), want = await state(page, S => GP.SCENARIOS.length);
    check(mode, 'every scenario is offered', n === want && n >= 3, n + ' scenarios');
    check(mode, 'the list fits the screen', (await overflow(page)) === '', await overflow(page));
    for (const id of ['rescue', 'champion', 'war']) {
      if (id !== 'rescue') { await page.waitForSelector('.logo-box').catch(() => {}); }
      if (!(await page.$('[data-t="scn-play"]'))) { await page.click('[data-t="scenarios"]'); await page.waitForSelector('[data-t="scn-play"]'); }
      await page.click('[data-t="scn-play"][data-v="' + id + '"]'); await page.waitForSelector('main.main');
      const c0 = await state(page, S => S.scn ? { id: S.scn.id, weeks: S.scn.weeks, week: S.week } : null);
      check(mode, id + ' starts', !!c0 && c0.id === id && c0.week === 1, JSON.stringify(c0));
      await state(page, S => { for (let w = 0; w < 45 && !S.over; w++) { S.inbox.filter(e => !e.done).forEach(e => GP.resolveEvent(S, e.id, 0)); if (S.owner.pending) GP.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); while (S.qi < S.queue.length) { const c = GP.suggest(S); S.card = c; const pr = GP.preShow(S, c); if (pr) GP.resolvePre(S, c, 0); if (GP.validate(S, c).errors.length) { S.qi++; continue; } GP.runPlayerShow(S, c); } GP.endWeek(S); } });
      await redraw(page); await page.waitForSelector('[data-t="newgame-yes"]');
      const t = await page.$eval('h1', e => e.innerText);
      check(mode, id + ' ends with a result', /You did it|Not this time/i.test(t), t);
      check(mode, id + ' result fits the screen', (await overflow(page)) === '', await overflow(page));
      await page.click('[data-t="newgame-yes"]'); await page.waitForSelector('.selrow');
      await page.click('[data-t="scr"][data-v="title"]'); await page.waitForSelector('.logo-box');
      await page.click('[data-t="scenarios"]'); await page.waitForSelector('[data-t="scn-play"]');
    }
    check(mode, 'no errors', errs.length === 0, errs.join(' | '));
    await browser.close();
  }
  if (fails.length) { console.log('FAILED: ' + fails.length); fails.forEach(f => console.log('  ' + f)); process.exit(1); }
  console.log('scenarios: all checks passed');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
