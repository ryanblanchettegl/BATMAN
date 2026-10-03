/* Overflow sweep: every page on desk, phone, tablet and TV at week 30 of a game advanced headless. Nothing may scroll sideways.
   Run:  NODE_PATH=<dir containing playwright> node app/tests/sweep.js   (build first). MODES= and PROMO= work as in journey.js */
const { open, go, overflow, state, redraw } = require('./helper');
const PAGES = ['desk', 'career', 'booking', 'roster', 'locker', 'titles', 'market', 'storylines', 'history', 'sheet', 'feed', 'boards', 'manage', 'house', 'deals', 'overview', 'finances', 'world'];
const PLAY = (S, n) => { for (let w = 0; w < n && !S.over; w++) { S.inbox.filter(e => !e.done).forEach(e => GP.resolveEvent(S, e.id, 0)); if (S.owner.pending) GP.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); while (S.qi < S.queue.length) { const c = GP.suggest(S), pr = GP.preShow(S, c); if (pr) GP.resolvePre(S, c, 0); GP.runPlayerShow(S, c); } GP.endWeek(S); } };
(async () => {
  let bad = 0;
  for (const mode of (process.env.MODES || 'desk,phone,tablet,tv').split(',')) {
    const { browser, page, errs } = await open({ mode, promo: process.env.PROMO || 'pdw' });
    await state(page, PLAY, 29); await redraw(page);
    const week = await state(page, S => S.week), over = await state(page, S => !!S.over);
    const problems = [];
    for (const p of PAGES) { await go(page, p); await page.waitForTimeout(120); const o = await overflow(page); if (o) problems.push(p + ': ' + o.slice(0, 160)); }
    console.log(mode.padEnd(6), 'week ' + week + (over ? ' (game over)' : ''), problems.length ? 'FAIL' : 'ok', problems.join(' | '), errs.length ? 'ERRORS ' + errs.join(' | ') : '');
    if (problems.length || errs.length) bad++;
    await browser.close();
  }
  console.log(bad ? 'FAILED ' + bad : 'sweep ok'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
