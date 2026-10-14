/* Makes the README pictures in docs/screens/: eight weeks into a game, every main page, a show on the air and After the show.
   Build first: node build.js     Run: NODE_PATH=<dir containing playwright> node tools/screenshots.js */
const path = require('path'), fs = require('fs');
const out = path.join(__dirname, '..', 'docs', 'screens');
fs.mkdirSync(out, { recursive: true });
process.env.SHOTS = out;
const { open, go, shot, state, redraw } = require('../app/tests/helper');
const settle = async page => { await page.waitForTimeout(500); await page.waitForFunction(() => !document.querySelector('.status.toast'), null, { timeout: 20000 }).catch(() => {}); };
(async () => {
  const { browser, page } = await open({ mode: 'desk', promo: 'pdw' });
  await state(page, S => { for (let w = 0; w < 8; w++) { S.inbox.filter(e => !e.done).forEach(e => GP.resolveEvent(S, e.id, 0)); while (S.qi < S.queue.length) { const c = GP.suggest(S), pr = GP.preShow(S, c); if (pr) { GP.resolvePre(S, c, 0); GP.fitShow(S, c); } if (GP.validate(S, c).errors.length) { S.qi++; continue; } GP.runPlayerShow(S, c); } GP.endWeek(S); }
    S.inbox.filter(e => !e.done).forEach(e => GP.resolveEvent(S, e.id, 0)); S.card = GP.suggest(S); });
  await redraw(page);
  for (const p of ['desk', 'backstage', 'storylines', 'booking', 'roster', 'titles', 'web', 'career']) { await go(page, p); await settle(page); await shot(page, p); }
  // a show on the air: a few steps in, then the rest with the safe answers, then After the show
  await go(page, 'booking'); await settle(page);
  const has = async s => !!(await page.$(s));
  for (let i = 0; i < 400 && !(await has('#live')); i++) { await page.click('[data-t="advance"]'); await page.waitForTimeout(150); if (await has('[data-t="live-pick"]')) break; }
  for (let i = 0, seen = 0; i < 400 && seen < 14; i++) {
    if (await has('[data-t="live-call"]')) { await page.waitForTimeout(450); const c = await page.evaluate(() => window.EWF_DEBUG.state().live.ev.safe || 0); await page.click('[data-t="live-pick"][data-c="' + c + '"]'); continue; }
    if (await has('#live[data-v="signoff"]')) break;
    await page.click('[data-t="advance"]'); await page.waitForTimeout(120); seen++;
  }
  await settle(page); await shot(page, 'live');
  for (let i = 0; i < 900; i++) {
    if (await has('[data-t="live-call"]')) { await page.waitForTimeout(450); const c = await page.evaluate(() => window.EWF_DEBUG.state().live.ev.safe || 0); await page.click('[data-t="live-pick"][data-c="' + c + '"]'); continue; }
    if (await has('#live[data-v="signoff"]')) { await page.click('[data-t="advance"]'); break; }
    if (await has('[data-t="live-skip"]')) { await page.click('[data-t="live-skip"]'); continue; }
    await page.click('[data-t="advance"]'); await page.waitForTimeout(40);
  }
  await settle(page); await shot(page, 'after');
  await browser.close();
  console.log('wrote ' + fs.readdirSync(out).join(', '));
})().catch(e => { console.error(e); process.exit(1); });
