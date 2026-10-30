/* A match on the Clock Wall: its options in pop-ups, the road agent beside it, Earlier and Later, a lock, a drag,
   and What could happen tonight.  Run: NODE_PATH=... node app/tests/matchwin.js */
const { open, go, fits } = require('./helper');
(async () => {
  const fails = [], ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
  for (const mode of (process.env.MODES || 'desk').split(',')) {
    const { browser, page, errs } = await open({ mode, letter: false });
    const card = () => page.evaluate(() => window.EWF_DEBUG.state().card);
    await go(page, 'booking'); await page.click('[data-t="suggest"]');
    await page.click('[data-t="edit"][data-v="1"]'); await page.waitForTimeout(80);
    ok(await page.$('[data-t="wall-tile"][data-v="type"]') && await page.$('[data-t="wall-tile"][data-v="length"]') && await page.$('[data-t="wall-tile"][data-v="finish"]'), mode + ': the picked match shows its type, length and finish as tiles');
    ok(!!(await page.$('[data-t="agent-say"][data-v="1"]')), mode + ': the road agent speaks beside the wall');
    await page.click('[data-t="wall-tile"][data-v="length"]'); await page.selectOption('.win #m1-len', 'L'); await page.waitForTimeout(60);
    ok((await card())[1].len === 'L', mode + ': a choice in the pop-up changes the match');
    const f0 = await fits(page); ok(!f0 || !f0.length, mode + ': the pop-up fits ' + JSON.stringify(f0));
    await page.click('.win #modal-ok');
    await page.click('[data-t="down"]'); await page.waitForTimeout(60);
    ok((await card())[2].len === 'L' && await page.$('[data-t="edit"][data-v="2"][aria-pressed="true"]'), mode + ': Later moves it and the pick follows');
    await page.click('[data-t="wall-lock"]'); await page.waitForTimeout(60);
    ok((await card())[2].lock && /Locked/.test(await page.$eval('[data-t="wall-piece"][data-v="2"]', e => e.innerText)), mode + ': a match can be locked in its place, and the wall says so');
    await page.click('[data-t="up"]'); await page.waitForTimeout(60);
    ok((await card())[2].len === 'L', mode + ': a locked match does not move');
    await page.click('[data-t="wall-lock"]');
    const id0 = JSON.stringify((await card())[0].sides);
    await page.dragAndDrop('[data-t="wall-piece"][data-v="0"] .cw-grip', '[data-t="wall-piece"][data-v="1"]'); await page.waitForTimeout(80);
    ok(JSON.stringify((await card())[1].sides) === id0, mode + ': a match can be dragged to another place');
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
