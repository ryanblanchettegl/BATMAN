/* The match pop-up (roadmap 5): one window books a whole match, with the road agent's read at the bottom.  Run: NODE_PATH=... node app/tests/matchwin.js */
const { open, go, fits } = require('./helper');
(async () => {
  const fails = [], ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
  for (const mode of (process.env.MODES || 'desk,tv').split(',')) {
    const { browser, page, errs } = await open({ mode, letter: false });
    await go(page, 'booking'); await page.click('[data-t="suggest"]');
    await page.click('.sheet .seg[data-m="1"]'); await page.waitForTimeout(80);
    await page.click('[data-t="match-pop"]'); await page.waitForTimeout(80);
    ok(await page.$('.win #m1-type') && await page.$('.win #m1-len') && await page.$('.win #m1-call'), mode + ': the pop-up holds the type, the length and the finish');
    ok(!!(await page.$('.win [data-t="mw-agent"]')) || /agent will say/.test(await page.$eval('.win', e => e.innerText)), mode + ': the road agent speaks at the bottom');
    await page.selectOption('.win #m1-len', 'L'); await page.waitForTimeout(60);
    ok(await page.evaluate(() => window.EWF_DEBUG.state().card[1].len) === 'L', mode + ': a choice in the pop-up changes the match');
    await page.click('.win [data-t="mw-down"]'); await page.waitForTimeout(60);
    ok(/Match 3 of/.test(await page.$eval('.win', e => e.innerText)) && await page.evaluate(() => window.EWF_DEBUG.state().card[2].len) === 'L', mode + ': Later moves it and the pop-up follows');
    const f = await fits(page); ok(!f || !f.length, mode + ': the pop-up fits ' + JSON.stringify(f));
    ok(!errs.length, mode + ': no errors ' + errs.join(' | '));
    await browser.close();
  }
  console.log(fails.length ? fails.length + ' failed' : 'matchwin: all passed'); process.exit(fails.length ? 1 : 0);
})();
