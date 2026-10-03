/* Saves: reload and Continue gives the same game (tweak 19); an old save missing newer fields still loads and plays a week (tweak 20).
   Run:  NODE_PATH=<dir containing playwright> node app/tests/save.js   (build first) */
const { open, go, state, redraw } = require('./helper');
let bad = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) bad++; };
const PLAY = (S, n) => { for (let w = 0; w < n && !S.over; w++) { S.inbox.filter(e => !e.done).forEach(e => GP.resolveEvent(S, e.id, 0)); if (S.owner.pending) GP.setCreed(S, { style: 'merit', roots: 'tradition', pledge: 'stable' }); while (S.qi < S.queue.length) { const c = GP.suggest(S), pr = GP.preShow(S, c); if (pr) GP.resolvePre(S, c, 0); GP.runPlayerShow(S, c); } GP.endWeek(S); } };
const KEY = 'ewf9000-save-4';
async function cont(page) { await page.reload(); await page.waitForSelector('.logo-box'); await page.click('[data-t="continue"]'); await page.waitForSelector('main.main'); }
const snap = page => state(page, S => ({ week: S.week, cash: S.promos[S.player].cash, roster: S.w.filter(w => w.promo === S.player).length, player: S.player }));
(async () => {
  {
    const { browser, page, errs } = await open({ mode: 'desk', promo: 'pdw' });
    await state(page, PLAY, 3); await redraw(page);
    await page.evaluate(k => localStorage.setItem(k, JSON.stringify(window.EWF_DEBUG.state())), KEY);
    const a = await snap(page); await cont(page); const b = await snap(page);
    ok(JSON.stringify(a) === JSON.stringify(b), 'reload and Continue keep the game: ' + JSON.stringify(a) + ' / ' + JSON.stringify(b));
    ok(errs.length === 0, 'no errors (reload): ' + errs.join(' | '));
    await browser.close();
  }
  {
    const { browser, page, errs } = await open({ mode: 'desk', promo: 'pdw' });
    await state(page, PLAY, 2);
    await page.evaluate(k => { const S = window.EWF_DEBUG.state(); Object.keys(S.promos).forEach(id => { delete S.promos[id].model; }); delete S.apLog; delete S.cards; S.w.forEach(w => { delete w.jw; }); localStorage.setItem(k, JSON.stringify(S)); }, KEY);
    await cont(page);
    const w0 = (await snap(page)).week;
    await state(page, PLAY, 1); await redraw(page);
    const w1 = (await snap(page)).week;
    ok(w1 === w0 + 1, 'an old save without model, apLog, jw or cards plays a week: ' + w0 + ' -> ' + w1);
    await go(page, 'desk'); await go(page, 'manage'); await go(page, 'roster');
    ok(errs.length === 0, 'no errors (old save): ' + errs.join(' | '));
    await browser.close();
  }
  console.log(bad ? 'FAILED ' + bad : 'save ok'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
