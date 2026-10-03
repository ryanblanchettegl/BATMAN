/* Makes the README pictures in docs/screens/: the desk, and a show report.
   Build first: node build.js     Run: NODE_PATH=<dir containing playwright> node tools/screenshots.js */
const path = require('path'), fs = require('fs');
const out = path.join(__dirname, '..', 'docs', 'screens');
fs.mkdirSync(out, { recursive: true });
process.env.SHOTS = out;
const { open, go, shot, state, redraw } = require('../app/tests/helper');
(async () => {
  const { browser, page } = await open({ mode: 'desk', promo: 'pdw' });
  await state(page, S => { S.inbox.filter(e => !e.done).forEach(e => GP.resolveEvent(S, e.id, 0)); const c = GP.suggest(S), pr = GP.preShow(S, c); if (pr) GP.resolvePre(S, c, 0); GP.runPlayerShow(S, c); });
  await redraw(page); await go(page, 'desk'); await page.waitForTimeout(400);
  await page.waitForFunction(() => !document.querySelector('.status.toast'), null, { timeout: 20000 }).catch(() => {});
  await shot(page, 'desk');
  await page.click('[data-t="report"]'); await page.waitForTimeout(400);
  await shot(page, 'report');
  await browser.close();
  console.log('wrote ' + path.join(out, 'desk.png') + ' and report.png');
})().catch(e => { console.error(e); process.exit(1); });
