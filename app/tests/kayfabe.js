/* The kayfabe layer on screen: a line in the desk's week in full when secrets are kept, and the readout in Company, Overview.
   Run: NODE_PATH=... node app/tests/kayfabe.js */
const { open, go, fits, redraw } = require('./helper');
(async () => {
  const fails = [], ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
  for (const mode of (process.env.MODES || 'desk,big,tv').split(',')) {
    const { browser, page, errs } = await open({ mode, letter: false });
    await page.evaluate(() => { const S = window.EWF_DEBUG.state(), E = window.GP; const w = E.rosterOf(S, S.player).filter(x => !x.nw).sort((a, b) => b.ovr - a.ovr)[0]; w.morale = 20; S.qi = S.queue.length; E.endWeek(S); w.morale = 20; S.qi = S.queue.length; E.endWeek(S); S.inbox.forEach(e => { e.done = true; }); if (!E.kayfabe(S).kept.length) S.kf.prot = 50; });
    await redraw(page); await go(page, 'desk'); await page.waitForTimeout(100);
    // the line about the secrets is in the week in full, under Worth knowing (the Map Board keeps the desk itself short)
    await page.click('[data-t="desk-more"]'); await page.click('[data-t="more-tab"][data-v="know"]');
    await page.waitForSelector('[data-t="kf-line"]', { timeout: 3000 }).catch(() => null);
    const line = await page.$eval('[data-t="kf-line"]', e => e.innerText).catch(() => '');
    ok(/Secrets:/.test(line), mode + ': the week in full has a line about the secrets: ' + line);
    await page.keyboard.press('Escape');
    const f = await fits(page); ok(!f || !f.length, mode + ': the desk fits ' + JSON.stringify(f));
    await go(page, 'overview'); await page.click('[data-t="ov-sec"][data-v="secrets"]'); await page.waitForTimeout(100);
    const t = await page.$eval('main', e => e.innerText);  
    ok(/Behind the curtain/i.test(t) && /Kept for now/i.test(t) && /miserable/.test(t + (await page.evaluate(() => JSON.stringify(window.EWF_DEBUG.state().kf.leaks)))), mode + ': Company, Overview shows what is kept and what the public believes');
    const f2 = await fits(page); ok(!f2 || !f2.length, mode + ': it fits ' + JSON.stringify(f2));
    ok(!errs.length, mode + ': no errors ' + errs.join(' | '));
    await browser.close();
  }
  console.log(fails.length ? fails.length + ' failed' : 'kayfabe: all passed'); process.exit(fails.length ? 1 : 0);
})();
