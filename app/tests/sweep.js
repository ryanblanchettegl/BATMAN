/* Overflow sweep: every page on desk, tablet and TV at week 30 of a game advanced headless. Nothing may scroll sideways.
   Run:  NODE_PATH=<dir containing playwright> node app/tests/sweep.js   (build first). MODES= and PROMO= work as in journey.js */
const { open, go, overflow, state, redraw } = require('./helper');
const PAGES = ['desk', 'backstage', 'career', 'booking', 'roster', 'locker', 'titles', 'market', 'storylines', 'history', 'sheet', 'feed', 'boards', 'manage', 'house', 'deals', 'overview', 'finances', 'world'];
const PLAY = (S, n) => { for (let w = 0; w < n && !S.over; w++) { S.inbox.filter(e => !e.done).forEach(e => GP.resolveEvent(S, e.id, 0)); if (S.owner.pending) GP.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); while (S.qi < S.queue.length) { const c = GP.suggest(S), pr = GP.preShow(S, c); if (pr) GP.resolvePre(S, c, 0); GP.runPlayerShow(S, c); } GP.endWeek(S); } };
(async () => {
  let bad = 0; const heights = [];
  for (const mode of (process.env.MODES || 'desk').split(',')) {
    const { browser, page, errs } = await open({ mode, promo: process.env.PROMO || 'pdw' });
    await state(page, PLAY, 29); await redraw(page);
    const week = await state(page, S => S.week), over = await state(page, S => !!S.over);
    const problems = [];
    const tall = [];
    for (const p of PAGES) { await go(page, p); await page.waitForTimeout(120); const o = await overflow(page); if (o) problems.push(p + ': ' + o.slice(0, 160));
      tall.push([p, await page.evaluate(() => Math.round(document.documentElement.scrollHeight / window.innerHeight * 10) / 10)]); }
    // how many screens tall each page is (NEXT.md job 2): reported, not failed, until the long pages are converted
    if (mode !== 'tv') { const lim = mode === 'desk' ? 3 : 4, rows = tall.map(t => t[0].padEnd(12) + String(t[1]).padStart(5) + (t[1] > lim ? '  over ' + lim : '')).join('\n');
      console.log('\n' + mode + ': page height in screens\n' + rows + '\n'); heights.push(mode + ' (' + process.env.PROMO + ', week ' + week + ')\n' + rows); }
    console.log(mode.padEnd(6), 'week ' + week + (over ? ' (game over)' : ''), problems.length ? 'FAIL' : 'ok', problems.join(' | '), errs.length ? 'ERRORS ' + errs.join(' | ') : '');
    if (problems.length || errs.length) bad++;
    await browser.close();
  }
  if (heights.length && process.env.HEIGHTS) require('fs').writeFileSync(process.env.HEIGHTS, 'Page heights in screens, from app/tests/sweep.js. Limit: 3 on a desk, 4 on a tablet.\n\n' + heights.join('\n\n') + '\n');
  console.log(bad ? 'FAILED ' + bad : 'sweep ok'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
