/* Post-mortems on screen: the month in review on the desk and its pop-up, the season in review in History.
   Run: NODE_PATH=... node app/tests/postmortem.js */
const { open, go, fits, redraw } = require('./helper');
(async () => {
  const fails = [], ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
  for (const mode of (process.env.MODES || 'desk,big,tv').split(',')) {
    const { browser, page, errs } = await open({ mode, letter: false });
    await page.evaluate(() => { const S = window.EWF_DEBUG.state(), E = window.GP; for (let k = 0; k < 4; k++) { S.qi = S.queue.length; E.endWeek(S); } S.inbox.forEach(e => { e.done = true; }); });
    await redraw(page); await go(page, 'desk'); await page.waitForTimeout(150);
    ok(await page.$('[data-t="pm-line"]') !== null, mode + ': the month in review is on the desk');
    const f = await fits(page); ok(!f || !f.length, mode + ': the desk fits ' + JSON.stringify(f));
    await page.click('[data-t="pm-open"]'); await page.waitForTimeout(150);
    const t = await page.$eval('[data-t="pm-body"]', e => e.innerText).catch(() => '');
    ok(/went well/i.test(t) && /went badly/i.test(t), mode + ': the pop-up says what went well and what went badly');
    const f2 = await fits(page); ok(!f2 || !f2.length, mode + ': the pop-up fits ' + JSON.stringify(f2));
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    ok(await page.$('[data-t="pm-line"]') === null, mode + ': once read, it leaves the desk');
    // the season itself is tested headless (test-postmortem.js); here, that History shows one
    await page.evaluate(() => { const S = window.EWF_DEBUG.state(); S.pm.season = [Object.assign({}, S.pm.month[0], { label: 'The season to test' })]; });
    await redraw(page); await go(page, 'history'); await page.click('[data-t="hist-sec"][data-v="chron"]'); await page.waitForTimeout(150);
    ok(await page.$('[data-t="pm-season"]') !== null, mode + ': History keeps the season in review');
    const f3 = await fits(page); ok(!f3 || !f3.length, mode + ': History fits ' + JSON.stringify(f3));
    ok(!errs.length, mode + ': no errors ' + errs.join(' | '));
    await browser.close();
  }
  console.log(fails.length ? fails.length + ' failed' : 'postmortem: all passed'); process.exit(fails.length ? 1 : 0);
})();
