/* Venue personality on screen: the building's main quirk on the desk, and its full list in What could happen tonight.
   Run: NODE_PATH=... node app/tests/venues.js */
const { open, go, fits } = require('./helper');
(async () => {
  const fails = [], ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
  for (const mode of (process.env.MODES || 'desk,big,tv').split(',')) {
    const { browser, page, errs } = await open({ mode, letter: false });
    await go(page, 'desk'); await page.waitForTimeout(100);
    const B = await page.evaluate(() => window.GP.buildingWords(window.EWF_DEBUG.state()));
    const g = await page.$eval('[data-t="road-building"]', e => e.innerText);
    ok(B && (B.short === 'nothing special' || g.toLowerCase().indexOf(B.short.toLowerCase()) >= 0), mode + ': the desk names the building’s quirk: ' + g.split('\n')[0]);
    const f = await fits(page); ok(!f || !f.length, mode + ': the desk fits ' + JSON.stringify(f));
    await go(page, 'booking'); await page.click('[data-t="suggest"]'); await page.click('[data-t="could"]'); await page.waitForTimeout(100);
    ok(!B.words.length || await page.$('[data-t="could-building"]') !== null, mode + ': What could happen tonight lists the building');
    const f2 = await fits(page); ok(!f2 || !f2.length, mode + ': it fits ' + JSON.stringify(f2));
    ok(!errs.length, mode + ': no errors ' + errs.join(' | '));
    await browser.close();
  }
  console.log(fails.length ? fails.length + ' failed' : 'venues: all passed'); process.exit(fails.length ? 1 : 0);
})();
