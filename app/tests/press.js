/* The press on screen: a tile on Manage, Deals opens the reporters; court one and the pop-up says what changed.
   Run: NODE_PATH=... node app/tests/press.js */
const { open, go, fits } = require('./helper');
(async () => {
  const fails = [], ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
  for (const mode of (process.env.MODES || 'desk,big,tv').split(',')) {
    const { browser, page, errs } = await open({ mode, letter: false });
    await go(page, 'deals'); await page.waitForTimeout(100);
    const f = await fits(page); ok(!f || !f.length, mode + ': Deals still fits with the press tile ' + JSON.stringify(f));
    await page.click('[data-t="mng"][data-v="press"]'); await page.waitForTimeout(100);
    const t = await page.$eval('.win', e => e.innerText);
    ok(/reporters/.test(t) && (await page.$$('[data-t="press-do"]')).length >= 12, mode + ': the pop-up lists four reporters with three answers each');
    const w0 = await page.evaluate(() => window.EWF_DEBUG.state().press.rep[0].warm);
    await page.click('[data-t="press-do"][data-id="0"][data-k="court"]'); await page.waitForTimeout(100);
    ok(await page.evaluate(() => window.EWF_DEBUG.state().press.rep[0].warm) > w0, mode + ': taking a reporter to dinner warms them');
    const f2 = await fits(page); ok(!f2 || !f2.length, mode + ': the pop-up fits ' + JSON.stringify(f2));
    ok(!errs.length, mode + ': no errors ' + errs.join(' | '));
    await browser.close();
  }
  console.log(fails.length ? fails.length + ' failed' : 'press: all passed'); process.exit(fails.length ? 1 : 0);
})();
