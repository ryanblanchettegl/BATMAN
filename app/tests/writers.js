/* The writers' room on screen: a pitch on the desk answered in its pop-up, and the room in Company, Overview.
   Run: NODE_PATH=... node app/tests/writers.js */
const { open, go, fits, redraw } = require('./helper');
(async () => {
  const fails = [], ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
  for (const mode of (process.env.MODES || 'desk,tablet,tv').split(',')) {
    const { browser, page, errs } = await open({ mode, letter: false });
    await page.evaluate(() => { const S = window.EWF_DEBUG.state(), E = window.GP; for (let k = 0; k < 4 && !S.inbox.some(e => e.type === 'wroom' && !e.done); k++) { S.qi = S.queue.length; E.endWeek(S); } S.inbox.forEach(e => { if (e.type !== 'wroom') e.done = true; }); });
    await redraw(page); await go(page, 'desk'); await page.waitForTimeout(150);
    ok(/writers’ room/.test(await page.$eval('[data-t="fire"]', e => e.innerText)), mode + ': the pitch is on the desk');
    const id = await page.evaluate(() => window.EWF_DEBUG.state().inbox.find(e => e.type === 'wroom' && !e.done).id);
    await page.click('[data-t="ev-open"][data-id="' + id + '"]'); await page.waitForTimeout(500);
    const btns = await page.$$('.win button'); ok(btns.length >= 3, mode + ': the pop-up offers the pitches');
    await page.evaluate(i => { const S = window.EWF_DEBUG.state(); window.GP.resolveEvent(S, i, 0); window.EWF_DEBUG.render(); }, id);
    await page.keyboard.press('Escape');
    await go(page, 'overview'); await page.click('[data-t="ov-sec"][data-v="secrets"]'); await page.waitForTimeout(100);
    const t = await page.$eval('[data-t="writers"]', e => e.innerText).catch(() => '');
    ok(/head writer/.test(t) && /writes/.test(t), mode + ': Company, Overview lists the writers');
    const f = await fits(page); ok(!f || !f.length, mode + ': it fits ' + JSON.stringify(f));
    ok(!errs.length, mode + ': no errors ' + errs.join(' | '));
    await browser.close();
  }
  console.log(fails.length ? fails.length + ' failed' : 'writers: all passed'); process.exit(fails.length ? 1 : 0);
})();
