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
    await page.click('.win [data-t="mw-lock"]'); await page.waitForTimeout(60);
    ok(await page.evaluate(() => !!window.EWF_DEBUG.state().card[2].lock) && /Locked/.test(await page.$eval('.sheet .seg[data-m="2"]', e => e.innerText)), mode + ': a match can be locked in its place, and the sheet says so');
    await page.click('.win [data-t="mw-up"]'); await page.waitForTimeout(60);
    ok(await page.evaluate(() => window.EWF_DEBUG.state().card[2].len) === 'L', mode + ': a locked match does not move');
    const f = await fits(page); ok(!f || !f.length, mode + ': the pop-up fits ' + JSON.stringify(f));
    await page.click('.win [data-t="mw-lock"]'); await page.click('.win #modal-ok'); await page.waitForTimeout(60);
    const id0 = await page.evaluate(() => JSON.stringify(window.EWF_DEBUG.state().card[0].sides));
    await page.dragAndDrop('.sheet .seg[data-m="0"]', '.sheet .seg[data-m="1"]'); await page.waitForTimeout(80);
    ok(await page.evaluate(() => JSON.stringify(window.EWF_DEBUG.state().card[1].sides)) === id0, mode + ': a match can be dragged to another place');
    await page.click('[data-t="could"]'); await page.waitForTimeout(80);
    const cw = await page.$eval('.win', e => e.innerText);
    ok(/Moments that could happen/.test(cw) && /Who is at risk/.test(cw) && /What it sets up/.test(cw) && /leaves cold/.test(cw) && !/%|★/.test(cw), mode + ': What could happen tonight has its four parts, in words');
    const f2 = await fits(page); ok(!f2 || !f2.length, mode + ': it fits ' + JSON.stringify(f2));
    await page.click('.win #modal-ok');
    ok(!errs.length, mode + ': no errors ' + errs.join(' | '));
    await browser.close();
  }
  console.log(fails.length ? fails.length + ' failed' : 'matchwin: all passed'); process.exit(fails.length ? 1 : 0);
})();
